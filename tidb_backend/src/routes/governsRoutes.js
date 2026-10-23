const express = require('express');
const router = express.Router();
const governsController = require('../controllers/governsController');
const { governsValidators } = require('../middleware/validate');

router.get('/', governsController.getAllGoverns);
router.post('/', governsValidators.create, governsController.createGoverns);
router.delete('/', governsController.deleteGoverns);

module.exports = router;
