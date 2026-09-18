const { pool } = require('../config/db');

/**
 * Assignment Controller
 * Manages Patient N:1 Room bed allocation, capacity tracking, and discharge.
 */
class AssignmentController {
  // GET /api/assignments
  async getAllAssignments(req, res, next) {
    try {
      const query = `
        SELECT 
          a.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          p.Gender AS gender,
          a.R_ID AS r_id,
          r.Type AS room_type,
          r.Capacity AS capacity,
          a.Assigned_Date AS assigned_date
        FROM assigned a
        JOIN patient p ON a.P_ID = p.P_ID
        JOIN room r ON a.R_ID = r.R_ID
        ORDER BY a.Assigned_Date DESC
      `;

      const [rows] = await pool.query(query);

      return res.status(200).json({
        success: true,
        data: rows,
        message: 'Assignments fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/assignments
  async createAssignment(req, res, next) {
    const connection = await pool.getConnection();
    try {
      const { p_id, r_id } = req.body;

      await connection.beginTransaction();

      // 1. Verify Patient exists
      const [patientRows] = await connection.query('SELECT P_ID FROM patient WHERE P_ID = ?', [p_id]);
      if (patientRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Patient ${p_id} does not exist`,
            details: []
          }
        });
      }

      // 2. Verify Room exists and has capacity
      const [roomRows] = await connection.query('SELECT Capacity, Availability FROM room WHERE R_ID = ?', [r_id]);
      if (roomRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: {
            code: 'FOREIGN_KEY_VIOLATION',
            message: `Room ${r_id} does not exist`,
            details: []
          }
        });
      }

      const room = roomRows[0];
      const [countRows] = await connection.query('SELECT COUNT(*) AS count FROM assigned WHERE R_ID = ?', [r_id]);
      const currentOccupants = countRows[0].count;

      if (currentOccupants >= room.Capacity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROOM_CAPACITY_EXCEEDED',
            message: `Room ${r_id} is at maximum capacity (${room.Capacity} patients). Cannot assign more patients.`,
            details: []
          }
        });
      }

      // 3. Since relationship is Patient N:1 Room, ensure patient is not already assigned elsewhere
      await connection.query('DELETE FROM assigned WHERE P_ID = ?', [p_id]);

      // 4. Create new assignment
      await connection.query('INSERT INTO assigned (P_ID, R_ID) VALUES (?, ?)', [p_id, r_id]);

      // 5. Update room availability if now full
      if (currentOccupants + 1 >= room.Capacity) {
        await connection.query('UPDATE room SET Availability = FALSE WHERE R_ID = ?', [r_id]);
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        data: { p_id, r_id },
        message: 'Patient assigned to room successfully'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }

  // DELETE /api/assignments
  async deleteAssignment(req, res, next) {
    const connection = await pool.getConnection();
    try {
      const { p_id, r_id } = req.body.p_id ? req.body : req.query;

      if (!p_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Patient ID (p_id) is required to remove assignment',
            details: []
          }
        });
      }

      await connection.beginTransaction();

      let targetRoomId = r_id;
      if (!targetRoomId) {
        const [existing] = await connection.query('SELECT R_ID FROM assigned WHERE P_ID = ?', [p_id]);
        if (existing.length > 0) {
          targetRoomId = existing[0].R_ID;
        }
      }

      const [result] = await connection.query(
        'DELETE FROM assigned WHERE P_ID = ?' + (r_id ? ' AND R_ID = ?' : ''),
        r_id ? [p_id, r_id] : [p_id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Assignment record not found',
            details: []
          }
        });
      }

      // Mark room available if capacity freed
      if (targetRoomId) {
        await connection.query('UPDATE room SET Availability = TRUE WHERE R_ID = ?', [targetRoomId]);
      }

      await connection.commit();

      return res.status(200).json({
        success: true,
        data: { p_id, r_id: targetRoomId },
        message: 'Patient discharged / assignment removed successfully'
      });
    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = new AssignmentController();
