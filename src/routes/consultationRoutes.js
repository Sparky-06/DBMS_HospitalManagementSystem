const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { consultationValidators } = require('../middleware/validate');

router.get('/', consultationController.getAllConsultations);
router.post('/', consultationValidators.create, consultationController.createConsultation);
router.put('/', consultationValidators.update, consultationController.updateConsultation);
router.delete('/', consultationController.deleteConsultation);

module.exports = router;
