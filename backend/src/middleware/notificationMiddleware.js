const notificationService = require('../services/notificationService');

const validateNotification = (req, res, next) => {
	const { type, message } = req.body;

	if (!type || typeof type !== 'string') {
		return res.status(400).json({
			error: "Invalid notification: 'type' is required and must be a string"
		});
	}

	if (!Object.values(notificationService.NOTIFICATION_TYPES).includes(type)) {
		return res.status(400).json({
			error: "Invalid notification type",
			allowedTypes: Object.values(notificationService.NOTIFICATION_TYPES)
		});
	}

	if (type === notificationService.NOTIFICATION_TYPES.NEW_EVENT) {
		return res.status(400).json({
			error: "New event notifications are created automatically and cannot be added manually"
		});
	}

	if (!message || typeof message !== 'string' || message.trim().length === 0) {
		return res.status(400).json({
			error: "Invalid notification: 'message' is required and must be a non-empty string"
		});
	}

	if (message.length > 500) {
		return res.status(400).json({
			error: "Message must be 500 characters or less"
		});
	}

	next();
};

module.exports = { validateNotification };