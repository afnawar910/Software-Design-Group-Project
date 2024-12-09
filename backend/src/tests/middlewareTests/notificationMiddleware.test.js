const { validateNotification } = require('../../middleware/notificationMiddleware');
const notificationService = require('../../services/notificationService');

jest.mock('../../services/notificationService');

describe('Notification Middleware', () => {
	let req, res, next;

	beforeEach(() => {
		req = { body: {} };
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		next = jest.fn();

		notificationService.NOTIFICATION_TYPES = {
			NEW_EVENT: 'New Event',
			UPDATE: 'Update',
			REMINDER: 'Reminder'
		};
	});

	test('should return error if type is missing', () => {
		req.body = { message: 'Test Message' };
		validateNotification(req, res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid notification: 'type' is required and must be a string"
		});
	});

	test('should return error if message is missing', () => {
		req.body = { type: 'Update' };
		validateNotification(req, res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid notification: 'message' is required and must be a non-empty string"
		});
	});

	test('should return error if type is NEW_EVENT', () => {
		req.body = {
			type: notificationService.NOTIFICATION_TYPES.NEW_EVENT,
			message: 'Test Message'
		};
		validateNotification(req, res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "New event notifications are created automatically and cannot be added manually"
		});
	});

	test('should return error if message is too long', () => {
		req.body = {
			type: 'Update',
			message: 'a'.repeat(501)
		};
		validateNotification(req, res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: "Message must be 500 characters or less"
		});
	});

	test('should pass validation for valid update notification', () => {
		req.body = {
			type: 'Update',
			message: 'Test Message'
		};
		validateNotification(req, res, next);
		expect(next).toHaveBeenCalled();
	});

	test('should pass validation for valid reminder notification', () => {
		req.body = {
			type: 'Reminder',
			message: 'Test Message'
		};
		validateNotification(req, res, next);
		expect(next).toHaveBeenCalled();
	});
});