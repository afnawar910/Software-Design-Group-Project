const matchingController = require('../../controllers/matchingController');
const matchingService = require('../../services/matchingService');
const historyService = require('../../services/historyService');

jest.mock('../../services/matchingService');
jest.mock('../../services/historyService', () => ({
    initializeHistory: jest.fn(),
    updateVolunteerEventStatus: jest.fn()
}));

describe('matchingController', () => {
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        mockRequest = {
            params: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getMatchingVolunteers', () => {
        it('should return matching volunteers successfully', async () => {
            mockRequest.params.eventId = '123';
            const mockVolunteers = [
                { id: '1', fullName: 'John Doe', email: 'john@example.com', skills: ['programming'] },
                { id: '2', fullName: 'Jane Smith', email: 'jane@example.com', skills: ['teaching'] }
            ];

            matchingService.matchVolunteersToEvent.mockResolvedValue(mockVolunteers);

            await matchingController.getMatchingVolunteers(mockRequest, mockResponse);

            expect(matchingService.matchVolunteersToEvent).toHaveBeenCalledWith('123');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockVolunteers);
        });

        it('should handle event not found error', async () => {
            mockRequest.params.eventId = '999';
            const error = {
                status: 404,
                message: 'Event not found'
            };

            matchingService.matchVolunteersToEvent.mockRejectedValue(error);

            await matchingController.getMatchingVolunteers(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Event not found'
            });
        });

        it('should handle generic service errors', async () => {
            mockRequest.params.eventId = '123';
            const error = new Error('Database connection failed');

            matchingService.matchVolunteersToEvent.mockRejectedValue(error);

            await matchingController.getMatchingVolunteers(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: error.message
            });
        });
    });

    describe('getFutureEvents', () => {
        it('should return future events successfully', async () => {
            const futureEvents = [
                { id: '1', name: 'Future Event 1', eventDate: '2024-12-25' },
                { id: '2', name: 'Future Event 2', eventDate: '2024-12-26' }
            ];

            matchingService.getFutureEvents.mockResolvedValue(futureEvents);

            await matchingController.getFutureEvents(mockRequest, mockResponse);

            expect(matchingService.getFutureEvents).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(futureEvents);
        });

        it('should handle service errors when fetching future events', async () => {
            const error = new Error('Database error');

            matchingService.getFutureEvents.mockRejectedValue(error);

            await matchingController.getFutureEvents(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Error fetching future events'
            });
        });
    });

    describe('matchVolunteerToEvent', () => {
        it('should handle missing volunteerId', async () => {
            mockRequest.body = { eventId: '123' };

            await matchingController.matchVolunteerToEvent(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Volunteer ID and Event ID are required'
            });
        });

        it('should handle missing eventId', async () => {
            mockRequest.body = { volunteerId: '1' };

            await matchingController.matchVolunteerToEvent(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Volunteer ID and Event ID are required'
            });
        });

        it('should successfully match volunteer to event', async () => {
            mockRequest.body = { volunteerId: '1', eventId: '123' };
            const mockResult = { 
                status: 'success', 
                message: 'Match created successfully'
            };

            historyService.initializeHistory.mockResolvedValue([]);
            historyService.updateVolunteerEventStatus.mockResolvedValue(mockResult);

            await matchingController.matchVolunteerToEvent(mockRequest, mockResponse);

            expect(historyService.initializeHistory).toHaveBeenCalledWith('1', '123');
            expect(historyService.updateVolunteerEventStatus).toHaveBeenCalledWith(
                '1',
                '123',
                'Matched - Pending Attendance'
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should handle history service errors', async () => {
            mockRequest.body = { volunteerId: '1', eventId: '123' };
            const error = {
                status: 404,
                message: 'History record not found'
            };

            historyService.initializeHistory.mockRejectedValue(error);

            await matchingController.matchVolunteerToEvent(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'History record not found'
            });
        });

        it('should handle generic errors during matching', async () => {
            mockRequest.body = { volunteerId: '1', eventId: '123' };
            const error = new Error('Unexpected error');

            historyService.initializeHistory.mockResolvedValue([]);
            historyService.updateVolunteerEventStatus.mockRejectedValue(error);

            await matchingController.matchVolunteerToEvent(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Error matching volunteer to event'
            });
        });
    });
});