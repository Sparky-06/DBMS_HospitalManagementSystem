const { pool } = require('../config/db');

/**
 * Doctor Controller
 * Manages Doctor specialization of Employee, enforcing disjoint ISA constraint.
 */
class DoctorController {
  // GET /api/doctors
  async getAllDoctors(req, res, next) {
    try {
      const query = `
        SELECT 
          d.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          d.Department AS department, 
          d.Qualification AS qualification, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary,
          (SELECT GROUP_CONCAT(Mob_No SEPARATOR ', ') FROM employee_phone WHERE Emp_ID = d.Emp_ID) AS mob_no_str
        FROM doctor d
        JOIN employee e ON d.Emp_ID = e.Emp_ID
        ORDER BY d.Emp_ID ASC
      `;

      const [rows] = await pool.query(query);
      const doctors = rows.map(doc => ({
        ...doc,
        mob_no: doc.mob_no_str ? doc.mob_no_str.split(', ') : []
      }));

      return res.status(200).json({
        success: true,
        data: doctors,
        message: 'Doctors fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/doctors/:empId
  async getDoctorById(req, res, next) {
    try {
      const { empId } = req.params;
      const query = `
        SELECT 
          d.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          d.Department AS department, 
          d.Qualification AS qualification, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary
        FROM doctor d
        JOIN employee e ON d.Emp_ID = e.Emp_ID
        WHERE d.Emp_ID = ?
      `;

      const [rows] = await pool.query(query, [empId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Doctor with ID ${empId} not found`,
            details: []
          }
        });
      }

      const doctor = rows[0];
      const [phones] = await pool.query(
        'SELECT Mob_No AS mob_no FROM employee_phone WHERE Emp_ID = ?',
        [empId]
      );
      doctor.mob_no = phones.map(p => p.mob_no);

      // Also get upcoming/recent consultations
      const [consultations] = await pool.query(`
        SELECT 
          c.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          c.Consultation_Date AS consultation_date,
          c.Consultation_Time AS consultation_time,
          c.Notes AS notes
        FROM consults c
        JOIN patient p ON c.P_ID = p.P_ID
        WHERE c.Emp_ID = ?
        ORDER BY c.Consultation_Date DESC, c.Consultation_Time DESC
        LIMIT 10
      `, [empId]);
      doctor.recent_consultations = consultations;

      return res.status(200).json({
        success: true,
        data: doctor,
        message: 'Doctor fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/doctors
  async createDoctor(req, res, next) {
    try {
      const { emp_id, department, qualification } = req.body;

      // 1. Check parent Employee exists
      const [empRows] = await pool.query('SELECT Emp_ID FROM employee WHERE Emp_ID = ?', [emp_id]);
      if (empRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Cannot designate Doctor: Employee with ID ${emp_id} does not exist`,
            details: []
          }
        });
      }

      // 2. Enforce Disjoint ISA (An employee cannot be both a Doctor and a Nurse)
      const [nurseRows] = await pool.query('SELECT Emp_ID FROM nurse WHERE Emp_ID = ?', [emp_id]);
      if (nurseRows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DISJOINT_SPECIALIZATION_ERROR',
            message: `Employee ${emp_id} is already designated as a Nurse. Disjoint constraint prevents simultaneous Doctor designation.`,
            details: []
          }
        });
      }

      await pool.query(
        'INSERT INTO doctor (Emp_ID, Department, Qualification) VALUES (?, ?, ?)',
        [emp_id, department, qualification]
      );

      const [doctorRows] = await pool.query(`
        SELECT 
          d.Emp_ID AS emp_id, e.FName AS fname, e.LName AS lname, 
          d.Department AS department, d.Qualification AS qualification
        FROM doctor d JOIN employee e ON d.Emp_ID = e.Emp_ID
        WHERE d.Emp_ID = ?
      `, [emp_id]);

      return res.status(201).json({
        success: true,
        data: doctorRows[0],
        message: 'Doctor registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/doctors/:empId
  async updateDoctor(req, res, next) {
    try {
      const { empId } = req.params;
      const { department, qualification } = req.body;

      const fields = [];
      const values = [];

      if (department !== undefined) { fields.push('Department = ?'); values.push(department); }
      if (qualification !== undefined) { fields.push('Qualification = ?'); values.push(qualification); }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No fields provided for update',
            details: []
          }
        });
      }

      values.push(empId);
      const [result] = await pool.query(
        `UPDATE doctor SET ${fields.join(', ')} WHERE Emp_ID = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Doctor with ID ${empId} not found`,
            details: []
          }
        });
      }

      const [updatedRows] = await pool.query(`
        SELECT d.Emp_ID AS emp_id, d.Department AS department, d.Qualification AS qualification
        FROM doctor d WHERE d.Emp_ID = ?
      `, [empId]);

      return res.status(200).json({
        success: true,
        data: updatedRows[0],
        message: 'Doctor updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/doctors/:empId
  async deleteDoctor(req, res, next) {
    try {
      const { empId } = req.params;
      const [result] = await pool.query('DELETE FROM doctor WHERE Emp_ID = ?', [empId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Doctor with ID ${empId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id: empId },
        message: 'Doctor removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();
