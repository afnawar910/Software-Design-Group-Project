const request = require('supertest');
const express = require('express');
const notificationController = require('../../controllers/notificationController');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateNotification } = require('../../middleware/notificationMiddleware');
const notificationRoutes = require('../../routes/notificationRoutes');

jest.mock('../../controllers/notificationController');
jest.mock('../../middleware/authMiddleware');
jest.mock('../../middleware/notificationMiddleware');

describe('Notification Routes', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use('/api/notifications', notificationRoutes);

        authMiddleware.verifyToken.mockImplementation((req, res, next) => next());
        authMiddleware.verifyAdmin.mockImplementation((req, res, next) => next());
        validateNotification.mockImplementation((req, res, next) => next());
    });

    describe('GET /', () => {
        it('should call getNotifications controller with auth', async () => {
            notificationController.getNotifications.mockImplementation((req, res) => {
                res.json({ notifications: [] });
            });

            await request(app)
                .get('/api/notifications')
                .expect(200);

            expect(authMiddleware.verifyToken).toHaveBeenCalled();
            expect(notificationController.getNotifications).toHaveBeenCalled();
        });

        it('should handle unauthorized access', async () => {
            authMiddleware.verifyToken.mockImplementation((req, res) => {
                res.status(401).json({ message: 'Unauthorized' });
            });

            await request(app)
                .get('/api/notifications')
                .expect(401);

            expect(notificationController.getNotifications).not.toHaveBeenCalled();
        });
    });

    describe('GET /types', () => {
        it('should call getNotificationTypes controller with auth', async () => {
            notificationController.getNotificationTypes.mockImplementation((req, res) => {
                res.json({ types: ['Update', 'Reminder'] });
            });

            await request(app)
                .get('/api/notifications/types')
                .expect(200);

            expect(authMiddleware.verifyToken).toHaveBeenCalled();
            expect(notificationController.getNotificationTypes).toHaveBeenCalled();
        });
    });

    describe('GET /:id', () => {
        it('should call getNotification controller with auth and id param', async () => {
            notificationController.getNotification.mockImplementation((req, res) => {
                res.json({ notification: {} });
            });

            await request(app)
                .get('/api/notifications/1')
                .expect(200);

            expect(authMiddleware.verifyToken).toHaveBeenCalled();
            expect(notificationController.getNotification).toHaveBeenCalled();
        });
    });

    describe('POST /add', () => {
        it('should call addNotification controller with auth, admin rights, and validation', async () => {
            notificationController.addNotification.mockImplementation((req, res) => {
                res.status(201).json({ message: 'Notification added' });
            });

            const notificationData = {
                type: 'Update',
                message: 'Test notification'
            };

            await request(app)
                .post('/api/notifications/add')
                .send(notificationData)
                .expect(201);

            expect(authMiddleware.verifyToken).toHaveBeenCalled();
            expect(authMiddleware.verifyAdmin).toHaveBeenCalled();
            expect(validateNotification).toHaveBeenCalled();
            expect(notificationController.addNotification).toHaveBeenCalled();
        });

        it('should handle validation failure', async () => {
            validateNotification.mockImplementation((req, res) => {
                res.status(400).json({ message: 'Validation failed' });
            });

            const invalidData = {
                type: 'Invalid',
                message: ''
            };

            await request(app)
                .post('/api/notifications/add')
                .send(invalidData)
                .expect(400);

            expect(notificationController.addNotification).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /delete/:id', () => {
        it('should call deleteNotification controller with auth and admin rights', async () => {
            notificationController.deleteNotification.mockImplementation((req, res) => {
                res.json({ message: 'Notification deleted' });
            });

            await request(app)
                .delete('/api/notifications/delete/1')
                .expect(200);

            expect(authMiddleware.verifyToken).toHaveBeenCalled();
            expect(authMiddleware.verifyAdmin).toHaveBeenCalled();
            expect(notificationController.deleteNotification).toHaveBeenCalled();
        });

        it('should handle unauthorized deletion attempt', async () => {
            authMiddleware.verifyAdmin.mockImplementation((req, res) => {
                res.status(403).json({ message: 'Admin rights required' });
            });

            await request(app)
                .delete('/api/notifications/delete/1')
                .expect(403);

            expect(notificationController.deleteNotification).not.toHaveBeenCalled();
        });
    });
});