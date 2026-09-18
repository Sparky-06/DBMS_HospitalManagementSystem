const { pool } = require('../config/db');

/**
 * Employee Controller
 * Manages Employee CRUD, derived age, and multivalued employee phone numbers.
 */
class EmployeeController {
  // GET /api/employees
  async getAllEmployees(req, res, next) {
    try {
      const query = `
        SELECT 
          e.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary,
          (SELECT GROUP_CONCAT(Mob_No SEPARATOR ', ') FROM employee_phone WHERE Emp_ID = e.Emp_ID) AS mob_no_str,
          (CASE 
            WHEN d.Emp_ID IS NOT NULL THEN 'Doctor'
            WHEN n.Emp_ID IS NOT NULL THEN 'Nurse'
            ELSE 'Staff'
          END) AS role,
          d.Department AS department,
          d.Qualification AS qualification,
          e.created_at
        FROM employee e
        LEFT JOIN doctor d ON e.Emp_ID = d.Emp_ID
        LEFT JOIN nurse n ON e.Emp_ID = n.Emp_ID
        ORDER BY e.Emp_ID ASC
      `;

      const [rows] = await pool.query(query);
      const employees = rows.map(emp => ({
        ...emp,
        mob_no: emp.mob_no_str ? emp.mob_no_str.split(', ') : []
      }));

      return res.status(200).json({
        success: true,
        data: employees,
        message: 'Employees fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/employees/:empId
  async getEmployeeById(req, res, next) {
    try {
      const { empId } = req.params;
      const query = `
        SELECT 
          e.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary,
          (CASE 
            WHEN d.Emp_ID IS NOT NULL THEN 'Doctor'
            WHEN n.Emp_ID IS NOT NULL THEN 'Nurse'
            ELSE 'Staff'
          END) AS role,
          d.Department AS department,
          d.Qualification AS qualification,
          e.created_at,
          e.updated_at
        FROM employee e
        LEFT JOIN doctor d ON e.Emp_ID = d.Emp_ID
        LEFT JOIN nurse n ON e.Emp_ID = n.Emp_ID
        WHERE e.Emp_ID = ?
      `;

      const [rows] = await pool.query(query, [empId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Employee with ID ${empId} not found`,
            details: []
          }
        });
      }

      const employee = rows[0];
      const [phones] = await pool.query(
        'SELECT Mob_No AS mob_no FROM employee_phone WHERE Emp_ID = ?',
        [empId]
      );
      employee.mob_no = phones.map(p => p.mob_no);

      return res.status(200).json({
        success: true,
        data: employee,
        message: 'Employee fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/employees
  async createEmployee(req, res, next) {
    const connection = await pool.getConnection();
    try {
      const { emp_id, fname, mname = null, lname, city, state, dob, salary, mob_no = [] } = req.body;

      await connection.beginTransaction();

      const insertEmpQuery = `
        INSERT INTO employee (Emp_ID, FName, MName, LName, City, State, DOB, Salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(insertEmpQuery, [emp_id, fname, mname, lname, city, state, dob, salary]);

      if (Array.isArray(mob_no) && mob_no.length > 0) {
        const phoneValues = mob_no.map(phone => [emp_id, phone]);
        await connection.query(
          'INSERT INTO employee_phone (Emp_ID, Mob_No) VALUES ?',
          [phoneValues]
        );
      }

      await connection.commit();

      const [createdRows] = await pool.query(`
        SELECT 
          Emp_ID AS emp_id, FName AS fname, MName AS mname, LName AS lname, 
          City AS city, State AS state, DOB AS dob, 
          TIMESTAMPDIFF(YEAR, DOB, CURDATE()) AS age, Salary AS salary
        FROM employee WHERE Emp_ID = ?
      `, [emp_id]);

      const created = createdRows[0];
      created.mob_no = mob_no;

      return res.status(201).json({
        success: true,
        data: created,
        message: 'Employee created successfully'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }

  // PUT /api/employees/:empId
  async updateEmployee(req, res, next) {
    const connection = await pool.getConnection();
    try {
      const { empId } = req.params;
      const { fname, mname, lname, city, state, dob, salary, mob_no } = req.body;

      await connection.beginTransaction();

      const fields = [];
      const values = [];

      if (fname !== undefined) { fields.push('FName = ?'); values.push(fname); }
      if (mname !== undefined) { fields.push('MName = ?'); values.push(mname); }
      if (lname !== undefined) { fields.push('LName = ?'); values.push(lname); }
      if (city !== undefined) { fields.push('City = ?'); values.push(city); }
      if (state !== undefined) { fields.push('State = ?'); values.push(state); }
      if (dob !== undefined) { fields.push('DOB = ?'); values.push(dob); }
      if (salary !== undefined) { fields.push('Salary = ?'); values.push(salary); }

      if (fields.length > 0) {
        values.push(empId);
        const [updateResult] = await connection.query(
          `UPDATE employee SET ${fields.join(', ')} WHERE Emp_ID = ?`,
          values
        );
        if (updateResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Employee with ID ${empId} not found`,
              details: []
            }
          });
        }
      }

      // If mob_no array was passed, replace phone numbers
      if (Array.isArray(mob_no)) {
        await connection.query('DELETE FROM employee_phone WHERE Emp_ID = ?', [empId]);
        if (mob_no.length > 0) {
          const phoneValues = mob_no.map(phone => [empId, phone]);
          await connection.query(
            'INSERT INTO employee_phone (Emp_ID, Mob_No) VALUES ?',
            [phoneValues]
          );
        }
      }

      await connection.commit();

      const [updatedRows] = await pool.query(`
        SELECT 
          Emp_ID AS emp_id, FName AS fname, MName AS mname, LName AS lname, 
          City AS city, State AS state, DOB AS dob, 
          TIMESTAMPDIFF(YEAR, DOB, CURDATE()) AS age, Salary AS salary
        FROM employee WHERE Emp_ID = ?
      `, [empId]);

      const updated = updatedRows[0];
      const [phones] = await pool.query(
        'SELECT Mob_No AS mob_no FROM employee_phone WHERE Emp_ID = ?',
        [empId]
      );
      updated.mob_no = phones.map(p => p.mob_no);

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Employee updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }

  // DELETE /api/employees/:empId
  async deleteEmployee(req, res, next) {
    try {
      const { empId } = req.params;
      const [result] = await pool.query('DELETE FROM employee WHERE Emp_ID = ?', [empId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Employee with ID ${empId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id: empId },
        message: 'Employee deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
