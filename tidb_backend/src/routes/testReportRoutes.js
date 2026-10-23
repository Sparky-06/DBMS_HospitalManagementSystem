const express = require('express');
const router = express.Router();
const testReportController = require('../controllers/testReportController');

router.get('/', testReportController.getAllTestReports);

module.exports = router;
