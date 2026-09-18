const { pool } = require('../config/db');

/**
 * Dashboard Controller
 * Provides real-time hospital analytics and aggregations for the frontend dashboard.
 */
class DashboardController {
  // GET /api/dashboard/stats
  async getDashboardStats(req, res, next) {
    try {
      // 1. Total counts
      const [patientCount] = await pool.query('SELECT COUNT(*) AS count FROM patient');
      const [employeeCount] = await pool.query('SELECT COUNT(*) AS count FROM employee');
      const [doctorCount] = await pool.query('SELECT COUNT(*) AS count FROM doctor');
      const [nurseCount] = await pool.query('SELECT COUNT(*) AS count FROM nurse');
      const [roomCount] = await pool.query('SELECT COUNT(*) AS count, SUM(Capacity) AS total_capacity FROM room');
      const [assignedCount] = await pool.query('SELECT COUNT(*) AS count FROM assigned');
      const [consultationCount] = await pool.query('SELECT COUNT(*) AS count FROM consults');

      // 2. Billing summary
      const [billingStats] = await pool.query(`
        SELECT 
          COUNT(*) AS total_bills,
          COALESCE(SUM(Amount), 0) AS total_amount,
          COALESCE(SUM(CASE WHEN Status = 'Paid' THEN Amount ELSE 0 END), 0) AS paid_amount,
          COALESCE(SUM(CASE WHEN Status = 'Pending' THEN Amount ELSE 0 END), 0) AS pending_amount
        FROM bills
      `);

      // 3. Room occupancy by room type
      const [roomOccupancy] = await pool.query(`
        SELECT 
          r.Type AS room_type,
          COUNT(DISTINCT r.R_ID) AS total_rooms,
          SUM(r.Capacity) AS total_capacity,
          COUNT(a.P_ID) AS occupied_beds
        FROM room r
        LEFT JOIN assigned a ON r.R_ID = a.R_ID
        GROUP BY r.Type
      `);

      // 4. Recent consultations
      const [recentConsultations] = await pool.query(`
        SELECT 
          c.Emp_ID AS emp_id,
          CONCAT('Dr. ', e.FName, ' ', e.LName) AS doctor_name,
          d.Department AS department,
          c.P_ID AS p_id,
          CONCAT(p.FName, ' ', p.LName) AS patient_name,
          c.Consultation_Date AS consultation_date,
          c.Consultation_Time AS consultation_time
        FROM consults c
        JOIN doctor d ON c.Emp_ID = d.Emp_ID
        JOIN employee e ON d.Emp_ID = e.Emp_ID
        JOIN patient p ON c.P_ID = p.P_ID
        ORDER BY c.Consultation_Date DESC, c.Consultation_Time DESC
        LIMIT 5
      `);

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            patients: patientCount[0].count,
            employees: employeeCount[0].count,
            doctors: doctorCount[0].count,
            nurses: nurseCount[0].count,
            rooms: roomCount[0].count,
            total_bed_capacity: roomCount[0].total_capacity || 0,
            admitted_patients: assignedCount[0].count,
            consultations: consultationCount[0].count
          },
          financials: billingStats[0],
          occupancy: roomOccupancy,
          recent_consultations: recentConsultations
        },
        message: 'Dashboard stats fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
