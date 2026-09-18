const { pool } = require('../config/db');

/**
 * Room Controller
 * Manages hospital room inventory, capacity, availability, and occupancy.
 */
class RoomController {
  // GET /api/rooms
  async getAllRooms(req, res, next) {
    try {
      const query = `
        SELECT 
          r.R_ID AS r_id, 
          r.Availability AS availability, 
          r.Capacity AS capacity, 
          r.Type AS type,
          (SELECT COUNT(*) FROM assigned WHERE R_ID = r.R_ID) AS current_occupancy,
          r.created_at
        FROM room r
        ORDER BY r.R_ID ASC
      `;

      const [rows] = await pool.query(query);
      const rooms = rows.map(r => ({
        ...r,
        availability: Boolean(r.availability)
      }));

      return res.status(200).json({
        success: true,
        data: rooms,
        message: 'Rooms fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/rooms/:rId
  async getRoomById(req, res, next) {
    try {
      const { rId } = req.params;
      const query = `
        SELECT 
          r.R_ID AS r_id, 
          r.Availability AS availability, 
          r.Capacity AS capacity, 
          r.Type AS type,
          r.created_at
        FROM room r
        WHERE r.R_ID = ?
      `;

      const [rows] = await pool.query(query, [rId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Room with ID ${rId} not found`,
            details: []
          }
        });
      }

      const room = rows[0];
      room.availability = Boolean(room.availability);

      // Assigned patients
      const [patients] = await pool.query(`
        SELECT 
          p.P_ID AS p_id, 
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          p.Gender AS gender,
          a.Assigned_Date AS assigned_date
        FROM assigned a
        JOIN patient p ON a.P_ID = p.P_ID
        WHERE a.R_ID = ?
      `, [rId]);
      room.assigned_patients = patients;

      // Governing nurses and shifts
      const [nurses] = await pool.query(`
        SELECT 
          g.Emp_ID AS emp_id,
          CONCAT(e.FName, ' ', e.LName) AS nurse_name,
          g.Shift AS shift
        FROM governs g
        JOIN employee e ON g.Emp_ID = e.Emp_ID
        WHERE g.R_ID = ?
      `, [rId]);
      room.governing_nurses = nurses;

      return res.status(200).json({
        success: true,
        data: room,
        message: 'Room fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/rooms
  async createRoom(req, res, next) {
    try {
      const { r_id, capacity, type, availability = true } = req.body;

      await pool.query(
        'INSERT INTO room (R_ID, Capacity, Type, Availability) VALUES (?, ?, ?, ?)',
        [r_id, capacity, type, availability]
      );

      const [created] = await pool.query(
        'SELECT R_ID AS r_id, Availability AS availability, Capacity AS capacity, Type AS type FROM room WHERE R_ID = ?',
        [r_id]
      );

      return res.status(201).json({
        success: true,
        data: {
          ...created[0],
          availability: Boolean(created[0].availability)
        },
        message: 'Room created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/rooms/:rId
  async updateRoom(req, res, next) {
    try {
      const { rId } = req.params;
      const { capacity, type, availability } = req.body;

      const fields = [];
      const values = [];

      if (capacity !== undefined) { fields.push('Capacity = ?'); values.push(capacity); }
      if (type !== undefined) { fields.push('Type = ?'); values.push(type); }
      if (availability !== undefined) { fields.push('Availability = ?'); values.push(availability); }

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

      values.push(rId);
      const [result] = await pool.query(`UPDATE room SET ${fields.join(', ')} WHERE R_ID = ?`, values);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Room with ID ${rId} not found`,
            details: []
          }
        });
      }

      const [updated] = await pool.query(
        'SELECT R_ID AS r_id, Availability AS availability, Capacity AS capacity, Type AS type FROM room WHERE R_ID = ?',
        [rId]
      );

      return res.status(200).json({
        success: true,
        data: {
          ...updated[0],
          availability: Boolean(updated[0].availability)
        },
        message: 'Room updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/rooms/:rId
  async deleteRoom(req, res, next) {
    try {
      const { rId } = req.params;
      const [result] = await pool.query('DELETE FROM room WHERE R_ID = ?', [rId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Room with ID ${rId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { r_id: rId },
        message: 'Room deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoomController();
