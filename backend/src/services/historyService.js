const { VolunteerHistory, Event, User } = require('../../models');
const notificationService = require('./notificationService');

const historyService = {
    initializeHistory: async (volunteerId = null, eventId = null) => {
        try {
            let events = eventId ? [await Event.findByPk(eventId)] : await Event.findAll();
            let volunteers = volunteerId ? [await User.findByPk(volunteerId)] : 
                           await User.findAll({ where: { role: 'volunteer' } });
                           
            const records = [];
            for (const volunteer of volunteers) {
                for (const event of events) {
                    const [record] = await VolunteerHistory.findOrCreate({
                        where: {
                            volunteerId: volunteer.id,
                            eventId: event.id
                        },
                        defaults: {
                            participationStatus: 'Not Attended'
                        }
                    });
                    records.push(record);
                }
            }
            return records;
        } catch (error) {
            console.error('Error initializing history:', error);
            throw error;
        }
    },

    updateVolunteerEventStatus: async (volunteerId, eventId, participationStatus) => {
        try {
            console.log(`Updating status for volunteer ${volunteerId} and event ${eventId}`);
            
            const volunteer = await User.findByPk(volunteerId);
            const event = await Event.findByPk(eventId);

            if (!volunteer || !event) {
                throw new Error('Volunteer or event not found');
            }

            const [historyRecord, created] = await VolunteerHistory.findOrCreate({
                where: { 
                    volunteerId: parseInt(volunteerId),
                    eventId: parseInt(eventId)
                },
                defaults: {
                    participationStatus: participationStatus,
                    matchedAt: new Date()
                }
            });

            if (!created) {
                await historyRecord.update({
                    participationStatus: participationStatus,
                    matchedAt: new Date()
                });
            }

            if (participationStatus === 'Matched - Pending Attendance') {
                const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                notificationService.createVolunteerMatchNotification(
                    volunteer.email,
                    event.eventName,
                    formattedDate
                );
            }

            return { 
                success: true,
                message: 'Volunteer status updated successfully'
            };
        } catch (error) {
            console.error('Error updating volunteer event status:', error);
            throw {
                success: false,
                message: 'Failed to update volunteer status',
                error: error.message
            };
        }
    },

    getAllHistory: async () => {
        try {
            return await VolunteerHistory.findAll({
                include: [{ 
                    model: Event,
                    attributes: [
                        'eventName', 'eventDescription', 'address', 
                        'city', 'state', 'zipCode', 'requiredSkills',
                        'urgency', 'eventDate', 'startTime', 'endTime'
                    ]
                }]
            });
        } catch (error) {
            console.error('Error getting all history:', error);
            throw error;
        }
    },

    getHistory: async (userId) => {
        try {
            await historyService.initializeHistory(userId);

            const history = await VolunteerHistory.findAll({
                where: { volunteerId: userId },
                include: [{
                    model: Event,
                    required: true,
                    attributes: [
                        'eventName', 'eventDescription', 
                        'address', 'city', 'state', 'zipCode',
                        'requiredSkills', 'urgency', 
                        'eventDate', 'startTime', 'endTime'
                    ]
                }],
                order: [[Event, 'eventDate', 'DESC']]
            });

            return history;
        } catch (error) {
            console.error('Error in getHistory service:', error);
            throw error;
        }
    },

    updateHistoryRecord: async (recordId, updateData) => {
        try {
            const record = await VolunteerHistory.findByPk(recordId);
            if (!record) {
                throw new Error('History record not found');
            }

            await record.update(updateData);
            return { 
                success: true,
                message: 'Record updated successfully',
                record 
            };
        } catch (error) {
            console.error('Error updating history record:', error);
            throw error;
        }
    },
    
    initializeEventHistory: async (eventId) => {
        try {
            return await historyService.initializeHistory(null, eventId);
        } catch (error) {
            console.error('Error initializing event history:', error);
            throw error;
        }
    }
};

module.exports = historyService;