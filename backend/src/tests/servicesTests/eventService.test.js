const eventService = require('../../services/eventService');
const historyService = require('../../services/historyService');
const { Event, State, User } = require('../../../models');
const { Op } = require('sequelize');

jest.mock('../../../models', () => ({
    Event: {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn()
    },
    State: {
        findAll: jest.fn(),
        findOne: jest.fn(),
    },
    User: {
        findOne: jest.fn(),
    }
}));

jest.mock('../../services/historyService', () => ({
    initializeEventHistory: jest.fn()
}));

describe('Event Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getFormOptions', () => {
        it('should return states, skills, and urgency levels', async () => {
            State.findAll.mockResolvedValue([{ code: 'TX', name: 'Texas' }]);

            const result = await eventService.getFormOptions();

            expect(result).toEqual({
                states: [{ code: 'TX', name: 'Texas' }],
                skills: expect.any(Array),
                urgencyLevels: ['Low', 'Medium', 'High', 'Critical']
            });
        });

        it('should throw an error if there is an issue fetching form options', async () => {
            State.findAll.mockRejectedValue(new Error('Database error'));

            await expect(eventService.getFormOptions()).rejects.toEqual({
                status: 500,
                message: 'Error fetching form options',
                error: 'Database error'
            });
        });
    });

    describe('createEvent', () => {
        const eventData = {
            eventName: 'Animal Care Day',
            eventDate: '2024-11-15',
            requiredSkills: ['Animal Care'],
            state: 'TX'
        };
        const userId = 1;

        it('should handle Sequelize validation errors', async () => {
            const validationError = new Error('Validation error');
            validationError.name = 'SequelizeValidationError';
            validationError.errors = [
                { path: 'eventName', message: 'Event name is required' }
            ];

            Event.create.mockRejectedValue(validationError);
            State.findOne.mockResolvedValue({ code: 'TX', name: 'Texas' });

            await expect(eventService.createEvent(eventData, userId)).rejects.toEqual({
                status: 400,
                errors: [{
                    field: 'eventName',
                    message: 'Event name is required'
                }]
            });
        });
    });

    describe('searchEvents', () => {

        it('should throw an error for invalid date formats', async () => {
            const invalidCriteria = {
                startDate: 'invalid-date',
                endDate: '2024-12-31'
            };

            await expect(eventService.searchEvents(invalidCriteria)).rejects.toEqual({
                status: 400,
                message: 'Invalid start date format',
                error: 'Invalid start date format'
            });
        });

        it('should throw an error when start date is after end date', async () => {
            const invalidCriteria = {
                startDate: '2024-12-31',
                endDate: '2024-01-01'
            };

            await expect(eventService.searchEvents(invalidCriteria)).rejects.toEqual({
                status: 400,
                message: 'Start date must be before end date',
                error: 'Start date must be before end date'
            });
        });

        it('should handle search with date range criteria', async () => {
            const criteria = {
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };

            Event.findAll.mockResolvedValue([{ id: 1, eventName: 'Sample Event' }]);

            const events = await eventService.searchEvents(criteria);

            expect(Event.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    eventDate: {
                        [Op.gte]: new Date('2024-01-01'),
                        [Op.lte]: new Date('2024-12-31')
                    }
                }
            }));
            expect(events).toEqual([{ id: 1, eventName: 'Sample Event' }]);
        });

        it('should handle search with required skills', async () => {
            const criteria = {
                requiredSkills: ['Animal Care', 'Cleaning']
            };

            Event.findAll.mockResolvedValue([{ id: 1, eventName: 'Sample Event' }]);

            const events = await eventService.searchEvents(criteria);

            expect(Event.findAll).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    requiredSkills: {
                        [Op.overlap]: ['Animal Care', 'Cleaning']
                    }
                }
            }));
            expect(events).toEqual([{ id: 1, eventName: 'Sample Event' }]);
        });
    });
});