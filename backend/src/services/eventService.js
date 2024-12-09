const historyService = require('../services/historyService');
const authService = require('../services/authService');
const notificationService = require('../services/notificationService');

const { Op } = require('sequelize');

const { Event, State, User } = require('../../models');

const AVAILABLE_SKILLS = [
    'Animal Care',
    'Assisting Potential Adopters',
    'Cleaning',
    'Dog Walking',
    'Emergency Response',
    'Event Coordination',
    'Exercise',
    'Feeding',
    'Grooming',
    'Helping with Laundry',
    'Medication',
    'Organizing Shelter Donations',
    'Potty and Leash Training',
    'Taking Photos of Animals',
    'Temporary Foster Care'
];

exports.getFormOptions = async () => {
    try {
        const states = await State.findAll({
            attributes: ['code', 'name'],
            order: [['name', 'ASC']]
        });

        return {
            states,
            skills: AVAILABLE_SKILLS,
            urgencyLevels: ['Low', 'Medium', 'High', 'Critical']
        };
    } catch (error) {
        throw {
            status: 500,
            message: 'Error fetching form options',
            error: error.message
        };
    }
};

exports.getAllEvents = async () => {
    try {
        const events = await Event.findAll({
            include: [
                {
                    model: State,
                    attributes: ['code', 'name']
                },
                {
                    model: User,
                    attributes: ['email']
                }
            ],
            order: [['eventDate', 'ASC']]
        });
        return events;
    } catch (error) {
        throw {
            status: 500,
            message: 'Error fetching events',
            error: error.message
        };
    }
};
exports.createEvent = async (eventData, userId) => {
    try {
        console.log('Creating event with data:', eventData);
        console.log('User ID received:', userId); 

        const invalidSkills = eventData.requiredSkills.filter(
            skill => !AVAILABLE_SKILLS.includes(skill)
        );
        
        if (invalidSkills.length > 0) {
            throw {
                status: 400,
                message: 'Invalid skills provided',
                invalidSkills
            };
        }

        const stateExists = await State.findOne({
            where: { code: eventData.state }
        });

        if (!stateExists) {
            throw {
                status: 400,
                message: 'Invalid state code provided'
            };
        }

        const eventWithUser = {
            ...eventData,
            createdBy: userId
        };

        console.log('Final event data:', eventWithUser);  

        const event = await Event.create(eventWithUser);
        

        notificationService.createEventNotification({
            eventName: event.eventName,
            eventDate: event.eventDate
        });

        await historyService.initializeEventHistory(event.id);

        return {
            message: "Event created successfully",
            event: await this.getEventById(event.id)
        };
    } catch (error) {
        console.error('Error in createEvent service:', error);  
        if (error.name === 'SequelizeValidationError') {
            throw {
                status: 400,
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            };
        }
        throw error;
    }
};

exports.getEventById = async (id) => {
    try {
        const event = await Event.findByPk(id, {
            include: [
                {
                    model: State,
                    attributes: ['code', 'name']
                },
                {
                    model: User,
                    attributes: ['email']
                }
            ]
        });

        if (!event) {
            throw {
                status: 404,
                message: 'Event not found'
            };
        }

        return event;
    } catch (error) {
        throw error;
    }
};

exports.searchEvents = async (criteria) => {
    try {
        const where = {};

        if (criteria.state) {
            where.state = criteria.state;
        }

        if (criteria.urgency) {
            where.urgency = criteria.urgency;
        }

        if (criteria.requiredSkills && Array.isArray(criteria.requiredSkills)) {
            where.requiredSkills = {
                [Op.overlap]: criteria.requiredSkills
            };
        }

        if (criteria.startDate || criteria.endDate) {
            const startDate = criteria.startDate ? new Date(criteria.startDate) : null;
            const endDate = criteria.endDate ? new Date(criteria.endDate) : null;

            if (startDate && isNaN(startDate)) {
                throw { status: 400, message: "Invalid start date format" };
            }

            if (endDate && isNaN(endDate)) {
                throw { status: 400, message: "Invalid end date format" };
            }

            if (startDate && endDate && startDate > endDate) {
                throw { status: 400, message: "Start date must be before end date" };
            }

            where.eventDate = {};
            if (startDate) where.eventDate[Op.gte] = startDate;
            if (endDate) where.eventDate[Op.lte] = endDate;
        }

        if (Object.keys(where).length === 0) {
            throw { status: 400, message: "No search criteria provided" };
        }

        const events = await Event.findAll({
            where,
            include: [
                {
                    model: State,
                    attributes: ['code', 'name']
                },
                {
                    model: User,
                    attributes: ['email']
                }
            ],
            order: [['eventDate', 'ASC']]
        });

        return events;

    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || 'Error searching events',
            error: error.error || error.message
        };
    }
};
