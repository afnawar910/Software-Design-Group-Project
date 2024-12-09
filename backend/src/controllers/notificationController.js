const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
    try {
        const { type } = req.query;
        const userEmail = req.userEmail;
        const userRole = req.userRole;

        console.log('Fetching notifications for:', {
            userEmail,
            userRole,
            type
        });
        
        let notifications;
        try {
            if (userRole === 'admin') {
                notifications = await notificationService.getAllNotifications();
                console.log('Admin notifications fetched:', notifications.length);
            } else {
                notifications = await notificationService.getNotificationsForUser(userEmail);
                console.log('User notifications fetched:', notifications.length);
            }

            if (type && Object.values(notificationService.NOTIFICATION_TYPES).includes(type)) {
                notifications = notifications.filter(notification => notification.type === type);
            }

            console.log('Final notifications count:', notifications.length);

            res.status(200).json({
                count: notifications.length,
                notifications
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({ 
            message: 'Error fetching notifications', 
            error: error.message
        });
    }
};

const getNotification = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const userEmail = req.userEmail;

        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const notification = await notificationService.getNotificationById(id);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (req.userRole !== 'admin' && 
            notification.recipientEmail && 
            notification.recipientEmail !== userEmail) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({ notification });
    } catch (error) {
        console.error('Error in getNotification:', error);
        res.status(500).json({ message: 'Error fetching notification', error: error.message });
    }
};

const addNotification = async (req, res) => {
    try {
        const { type, message } = req.body;

        if (type === notificationService.NOTIFICATION_TYPES.NEW_EVENT) {
            return res.status(400).json({
                error: "New event notifications are created automatically"
            });
        }

        if (!Object.values(notificationService.NOTIFICATION_TYPES).includes(type)) {
            return res.status(400).json({
                error: "Invalid notification type",
                allowedTypes: [
                    notificationService.NOTIFICATION_TYPES.UPDATE,
                    notificationService.NOTIFICATION_TYPES.REMINDER
                ]
            });
        }

        let newNotification;
        if (type === notificationService.NOTIFICATION_TYPES.UPDATE) {
            newNotification = await notificationService.addUpdateNotification(message);
        } else if (type === notificationService.NOTIFICATION_TYPES.REMINDER) {
            newNotification = await notificationService.addReminderNotification(message);
        }

        res.status(201).json({
            message: "Notification added successfully",
            notification: newNotification
        });
    } catch (error) {
        console.error('Error in addNotification:', error);
        res.status(500).json({
            message: 'Error creating notification',
            error: error.message
        });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notificationId = parseInt(id, 10);

        if (isNaN(notificationId)) {
            return res.status(400).json({ error: "Invalid notification ID" });
        }

        const deletedNotification = await notificationService.deleteNotification(notificationId);

        if (!deletedNotification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({
            message: 'Notification deleted successfully',
            deletedNotification
        });
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        res.status(500).json({
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

const getNotificationTypes = (req, res) => {
    try {
        const types = {
            all: Object.values(notificationService.NOTIFICATION_TYPES),
            manual: [
                notificationService.NOTIFICATION_TYPES.UPDATE,
                notificationService.NOTIFICATION_TYPES.REMINDER
            ]
        };

        res.status(200).json({ types });
    } catch (error) {
        console.error('Error in getNotificationTypes:', error);
        res.status(500).json({
            message: 'Error fetching notification types',
            error: error.message
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({
            message: 'Error marking notification as read',
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    getNotification,
    addNotification,
    deleteNotification,
    markAsRead,
    getNotificationTypes  
};