const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { doctorValidators } = require('../middleware/validate');

router.get('/', doctorController.getAllDoctors);
router.get('/:empId', doctorController.getDoctorById);
router.post('/', doctorValidators.create, doctorController.createDoctor);
router.put('/:empId', doctorValidators.update, doctorController.updateDoctor);
router.delete('/:empId', doctorController.deleteDoctor);

module.exports = router;
