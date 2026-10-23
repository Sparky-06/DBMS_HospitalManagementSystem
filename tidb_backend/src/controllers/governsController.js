const { pool } = require('../config/db');

/**
 * Governs Controller
 * Manages Nurse M:N Room shift assignments.
 */
class GovernsController {
  // GET /api/governs
  async getAllGoverns(req, res, next) {
    try {
      const { emp_id, r_id, shift } = req.query;
      let sql = `
        SELECT 
          g.Emp_ID AS emp_id,
          CONCAT('Nurse ', e.FName, ' ', e.LName) AS nurse_name,
          g.R_ID AS r_id,
          r.Type AS room_type,
          g.Shift AS shift
        FROM governs g
        JOIN nurse n ON g.Emp_ID = n.Emp_ID
        JOIN employee e ON n.Emp_ID = e.Emp_ID
        JOIN room r ON g.R_ID = r.R_ID
      `;

      const conditions = [];
      const params = [];

      if (emp_id) { conditions.push('g.Emp_ID = ?'); params.push(emp_id); }
      if (r_id) { conditions.push('g.R_ID = ?'); params.push(r_id); }
      if (shift) { conditions.push('g.Shift = ?'); params.push(shift); }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY g.R_ID ASC, FIELD(g.Shift, "Morning", "Evening", "Night")';

      const [rows] = await pool.query(sql, params);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Nurse shifts fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/governs
  async createGoverns(req, res, next) {
    try {
      const { emp_id, r_id, shift } = req.body;

      // 1. Check if employee is a Nurse
      const [nurseRows] = await pool.query('SELECT Emp_ID FROM nurse WHERE Emp_ID = ?', [emp_id]);
      if (nurseRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Employee ${emp_id} is not registered as a Nurse. Only nurses can govern rooms.`,
            details: []
          }
        });
      }

      // 2. Check room exists
      const [roomRows] = await pool.query('SELECT R_ID FROM room WHERE R_ID = ?', [r_id]);
      if (roomRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Room ${r_id} does not exist`,
            details: []
          }
        });
      }

      await pool.query(
        'INSERT INTO governs (Emp_ID, R_ID, Shift) VALUES (?, ?, ?)',
        [emp_id, r_id, shift]
      );

      return res.status(201).json({
        success: true,
        data: { emp_id, r_id, shift },
        message: 'Nurse shift assigned to room successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/governs
  async deleteGoverns(req, res, next) {
    try {
      const { emp_id, r_id, shift } = req.body.emp_id ? req.body : req.query;

      if (!emp_id || !r_id || !shift) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All composite key fields (emp_id, r_id, shift) are required to delete a shift assignment',
            details: []
          }
        });
      }

      const [result] = await pool.query(
        'DELETE FROM governs WHERE Emp_ID = ? AND R_ID = ? AND Shift = ?',
        [emp_id, r_id, shift]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Governs shift assignment not found',
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id, r_id, shift },
        message: 'Nurse shift assignment removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GovernsController();
