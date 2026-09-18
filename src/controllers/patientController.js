const patientService = require('../services/patientService');
const pdfService = require('../services/pdfService');
const { pool } = require('../config/db');

/**
 * Patient Controller
 * Manages core Patient CRUD, sub-resources (phones, allergies), and PDF report export.
 */
class PatientController {
  // GET /api/patients
  async getAllPatients(req, res, next) {
    try {
      const search = req.query.search || '';
      const patients = await patientService.getAllPatients(search);

      return res.status(200).json({
        success: true,
        data: patients,
        message: 'Patients fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId
  async getPatientById(req, res, next) {
    try {
      const { pId } = req.params;
      const patient = await patientService.getPatientById(pId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Patient with ID ${pId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: patient,
        message: 'Patient fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients
  async createPatient(req, res, next) {
    try {
      const created = await patientService.createPatient(req.body);

      return res.status(201).json({
        success: true,
        data: created,
        message: 'Patient created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/patients/:pId
  async updatePatient(req, res, next) {
    try {
      const { pId } = req.params;
      const updated = await patientService.updatePatient(pId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Patient with ID ${pId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Patient updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/:pId
  async deletePatient(req, res, next) {
    try {
      const { pId } = req.params;
      const deleted = await patientService.deletePatient(pId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Patient with ID ${pId} not found`,
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { p_id: pId },
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId/phones
  async getPatientPhones(req, res, next) {
    try {
      const { pId } = req.params;
      const [rows] = await pool.query(
        'SELECT Phone AS phone FROM patient_phone WHERE P_ID = ?',
        [pId]
      );

      return res.status(200).json({
        success: true,
        data: rows.map(r => r.phone),
        message: 'Patient phones fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients/:pId/phones
  async addPatientPhone(req, res, next) {
    try {
      const { pId } = req.params;
      const { phone } = req.body;

      if (!phone || typeof phone !== 'string' || phone.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A valid phone string is required',
            details: []
          }
        });
      }

      await pool.query(
        'INSERT INTO patient_phone (P_ID, Phone) VALUES (?, ?)',
        [pId, phone.trim()]
      );

      return res.status(201).json({
        success: true,
        data: { p_id: pId, phone: phone.trim() },
        message: 'Phone added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/:pId/phones/:phone
  async deletePatientPhone(req, res, next) {
    try {
      const { pId, phone } = req.params;
      const [result] = await pool.query(
        'DELETE FROM patient_phone WHERE P_ID = ? AND Phone = ?',
        [pId, phone]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Phone record not found for patient',
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { p_id: pId, phone },
        message: 'Phone deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId/allergies
  async getPatientAllergies(req, res, next) {
    try {
      const { pId } = req.params;
      const [rows] = await pool.query(
        'SELECT Allergy AS allergy FROM patient_allergy WHERE P_ID = ?',
        [pId]
      );

      return res.status(200).json({
        success: true,
        data: rows.map(r => r.allergy),
        message: 'Patient allergies fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/patients/:pId/allergies
  async addPatientAllergy(req, res, next) {
    try {
      const { pId } = req.params;
      const { allergy } = req.body;

      if (!allergy || typeof allergy !== 'string' || allergy.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A valid allergy string is required',
            details: []
          }
        });
      }

      await pool.query(
        'INSERT INTO patient_allergy (P_ID, Allergy) VALUES (?, ?)',
        [pId, allergy.trim()]
      );

      return res.status(201).json({
        success: true,
        data: { p_id: pId, allergy: allergy.trim() },
        message: 'Allergy added successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/patients/:pId/allergies/:allergy
  async deletePatientAllergy(req, res, next) {
    try {
      const { pId, allergy } = req.params;
      const [result] = await pool.query(
        'DELETE FROM patient_allergy WHERE P_ID = ? AND Allergy = ?',
        [pId, allergy]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Allergy record not found for patient',
            details: []
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: { p_id: pId, allergy },
        message: 'Allergy deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/patients/:pId/report.pdf
  async downloadPatientReport(req, res, next) {
    try {
      const { pId } = req.params;
      const patient = await patientService.getPatientById(pId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Patient with ID ${pId} not found`,
            details: []
          }
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Patient_Report_${pId}.pdf`
      );

      pdfService.generatePatientReport(patient, res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PatientController();
