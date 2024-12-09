const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const matchingController = require('../controllers/matchingController');

router.post('/', verifyToken, verifyAdmin, matchingController.matchVolunteerToEvent);
router.get('/future-events', verifyToken, verifyAdmin, matchingController.getFutureEvents);
router.get('/:eventId', verifyToken, verifyAdmin, matchingController.getMatchingVolunteers);

module.exports = router;