const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { validateNotification } = require('../middleware/notificationMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getNotifications);
router.get('/types', verifyToken, notificationController.getNotificationTypes);
router.get('/:id', verifyToken, notificationController.getNotification);
router.post('/add', verifyToken, verifyAdmin, validateNotification, notificationController.addNotification);
router.delete('/delete/:id', verifyToken, verifyAdmin, notificationController.deleteNotification);

module.exports = router;