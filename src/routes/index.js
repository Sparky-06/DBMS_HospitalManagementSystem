const express = require('express');
const router = express.Router();

const employeeRoutes = require('./employeeRoutes');
const doctorRoutes = require('./doctorRoutes');
const nurseRoutes = require('./nurseRoutes');
const patientRoutes = require('./patientRoutes');
const roomRoutes = require('./roomRoutes');
const consultationRoutes = require('./consultationRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const governsRoutes = require('./governsRoutes');
const billRoutes = require('./billRoutes');
const testReportRoutes = require('./testReportRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const healthRoutes = require('./healthRoutes');

router.use('/health', healthRoutes);
router.use('/employees', employeeRoutes);
router.use('/doctors', doctorRoutes);
router.use('/nurses', nurseRoutes);
router.use('/patients', patientRoutes);
router.use('/rooms', roomRoutes);
router.use('/consultations', consultationRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/governs', governsRoutes);
router.use('/bills', billRoutes);
router.use('/test-reports', testReportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
