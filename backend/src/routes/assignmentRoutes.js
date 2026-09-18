const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { assignmentValidators } = require('../middleware/validate');

router.get('/', assignmentController.getAllAssignments);
router.post('/', assignmentValidators.create, assignmentController.createAssignment);
router.delete('/', assignmentController.deleteAssignment);

module.exports = router;
