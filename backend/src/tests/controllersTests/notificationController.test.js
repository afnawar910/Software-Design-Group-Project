const notificationController = require('../../controllers/notificationController');
const notificationService = require('../../services/notificationService');

jest.mock('../../services/notificationService');

beforeEach(() => {
    jest.clearAllMocks();

    req = {
        params: {},
        query: {},
        body: {},
        userEmail: 'test@example.com',
        userRole: 'volunteer'
    };
    
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };

    notificationService.getAllNotifications = jest.fn();
    notificationService.getNotificationsForUser = jest.fn();
    notificationService.getNotificationById = jest.fn();
    notificationService.addUpdateNotification = jest.fn();
    notificationService.deleteNotification = jest.fn();
    notificationService.markAsRead = jest.fn(); 
});


describe('Notification Controller', () => {
    let req;
    let res;
    
    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            query: {},
            body: {},
            userEmail: 'test@example.com',
            userRole: 'volunteer'
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getNotifications', () => {
        it('should fetch all notifications for admin users', async () => {
            const mockNotifications = [
                { id: 1, message: 'Test 1' },
                { id: 2, message: 'Test 2' }
            ];
            req.userRole = 'admin';
            notificationService.getAllNotifications.mockResolvedValue(mockNotifications);

            await notificationController.getNotifications(req, res);

            expect(notificationService.getAllNotifications).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                count: 2,
                notifications: mockNotifications
            });
        });

        it('should fetch user-specific notifications for non-admin users', async () => {
            const mockNotifications = [
                { id: 1, message: 'Test 1', recipientEmail: 'test@example.com' }
            ];
            notificationService.getNotificationsForUser.mockResolvedValue(mockNotifications);

            await notificationController.getNotifications(req, res);

            expect(notificationService.getNotificationsForUser).toHaveBeenCalledWith('test@example.com');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                count: 1,
                notifications: mockNotifications
            });
        });

        it('should filter notifications by type when query parameter is provided', async () => {
            const mockNotifications = [
                { id: 1, type: 'Update', message: 'Test 1' },
                { id: 2, type: 'Reminder', message: 'Test 2' }
            ];
            req.query.type = 'Update';
            notificationService.getNotificationsForUser.mockResolvedValue(mockNotifications);

            await notificationController.getNotifications(req, res);

            expect(res.json).toHaveBeenCalledWith({
                count: 1,
                notifications: expect.arrayContaining([
                    expect.objectContaining({ type: 'Update' })
                ])
            });
        });

        it('should handle errors gracefully', async () => {
            notificationService.getNotificationsForUser.mockRejectedValue(new Error('Database error'));

            await notificationController.getNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Error fetching notifications',
                error: 'Database error'
            });
        });
    });

    describe('getNotification', () => {
        it('should fetch a single notification by id', async () => {
            const mockNotification = { id: 1, message: 'Test' };
            req.params.id = '1';
            notificationService.getNotificationById.mockResolvedValue(mockNotification);

            await notificationController.getNotification(req, res);

            expect(notificationService.getNotificationById).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ notification: mockNotification });
        });

        it('should return 404 for non-existent notification', async () => {
            req.params.id = '999';
            notificationService.getNotificationById.mockResolvedValue(null);

            await notificationController.getNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
        });

        it('should return 403 when non-admin user tries to access another user\'s notification', async () => {
            const mockNotification = { 
                id: 1, 
                message: 'Test',
                recipientEmail: 'other@example.com'
            };
            req.params.id = '1';
            notificationService.getNotificationById.mockResolvedValue(mockNotification);

            await notificationController.getNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
        });

		it('should return 400 for invalid notification ID in getNotification', async () => {
			req.params.id = 'invalid_id';
			await notificationController.getNotification(req, res);
			
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
		});		

		it('should return empty notifications for unrecognized role', async () => {
			req.userRole = 'unknownRole';
			notificationService.getNotificationsForUser.mockResolvedValue([]);
		
			await notificationController.getNotifications(req, res);
		
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				count: 0,
				notifications: []
			});
		});
		
    });

    describe('addNotification', () => {
        it('should create a new update notification', async () => {
            const mockNotification = { id: 1, type: 'Update', message: 'Test update' };
            req.body = { type: 'Update', message: 'Test update' };
            notificationService.addUpdateNotification.mockResolvedValue(mockNotification);

            await notificationController.addNotification(req, res);

            expect(notificationService.addUpdateNotification).toHaveBeenCalledWith('Test update');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Notification added successfully',
                notification: mockNotification
            });
        });

        it('should reject attempts to create NEW_EVENT notifications', async () => {
            req.body = { type: 'New Event', message: 'Test event' };

            await notificationController.addNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'New event notifications are created automatically'
            });
        });

        it('should reject invalid notification types', async () => {
            req.body = { type: 'Invalid', message: 'Test' };

            await notificationController.addNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid notification type',
                allowedTypes: expect.any(Array)
            });
        });
    });

    describe('deleteNotification', () => {
        it('should delete an existing notification', async () => {
            const mockNotification = { id: 1, message: 'Test' };
            req.params.id = '1';
            notificationService.deleteNotification.mockResolvedValue(mockNotification);

            await notificationController.deleteNotification(req, res);

            expect(notificationService.deleteNotification).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Notification deleted successfully',
                deletedNotification: mockNotification
            });
        });

        it('should return 404 when deleting non-existent notification', async () => {
            req.params.id = '999';
            notificationService.deleteNotification.mockResolvedValue(null);

            await notificationController.deleteNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
        });

		it('should return 400 for invalid notification ID in deleteNotification', async () => {
			req.params.id = 'invalid_id';
			await notificationController.deleteNotification(req, res);
		
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ error: 'Invalid notification ID' });
		});		
    });

    describe('getNotificationTypes', () => {
        it('should return all notification types', async () => {
            await notificationController.getNotificationTypes(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                types: {
                    all: expect.any(Array),
                    manual: expect.any(Array)
                }
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const mockNotification = { id: 1, message: 'Test', isRead: true };
            req.params.id = '1';
            notificationService.markAsRead.mockResolvedValue(mockNotification);

            await notificationController.markAsRead(req, res);

            expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Notification marked as read',
                notification: mockNotification
            });
        });

        it('should return 404 for non-existent notification', async () => {
            req.params.id = '999';
            notificationService.markAsRead.mockResolvedValue(null);

            await notificationController.markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Notification not found' });
        });
    });
});