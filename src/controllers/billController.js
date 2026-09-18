const { pool } = require('../config/db');

/**
 * Bill Controller
 * Manages weak entity Bills with composite key (P_ID, B_ID).
 */
class BillController {
  // GET /api/bills
  async getAllBills(req, res, next) {
    try {
      const { status } = req.query;
      let sql = `
        SELECT 
          b.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          b.B_ID AS b_id,
          b.Amount AS amount,
          b.Status AS status,
          b.Bill_Date AS bill_date
        FROM bills b
        JOIN patient p ON b.P_ID = p.P_ID
      `;

      const params = [];
      if (status) {
        sql += ' WHERE b.Status = ?';
        params.push(status);
      }

      sql += ' ORDER BY b.Bill_Date DESC';

      const [rows] = await pool.query(sql, params);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Bills fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId/bills
  async getBillsByPatient(req, res, next) {
    try {
      const { pId } = req.params;
      const [rows] = await pool.query(`
        SELECT 
          b.P_ID AS p_id,
          b.B_ID AS b_id,
          b.Amount AS amount,
          b.Status AS status,
          b.Bill_Date AS bill_date
        FROM bills b
        WHERE b.P_ID = ?
        ORDER BY b.Bill_Date DESC
      `, [pId]);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Patient bills fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients/:pId/bills
  async createBill(req, res, next) {
    try {
      const p_id = req.params.pId || req.body.p_id;
      const { b_id, amount, status = 'Pending' } = req.body;

      if (!p_id || !b_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both p_id and b_id are required for creating a bill',
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
        'INSERT INTO bills (P_ID, B_ID, Amount, Status) VALUES (?, ?, ?, ?)',
        [p_id, b_id, amount, status]
      );

      const [created] = await pool.query(
        'SELECT P_ID AS p_id, B_ID AS b_id, Amount AS amount, Status AS status, Bill_Date AS bill_date FROM bills WHERE P_ID = ? AND B_ID = ?',
        [p_id, b_id]
      );

      return res.status(201).json({
        success: true,
        data: created[0],
        message: 'Bill generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/patients/:pId/bills/:bId
  async updateBill(req, res, next) {
    try {
      const { pId, bId } = req.params;
      const { amount, status } = req.body;

      const fields = [];
      const values = [];

      if (amount !== undefined) { fields.push('Amount = ?'); values.push(amount); }
      if (status !== undefined) { fields.push('Status = ?'); values.push(status); }

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

      values.push(pId, bId);
      const [result] = await pool.query(
        `UPDATE bills SET ${fields.join(', ')} WHERE P_ID = ? AND B_ID = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Bill ${bId} for patient ${pId} not found`,
            details: []
          }
        });
      }

      const [updated] = await pool.query(
        'SELECT P_ID AS p_id, B_ID AS b_id, Amount AS amount, Status AS status, Bill_Date AS bill_date FROM bills WHERE P_ID = ? AND B_ID = ?',
        [pId, bId]
      );

      return res.status(200).json({
        success: true,
        data: updated[0],
        message: 'Bill updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/:pId/bills/:bId
  async deleteBill(req, res, next) {
    try {
      const { pId, bId } = req.params;
      const [result] = await pool.query(
        'DELETE FROM bills WHERE P_ID = ? AND B_ID = ?',
        [pId, bId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Bill ${bId} for patient ${pId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { p_id: pId, b_id: bId },
        message: 'Bill deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillController();
