const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const billController = require('../controllers/billController');
const testReportController = require('../controllers/testReportController');
const { patientValidators, billValidators, testReportValidators } = require('../middleware/validate');

// Core Patient Endpoints
router.get('/', patientController.getAllPatients);
router.get('/:pId', patientController.getPatientById);
router.post('/', patientValidators.create, patientController.createPatient);
router.put('/:pId', patientValidators.update, patientController.updatePatient);
router.delete('/:pId', patientController.deletePatient);

// PDF Summary Report
router.get('/:pId/report.pdf', patientController.downloadPatientReport);

// Multivalued Phones Sub-resource
router.get('/:pId/phones', patientController.getPatientPhones);
router.post('/:pId/phones', patientController.addPatientPhone);
router.delete('/:pId/phones/:phone', patientController.deletePatientPhone);

// Multivalued Allergies Sub-resource
router.get('/:pId/allergies', patientController.getPatientAllergies);
router.post('/:pId/allergies', patientController.addPatientAllergy);
router.delete('/:pId/allergies/:allergy', patientController.deletePatientAllergy);

// Patient Bills Sub-resource (Contract Section 10)
router.get('/:pId/bills', billController.getBillsByPatient);
router.post('/:pId/bills', billValidators.create, billController.createBill);
router.put('/:pId/bills/:bId', billValidators.update, billController.updateBill);
router.delete('/:pId/bills/:bId', billController.deleteBill);

// Patient Test Reports Sub-resource (Contract Section 10)
router.get('/:pId/test-reports', testReportController.getTestReportsByPatient);
router.post('/:pId/test-reports', testReportValidators.create, testReportController.createTestReport);
router.put('/:pId/test-reports/:testId', testReportValidators.update, testReportController.updateTestReport);
router.delete('/:pId/test-reports/:testId', testReportController.deleteTestReport);

module.exports = router;
