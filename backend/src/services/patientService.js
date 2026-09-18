const { pool } = require('../config/db');

/**
 * Patient Service
 * Encapsulates database transactions and complex queries for patients,
 * ensuring age derivation on-the-fly and multi-table atomic operations.
 */
class PatientService {
  /**
   * Create patient atomically with phones and allergies
   */
  async createPatient({ p_id, fname, mname = null, lname, gender, dob, phones = [], allergies = [] }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert patient basic info (Age is derived, NEVER stored)
      const insertPatientQuery = `
        INSERT INTO patient (P_ID, FName, MName, LName, Gender, DOB)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.query(insertPatientQuery, [p_id, fname, mname, lname, gender, dob]);

      // 2. Insert multivalued phones
      if (Array.isArray(phones) && phones.length > 0) {
        const phoneValues = phones.map(phone => [p_id, phone]);
        await connection.query(
          'INSERT INTO patient_phone (P_ID, Phone) VALUES ?',
          [phoneValues]
        );
      }

      // 3. Insert multivalued allergies
      if (Array.isArray(allergies) && allergies.length > 0) {
        const allergyValues = allergies.map(allergy => [p_id, allergy]);
        await connection.query(
          'INSERT INTO patient_allergy (P_ID, Allergy) VALUES ?',
          [allergyValues]
        );
      }

      await connection.commit();

      // Retrieve and return the created record
      return await this.getPatientById(p_id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get complete aggregated details for a patient
   */
  async getPatientById(pId) {
    // 1. Core patient record with derived age
    const [patientRows] = await pool.query(`
      SELECT 
        P_ID AS p_id, 
        FName AS fname, 
        MName AS mname, 
        LName AS lname, 
        Gender AS gender, 
        DOB AS dob, 
        TIMESTAMPDIFF(YEAR, DOB, CURDATE()) AS age,
        created_at,
        updated_at
      FROM patient 
      WHERE P_ID = ?
    `, [pId]);

    if (patientRows.length === 0) {
      return null;
    }

    const patient = patientRows[0];

    // 2. Phones
    const [phoneRows] = await pool.query(
      'SELECT Phone AS phone FROM patient_phone WHERE P_ID = ?',
      [pId]
    );
    patient.phones = phoneRows.map(r => r.phone);

    // 3. Allergies
    const [allergyRows] = await pool.query(
      'SELECT Allergy AS allergy FROM patient_allergy WHERE P_ID = ?',
      [pId]
    );
    patient.allergies = allergyRows.map(r => r.allergy);

    // 4. Room Assignment
    const [roomRows] = await pool.query(`
      SELECT 
        a.R_ID AS r_id, 
        a.Assigned_Date AS assigned_date, 
        r.Type AS room_type, 
        r.Capacity AS capacity, 
        r.Availability AS availability
      FROM assigned a 
      JOIN room r ON a.R_ID = r.R_ID 
      WHERE a.P_ID = ?
    `, [pId]);
    patient.assigned_room = roomRows.length > 0 ? roomRows[0] : null;

    // 5. Consultations
    const [consultationRows] = await pool.query(`
      SELECT 
        c.Emp_ID AS emp_id,
        CONCAT('Dr. ', e.FName, ' ', e.LName) AS doctor_name,
        d.Department AS department,
        c.Consultation_Date AS consultation_date,
        c.Consultation_Time AS consultation_time,
        c.Notes AS notes
      FROM consults c
      JOIN doctor d ON c.Emp_ID = d.Emp_ID
      JOIN employee e ON d.Emp_ID = e.Emp_ID
      WHERE c.P_ID = ?
      ORDER BY c.Consultation_Date DESC, c.Consultation_Time DESC
    `, [pId]);
    patient.consultations = consultationRows;

    // 6. Bills
    const [billRows] = await pool.query(`
      SELECT 
        B_ID AS b_id, 
        Amount AS amount, 
        Status AS status, 
        Bill_Date AS bill_date 
      FROM bills 
      WHERE P_ID = ? 
      ORDER BY Bill_Date DESC
    `, [pId]);
    patient.bills = billRows;

    // 7. Test Reports
    const [testRows] = await pool.query(`
      SELECT 
        Test_ID AS test_id, 
        Test_Type AS test_type, 
        Result AS result, 
        Report_Date AS report_date 
      FROM test_report 
      WHERE P_ID = ? 
      ORDER BY Report_Date DESC
    `, [pId]);
    patient.test_reports = testRows;

    return patient;
  }

  /**
   * Get all patients with high-level summary info
   */
  async getAllPatients(search = '') {
    let sql = `
      SELECT 
        p.P_ID AS p_id, 
        p.FName AS fname, 
        p.MName AS mname, 
        p.LName AS lname, 
        p.Gender AS gender, 
        p.DOB AS dob, 
        TIMESTAMPDIFF(YEAR, p.DOB, CURDATE()) AS age,
        (
          SELECT GROUP_CONCAT(Phone SEPARATOR ', ')
          FROM patient_phone 
          WHERE P_ID = p.P_ID
        ) AS phone_list,
        (
          SELECT GROUP_CONCAT(Allergy SEPARATOR ', ')
          FROM patient_allergy 
          WHERE P_ID = p.P_ID
        ) AS allergy_list,
        (
          SELECT R_ID 
          FROM assigned 
          WHERE P_ID = p.P_ID 
          LIMIT 1
        ) AS current_room,
        p.created_at
      FROM patient p
    `;

    const params = [];
    if (search && search.trim() !== '') {
      sql += ` WHERE p.P_ID LIKE ? OR p.FName LIKE ? OR p.LName LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY p.P_ID ASC`;

    const [rows] = await pool.query(sql, params);
    return rows.map(r => ({
      ...r,
      phones: r.phone_list ? r.phone_list.split(', ') : [],
      allergies: r.allergy_list ? r.allergy_list.split(', ') : []
    }));
  }

  /**
   * Update patient basic demographics
   */
  async updatePatient(pId, { fname, mname, lname, gender, dob }) {
    const fields = [];
    const values = [];

    if (fname !== undefined) { fields.push('FName = ?'); values.push(fname); }
    if (mname !== undefined) { fields.push('MName = ?'); values.push(mname); }
    if (lname !== undefined) { fields.push('LName = ?'); values.push(lname); }
    if (gender !== undefined) { fields.push('Gender = ?'); values.push(gender); }
    if (dob !== undefined) { fields.push('DOB = ?'); values.push(dob); }

    if (fields.length === 0) {
      return await this.getPatientById(pId);
    }

    values.push(pId);
    const sql = `UPDATE patient SET ${fields.join(', ')} WHERE P_ID = ?`;
    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return await this.getPatientById(pId);
  }

  /**
   * Delete patient and all dependent records (cascaded via foreign keys)
   */
  async deletePatient(pId) {
    const [result] = await pool.query('DELETE FROM patient WHERE P_ID = ?', [pId]);
    return result.affectedRows > 0;
  }
}

module.exports = new PatientService();
