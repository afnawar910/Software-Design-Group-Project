const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const historyController = require('../controllers/historyController');
const eventController = require('../controllers/eventController');

router.get('/', verifyToken, eventController.getAllEvents, historyController.getAllHistory);
router.get('/:userId', verifyToken, historyController.getHistory);
router.put('/:id', verifyToken, verifyAdmin, historyController.updateHistoryRecord);
router.post('/match-status', verifyToken, verifyAdmin, historyController.updateVolunteerEventStatus);

module.exports = router;