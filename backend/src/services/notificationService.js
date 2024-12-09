const { Notification, Sequelize } = require('../../models');
const { Op } = require('sequelize');  

const NOTIFICATION_TYPES = {
    NEW_EVENT: 'New Event',
    UPDATE: 'Update',
    REMINDER: 'Reminder',
    VOLUNTEER_MATCH: 'Volunteer Match'
};

const getAllNotifications = async () => {
    try {
        return await Notification.findAll({
            order: [['createdAt', 'DESC']]
        });
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        throw error;
    }
};

const getNotificationById = async (id) => {
    try {
        return await Notification.findByPk(id);
    } catch (error) {
        console.error('Error fetching notification by id:', error);
        throw error;
    }
};

const createEventNotification = async (event) => {
    try {
        const message = `New volunteer opportunity: ${event.eventName} on ${event.eventDate}!`;
        return await addNotification(NOTIFICATION_TYPES.NEW_EVENT, message);
    } catch (error) {
        console.error('Error creating event notification:', error);
        throw error;
    }
};

const createVolunteerMatchNotification = async (volunteerEmail, eventName, eventDate) => {
    try {
        const message = `You (${volunteerEmail}) have been matched to volunteer at ${eventName} on ${eventDate}. Please check your volunteer history for details.`;
        return await addNotification(NOTIFICATION_TYPES.VOLUNTEER_MATCH, message, volunteerEmail);
    } catch (error) {
        console.error('Error creating volunteer match notification:', error);
        throw error;
    }
};

const addNotification = async (type, message, recipientEmail = null) => {
    try {
        return await Notification.create({
            type,
            message,
            recipientEmail,
            isRead: false
        });
    } catch (error) {
        console.error('Error adding notification:', error);
        throw error;
    }
};

const addUpdateNotification = async (message) => {
    try {
        return await addNotification(NOTIFICATION_TYPES.UPDATE, message);
    } catch (error) {
        console.error('Error adding update notification:', error);
        throw error;
    }
};

const addReminderNotification = async (message) => {
    try {
        return await addNotification(NOTIFICATION_TYPES.REMINDER, message);
    } catch (error) {
        console.error('Error adding reminder notification:', error);
        throw error;
    }
};

const deleteNotification = async (id) => {
    try {
        const notification = await Notification.findByPk(id);
        if (notification) {
            await notification.destroy();
            return notification;
        }
        return null;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

const getNotificationsForUser = async (userEmail) => {
    try {
        console.log('Fetching notifications for user:', userEmail);
        const notifications = await Notification.findAll({
            where: {
                [Op.or]: [
                    { recipientEmail: null },  
                    { recipientEmail: userEmail }  
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        console.log('Found notifications:', notifications.length);
        return notifications;
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
};

module.exports = {
    getAllNotifications,
    getNotificationById,
    createEventNotification,
    createVolunteerMatchNotification,
    addUpdateNotification,
    addReminderNotification,
    deleteNotification,
    getNotificationsForUser,
    NOTIFICATION_TYPES
};