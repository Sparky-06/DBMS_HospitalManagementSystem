const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { roomValidators } = require('../middleware/validate');

router.get('/', roomController.getAllRooms);
router.get('/:rId', roomController.getRoomById);
router.post('/', roomValidators.create, roomController.createRoom);
router.put('/:rId', roomValidators.update, roomController.updateRoom);
router.delete('/:rId', roomController.deleteRoom);

module.exports = router;
