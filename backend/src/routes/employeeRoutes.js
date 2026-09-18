const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { employeeValidators } = require('../middleware/validate');

router.get('/', employeeController.getAllEmployees);
router.get('/:empId', employeeController.getEmployeeById);
router.post('/', employeeValidators.create, employeeController.createEmployee);
router.put('/:empId', employeeValidators.update, employeeController.updateEmployee);
router.delete('/:empId', employeeController.deleteEmployee);

module.exports = router;
