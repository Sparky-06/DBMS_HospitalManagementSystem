const { pool } = require('../config/db');

/**
 * Test Report Controller
 * Manages weak entity Test Reports with composite key (P_ID, Test_ID).
 */
class TestReportController {
  // GET /api/test-reports
  async getAllTestReports(req, res, next) {
    try {
      const { test_type } = req.query;
      let sql = `
        SELECT 
          t.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          t.Test_ID AS test_id,
          t.Test_Type AS test_type,
          t.Result AS result,
          t.Report_Date AS report_date
        FROM test_report t
        JOIN patient p ON t.P_ID = p.P_ID
      `;

      const params = [];
      if (test_type) {
        sql += ' WHERE t.Test_Type LIKE ?';
        params.push(`%${test_type}%`);
      }

      sql += ' ORDER BY t.Report_Date DESC';

      const [rows] = await pool.query(sql, params);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Test reports fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId/test-reports
  async getTestReportsByPatient(req, res, next) {
    try {
      const { pId } = req.params;
      const [rows] = await pool.query(`
        SELECT 
          t.P_ID AS p_id,
          t.Test_ID AS test_id,
          t.Test_Type AS test_type,
          t.Result AS result,
          t.Report_Date AS report_date
        FROM test_report t
        WHERE t.P_ID = ?
        ORDER BY t.Report_Date DESC
      `, [pId]);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Patient test reports fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients/:pId/test-reports
  async createTestReport(req, res, next) {
    try {
      const p_id = req.params.pId || req.body.p_id;
      const { test_id, test_type, result } = req.body;

      if (!p_id || !test_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both p_id and test_id are required for creating a test report',
            details: []
          }
        });
      }

      // Check patient exists
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

      await pool.query(
        'INSERT INTO test_report (P_ID, Test_ID, Test_Type, Result) VALUES (?, ?, ?, ?)',
        [p_id, test_id, test_type, result]
      );

      const [created] = await pool.query(
        'SELECT P_ID AS p_id, Test_ID AS test_id, Test_Type AS test_type, Result AS result, Report_Date AS report_date FROM test_report WHERE P_ID = ? AND Test_ID = ?',
        [p_id, test_id]
      );

      return res.status(201).json({
        success: true,
        data: created[0],
        message: 'Test report added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/patients/:pId/test-reports/:testId
  async updateTestReport(req, res, next) {
    try {
      const { pId, testId } = req.params;
      const { test_type, result } = req.body;

      const fields = [];
      const values = [];

      if (test_type !== undefined) { fields.push('Test_Type = ?'); values.push(test_type); }
      if (result !== undefined) { fields.push('Result = ?'); values.push(result); }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No fields provided to update',
            details: []
          }
        });
      }

      values.push(pId, testId);
      const [updateResult] = await pool.query(
        `UPDATE test_report SET ${fields.join(', ')} WHERE P_ID = ? AND Test_ID = ?`,
        values
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Test report ${testId} for patient ${pId} not found`,
            details: []
          }
        });
      }

      const [updated] = await pool.query(
        'SELECT P_ID AS p_id, Test_ID AS test_id, Test_Type AS test_type, Result AS result, Report_Date AS report_date FROM test_report WHERE P_ID = ? AND Test_ID = ?',
        [pId, testId]
      );

      return res.status(200).json({
        success: true,
        data: updated[0],
        message: 'Test report updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/:pId/test-reports/:testId
  async deleteTestReport(req, res, next) {
    try {
      const { pId, testId } = req.params;
      const [result] = await pool.query(
        'DELETE FROM test_report WHERE P_ID = ? AND Test_ID = ?',
        [pId, testId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Test report ${testId} for patient ${pId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { p_id: pId, test_id: testId },
        message: 'Test report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TestReportController();
