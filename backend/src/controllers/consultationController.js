const { pool } = require('../config/db');

/**
 * Consultation Controller
 * Manages Doctor M:N Patient consultations with Date and Time composite keys.
 */
class ConsultationController {
  // GET /api/consultations
  async getAllConsultations(req, res, next) {
    try {
      const { p_id, emp_id, date } = req.query;
      let sql = `
        SELECT 
          c.Emp_ID AS emp_id,
          CONCAT('Dr. ', e.FName, ' ', e.LName) AS doctor_name,
          d.Department AS department,
          c.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          c.Consultation_Date AS consultation_date,
          c.Consultation_Time AS consultation_time,
          c.Notes AS notes
        FROM consults c
        JOIN doctor d ON c.Emp_ID = d.Emp_ID
        JOIN employee e ON d.Emp_ID = e.Emp_ID
        JOIN patient p ON c.P_ID = p.P_ID
      `;

      const conditions = [];
      const params = [];

      if (p_id) { conditions.push('c.P_ID = ?'); params.push(p_id); }
      if (emp_id) { conditions.push('c.Emp_ID = ?'); params.push(emp_id); }
      if (date) { conditions.push('c.Consultation_Date = ?'); params.push(date); }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY c.Consultation_Date DESC, c.Consultation_Time DESC';

      const [rows] = await pool.query(sql, params);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Consultations fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/consultations
  async createConsultation(req, res, next) {
    try {
      const { emp_id, p_id, consultation_date, consultation_time, notes = null } = req.body;

      // 1. Verify that the employee is a Doctor
      const [docRows] = await pool.query('SELECT Emp_ID FROM doctor WHERE Emp_ID = ?', [emp_id]);
      if (docRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Employee ${emp_id} is not registered as a Doctor. Only doctors can conduct consultations.`,
            details: []
          }
        });
      }

      // 2. Verify that the Patient exists
      const [patientRows] = await pool.query('SELECT P_ID FROM patient WHERE P_ID = ?', [p_id]);
      if (patientRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Patient ${p_id} does not exist`,
            details: []
          }
        });
      }

      const insertSql = `
        INSERT INTO consults (Emp_ID, P_ID, Consultation_Date, Consultation_Time, Notes)
        VALUES (?, ?, ?, ?, ?)
      `;
      await pool.query(insertSql, [emp_id, p_id, consultation_date, consultation_time, notes]);

      return res.status(201).json({
        success: true,
        data: {
          emp_id,
          p_id,
          consultation_date,
          consultation_time,
          notes
        },
        message: 'Consultation scheduled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/consultations
  async updateConsultation(req, res, next) {
    try {
      const { emp_id, p_id, consultation_date, consultation_time, notes } = req.body;

      if (!emp_id || !p_id || !consultation_date || !consultation_time) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All composite key fields (emp_id, p_id, consultation_date, consultation_time) are required',
            details: []
          }
        });
      }

      const [result] = await pool.query(`
        UPDATE consults 
        SET Notes = ? 
        WHERE Emp_ID = ? AND P_ID = ? AND Consultation_Date = ? AND Consultation_Time = ?
      `, [notes, emp_id, p_id, consultation_date, consultation_time]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Consultation record not found',
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id, p_id, consultation_date, consultation_time, notes },
        message: 'Consultation updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/consultations
  async deleteConsultation(req, res, next) {
    try {
      const { emp_id, p_id, consultation_date, consultation_time } = req.body.emp_id ? req.body : req.query;

      if (!emp_id || !p_id || !consultation_date || !consultation_time) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All composite key fields (emp_id, p_id, consultation_date, consultation_time) are required to delete',
            details: []
          }
        });
      }

      const [result] = await pool.query(`
        DELETE FROM consults 
        WHERE Emp_ID = ? AND P_ID = ? AND Consultation_Date = ? AND Consultation_Time = ?
      `, [emp_id, p_id, consultation_date, consultation_time]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Consultation record not found',
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { emp_id, p_id, consultation_date, consultation_time },
        message: 'Consultation cancelled/deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConsultationController();
