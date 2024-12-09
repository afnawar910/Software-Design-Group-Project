const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const eventController = require('../controllers/eventController');

router.get('/', verifyToken, eventController.getAllEvents);
router.get('/form-options', verifyToken, verifyAdmin, eventController.getFormOptions);
router.get('/:id', verifyToken, verifyAdmin, eventController.getEventById);
router.post('/', verifyToken, verifyAdmin, eventController.createEvent);

module.exports = router;