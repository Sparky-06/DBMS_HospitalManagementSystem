const { pool } = require('../config/db');

/**
 * Nurse Controller
 * Manages Nurse specialization of Employee, enforcing disjoint ISA constraint.
 */
class NurseController {
  // GET /api/nurses
  async getAllNurses(req, res, next) {
    try {
      const query = `
        SELECT 
          n.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary,
          (SELECT GROUP_CONCAT(Mob_No SEPARATOR ', ') FROM employee_phone WHERE Emp_ID = n.Emp_ID) AS mob_no_str
        FROM nurse n
        JOIN employee e ON n.Emp_ID = e.Emp_ID
        ORDER BY n.Emp_ID ASC
      `;

      const [rows] = await pool.query(query);
      const nurses = rows.map(nurse => ({
        ...nurse,
        mob_no: nurse.mob_no_str ? nurse.mob_no_str.split(', ') : []
      }));

      return res.status(200).json({
        success: true,
        data: nurses,
        message: 'Nurses fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/nurses/:empId
  async getNurseById(req, res, next) {
    try {
      const { empId } = req.params;
      const query = `
        SELECT 
          n.Emp_ID AS emp_id, 
          e.FName AS fname, 
          e.MName AS mname, 
          e.LName AS lname, 
          e.City AS city, 
          e.State AS state, 
          e.DOB AS dob, 
          TIMESTAMPDIFF(YEAR, e.DOB, CURDATE()) AS age,
          e.Salary AS salary
        FROM nurse n
        JOIN employee e ON n.Emp_ID = e.Emp_ID
        WHERE n.Emp_ID = ?
      `;

      const [rows] = await pool.query(query, [empId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Nurse with ID ${empId} not found`,
            details: []
          }
        });
      }

      const nurse = rows[0];
      const [phones] = await pool.query(
        'SELECT Mob_No AS mob_no FROM employee_phone WHERE Emp_ID = ?',
        [empId]
      );
      nurse.mob_no = phones.map(p => p.mob_no);

      // Governed room shifts
      const [shifts] = await pool.query(`
        SELECT 
          g.R_ID AS r_id, 
          r.Type AS room_type, 
          g.Shift AS shift 
        FROM governs g
        JOIN room r ON g.R_ID = r.R_ID
        WHERE g.Emp_ID = ?
      `, [empId]);
      nurse.shifts = shifts;

      return res.status(200).json({
        success: true,
        data: nurse,
        message: 'Nurse fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/nurses
  async createNurse(req, res, next) {
    try {
      const { emp_id } = req.body;

      // 1. Check parent Employee exists
      const [empRows] = await pool.query('SELECT Emp_ID FROM employee WHERE Emp_ID = ?', [emp_id]);
      if (empRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Cannot designate Nurse: Employee with ID ${emp_id} does not exist`,
            details: []
          }
        });
      }

      // 2. Enforce Disjoint ISA (An employee cannot be both a Doctor and a Nurse)
      const [doctorRows] = await pool.query('SELECT Emp_ID FROM doctor WHERE Emp_ID = ?', [emp_id]);
      if (doctorRows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DISJOINT_SPECIALIZATION_ERROR',
            message: `Employee ${emp_id} is already designated as a Doctor. Disjoint constraint prevents simultaneous Nurse designation.`,
            details: []
          }
        });
      }

      await pool.query('INSERT INTO nurse (Emp_ID) VALUES (?)', [emp_id]);

      const [nurseRows] = await pool.query(`
        SELECT n.Emp_ID AS emp_id, e.FName AS fname, e.LName AS lname
        FROM nurse n JOIN employee e ON n.Emp_ID = e.Emp_ID
        WHERE n.Emp_ID = ?
      `, [emp_id]);

      return res.status(201).json({
        success: true,
        data: nurseRows[0],
        message: 'Nurse registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/nurses/:empId
  async deleteNurse(req, res, next) {
    try {
      const { empId } = req.params;
      const [result] = await pool.query('DELETE FROM nurse WHERE Emp_ID = ?', [empId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Nurse with ID ${empId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id: empId },
        message: 'Nurse removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NurseController();
