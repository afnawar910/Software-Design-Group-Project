const eventController = require('../../controllers/eventController');
const eventService = require('../../services/eventService');

jest.mock('../../services/eventService');

describe('Event Controller', () => {
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const mockEventData = {
        eventName: 'Test Event',
        requiredSkills: ['Animal Care'],
        state: 'CA'
      };
      
      mockRequest = {
        body: mockEventData,
        userId: 1,
        userEmail: 'test@example.com',
        userRole: 'volunteer'
      };

      const expectedResult = {
        message: 'Event created successfully',
        event: { id: 1, ...mockEventData }
      };

      eventService.createEvent.mockResolvedValueOnce(expectedResult);

      await eventController.createEvent(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(eventService.createEvent).toHaveBeenCalledWith(mockEventData, 1);
    });

    it('should return 400 when userId is missing', async () => {
      mockRequest = {
        body: {},
        userEmail: 'test@example.com',
        userRole: 'volunteer'
      };

      await eventController.createEvent(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{
          field: 'createdBy',
          message: 'User ID is missing'
        }]
      });
    });

    it('should handle validation errors', async () => {
      mockRequest = {
        body: {},
        userId: 1
      };

      const error = {
        status: 400,
        errors: [{
          field: 'eventName',
          message: 'Event name is required'
        }]
      };

      eventService.createEvent.mockRejectedValueOnce(error);

      await eventController.createEvent(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: error.errors });
    });
  });

  describe('getAllEvents', () => {
    it('should fetch all events successfully', async () => {
      const mockEvents = [
        { id: 1, eventName: 'Event 1' },
        { id: 2, eventName: 'Event 2' }
      ];

      eventService.getAllEvents.mockResolvedValueOnce(mockEvents);

      await eventController.getAllEvents(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEvents);
    });

    it('should handle errors when fetching events', async () => {
      eventService.getAllEvents.mockRejectedValueOnce(new Error('Database error'));

      await eventController.getAllEvents(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });

  describe('getEventById', () => {
    it('should fetch event by id successfully', async () => {
      const mockEvent = { id: 1, eventName: 'Test Event' };
      mockRequest = {
        params: { id: 1 }
      };

      eventService.getEventById.mockResolvedValueOnce(mockEvent);

      await eventController.getEventById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle not found error', async () => {
      mockRequest = {
        params: { id: 999 }
      };

      eventService.getEventById.mockRejectedValueOnce({
        status: 404,
        message: 'Event not found'
      });

      await eventController.getEventById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Event not found'
      });
    });
  });

  describe('getFormOptions', () => {
    it('should fetch form options successfully', async () => {
      const mockOptions = {
        states: ['CA', 'NY'],
        skills: ['Animal Care'],
        urgencyLevels: ['Low', 'Medium', 'High']
      };

      eventService.getFormOptions.mockResolvedValueOnce(mockOptions);

      await eventController.getFormOptions(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOptions);
    });

    it('should handle errors when fetching form options', async () => {
      eventService.getFormOptions.mockRejectedValueOnce(new Error('Database error'));

      await eventController.getFormOptions(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error'
      });
    });
  });
});

