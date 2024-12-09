const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/volunteers', verifyToken, verifyAdmin, reportsController.getVolunteerReport);
router.get('/volunteers/:id', verifyToken, verifyAdmin, reportsController.getSpecificVolunteerReport);
//events
router.get('/events', verifyToken, verifyAdmin, reportsController.getEventReport);
router.get('/events/:id', verifyToken, verifyAdmin, reportsController.getSpecificEventReport);

module.exports = router;