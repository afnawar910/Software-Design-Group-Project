const { matchVolunteersToEvent, matchVolunteerToEvent, getFutureEvents } = require('../../services/matchingService');
const eventService = require('../../services/eventService');
const profileService = require('../../services/profileService');
const { VolunteerHistory } = require('../../../models');

jest.mock('../../services/eventService');
jest.mock('../../services/profileService');
jest.mock('../../../models', () => ({
    VolunteerHistory: {
        findAll: jest.fn()
    }
}));

describe('matchingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('matchVolunteersToEvent', () => {
        const mockEvent = {
            id: '123',
            eventName: 'Tech Workshop',
            eventDate: '2024-12-25',
            requiredSkills: ['programming', 'teaching'],
            city: 'New York'
        };

        const mockVolunteers = [
            {
                userId: '1',
                fullName: 'John Doe',
                email: 'john@example.com',
                skills: ['programming', 'design'],
                city: 'New York',
                availability: ['2024-12-25', '2024-12-26']
            },
            {
                userId: '2',
                fullName: 'Jane Smith',
                email: 'jane@example.com',
                skills: ['teaching', 'writing'],
                city: 'New York',
                availability: ['2024-12-25']
            },
            {
                userId: '3',
                fullName: 'Bob Wilson',
                email: 'bob@example.com',
                skills: ['programming'],
                city: 'Boston',
                availability: ['2024-12-25']
            }
        ];

        it('should match volunteers based on skills, location, and availability excluding already matched volunteers', async () => {
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getAllProfiles.mockResolvedValue(mockVolunteers);
            VolunteerHistory.findAll.mockResolvedValue([{ volunteerId: '2' }]); 

            const matches = await matchVolunteersToEvent('123');

            expect(matches).toHaveLength(1);
            expect(matches).toContainEqual(expect.objectContaining({
                id: '1',
                fullName: 'John Doe',
                skills: ['programming']
            }));
            expect(matches).not.toContainEqual(expect.objectContaining({
                id: '2',
                fullName: 'Jane Smith'
            }));
        });

        it('should throw error for non-existent event', async () => {
            eventService.getEventById.mockResolvedValue(null);

            await expect(matchVolunteersToEvent('999'))
                .rejects
                .toEqual(expect.objectContaining({
                    status: 404,
                    message: 'Event not found'
                }));
        });

        it('should handle string and number event IDs', async () => {
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getAllProfiles.mockResolvedValue([]);
            VolunteerHistory.findAll.mockResolvedValue([]);

            await matchVolunteersToEvent(123);
            expect(eventService.getEventById).toHaveBeenCalledWith('123');

            await matchVolunteersToEvent('123');
            expect(eventService.getEventById).toHaveBeenCalledWith('123');
        });
    });

    describe('matchVolunteerToEvent', () => {
        const mockEvent = {
            id: '123',
            eventName: 'Tech Workshop',
            eventDate: '2024-12-25',
            requiredSkills: ['programming'],
            city: 'New York'
        };

        const mockVolunteer = {
            userId: '1',
            fullName: 'John Doe',
            skills: ['programming'],
            city: 'New York',
            availability: ['2024-12-25']
        };

        it('should successfully match valid volunteers to event', async () => {
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getProfile.mockResolvedValue(mockVolunteer);

            const results = await matchVolunteerToEvent('123', ['1']);

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                volunteerId: '1',
                message: 'Volunteer John Doe successfully matched to event Tech Workshop'
            });
        });

        it('should handle non-existent volunteer', async () => {
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getProfile.mockResolvedValue(null);

            const results = await matchVolunteerToEvent('123', ['999']);

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                volunteerId: '999',
                message: 'Volunteer not found'
            });
        });

        it('should handle availability mismatch', async () => {
            const unavailableVolunteer = { ...mockVolunteer, availability: ['2024-12-26'] };
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getProfile.mockResolvedValue(unavailableVolunteer);

            const results = await matchVolunteerToEvent('123', ['1']);

            expect(results[0]).toEqual({
                volunteerId: '1',
                message: 'Volunteer is not available on the event date'
            });
        });

        it('should handle city mismatch', async () => {
            const wrongCityVolunteer = { ...mockVolunteer, city: 'Boston' };
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getProfile.mockResolvedValue(wrongCityVolunteer);

            const results = await matchVolunteerToEvent('123', ['1']);

            expect(results[0]).toEqual({
                volunteerId: '1',
                message: 'Volunteer is not in the same city as the event'
            });
        });

        it('should handle skills mismatch', async () => {
            const wrongSkillsVolunteer = { ...mockVolunteer, skills: ['design'] };
            eventService.getEventById.mockResolvedValue(mockEvent);
            profileService.getProfile.mockResolvedValue(wrongSkillsVolunteer);

            const results = await matchVolunteerToEvent('123', ['1']);

            expect(results[0]).toEqual({
                volunteerId: '1',
                message: 'Volunteer does not have the required skills for this event'
            });
        });
    });

    describe('getFutureEvents', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-01'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        const mockEvents = [
            { id: '1', eventDate: '2024-12-25' },
            { id: '2', eventDate: '2023-01-01' },
            { id: '3', eventDate: '2024-12-26' }
        ];

        it('should return only future events', async () => {
            eventService.getAllEvents.mockResolvedValue(mockEvents);

            const futureEvents = await getFutureEvents();

            expect(futureEvents).toHaveLength(2);
            expect(futureEvents).toContainEqual(expect.objectContaining({ id: '1' }));
            expect(futureEvents).toContainEqual(expect.objectContaining({ id: '3' }));
            expect(futureEvents).not.toContainEqual(expect.objectContaining({ id: '2' }));
        });

        it('should handle errors from eventService', async () => {
            const error = new Error('Database error');
            eventService.getAllEvents.mockRejectedValue(error);

            await expect(getFutureEvents()).rejects.toThrow(error);
        });
    });
});