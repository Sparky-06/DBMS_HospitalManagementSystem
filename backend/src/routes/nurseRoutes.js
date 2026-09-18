const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurseController');
const { nurseValidators } = require('../middleware/validate');

router.get('/', nurseController.getAllNurses);
router.get('/:empId', nurseController.getNurseById);
router.post('/', nurseValidators.create, nurseController.createNurse);
router.delete('/:empId', nurseController.deleteNurse);

module.exports = router;
