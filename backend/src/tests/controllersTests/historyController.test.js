const historyController = require('../../controllers/historyController');
const historyService = require('../../services/historyService');

jest.mock('../../services/historyService');

describe('History Controller', () => {
  let mockReq;
  let mockRes;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockReq = {
      params: {},
      body: {},
      userRole: 'volunteer'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAllHistory', () => {
    it('should return all history records successfully', () => {
      const mockHistory = [
        { id: 1, eventName: 'Event 1' },
        { id: 2, eventName: 'Event 2' }
      ];

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      historyService.getAllHistory.mockReturnValue(mockHistory);

      historyController.getAllHistory(mockReq, mockRes);

      expect(consoleLogSpy).toHaveBeenCalledWith('Controller: Fetching all history records');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockHistory);

      consoleLogSpy.mockRestore();
    });
  });

  describe('getHistory', () => {
    const mockHistoryData = [
      {
        id: 1,
        Event: {
          eventName: 'Beach Cleanup',
          eventDescription: 'Clean the beach',
          address: '123 Beach St',
          city: 'Miami',
          state: 'FL',
          zipCode: '33139',
          requiredSkills: ['cleaning'],
          urgency: 'high',
          eventDate: '2024-03-15',
          startTime: '09:00',
          endTime: '12:00'
        },
        participationStatus: 'Completed'
      }
    ];

    it('should fetch and format history for a specific user', async () => {
      mockReq.params.userId = '1';
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      historyService.getHistory.mockResolvedValue(mockHistoryData);

      await historyController.getHistory(mockReq, mockRes);

      expect(consoleLogSpy).toHaveBeenCalledWith('Controller: Fetching history for userId:', 1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        {
          id: 1,
          eventName: 'Beach Cleanup',
          eventDescription: 'Clean the beach',
          location: '123 Beach St, Miami, FL 33139',
          requiredSkills: ['cleaning'],
          urgency: 'high',
          eventDate: '2024-03-15',
          startTime: '09:00',
          endTime: '12:00',
          participationStatus: 'Completed'
        }
      ]);

      consoleLogSpy.mockRestore();
    });

    it('should handle errors when fetching history', async () => {
      mockReq.params.userId = '1';
      const error = new Error('Database error');
      historyService.getHistory.mockRejectedValue(error);

      await historyController.getHistory(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getHistory controller:', error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error fetching volunteer history',
        error: 'Database error'
      });
    });

    it('should handle invalid userId parameter', async () => {
      mockReq.params.userId = 'invalid';
      
      await historyController.getHistory(mockReq, mockRes);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error fetching volunteer history',
        error: expect.any(String)
      });
    });
  });

  describe('updateHistoryRecord', () => {
    beforeEach(() => {
      mockReq.params.id = '1';
      mockReq.body = { participationStatus: 'Completed' };
    });

    it('should successfully update history record for admin', async () => {
      mockReq.userRole = 'admin';
      historyService.updateHistoryRecord.mockResolvedValue({
        success: true,
        record: { id: 1, participationStatus: 'Completed' }
      });

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Record updated successfully',
        record: { id: 1, participationStatus: 'Completed' }
      });
    });

    it('should reject update if user is not authenticated', async () => {
      mockReq.userRole = undefined;

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized'
      });
    });

    it('should reject participation status update for non-admin users', async () => {
      mockReq.userRole = 'volunteer';

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Only admins can update participation status'
      });
    });

    it('should allow non-admin users to update non-participation status fields', async () => {
      mockReq.userRole = 'volunteer';
      mockReq.body = { someOtherField: 'value' }; 
      
      historyService.updateHistoryRecord.mockResolvedValue({
        success: true,
        record: { id: 1, someOtherField: 'value' }
      });

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Record updated successfully',
        record: { id: 1, someOtherField: 'value' }
      });
    });

    it('should handle service errors during update', async () => {
      mockReq.userRole = 'admin';
      historyService.updateHistoryRecord.mockRejectedValue(new Error('Service error'));

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in updateHistoryRecord:', expect.any(Error));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during update'
      });
    });

    it('should handle unsuccessful updates from service', async () => {
      mockReq.userRole = 'admin';
      historyService.updateHistoryRecord.mockResolvedValue({
        success: false,
        message: 'Record not found'
      });

      await historyController.updateHistoryRecord(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Record not found'
      });
    });
  });

  describe('updateVolunteerEventStatus', () => {
    it('should successfully update volunteer event status', async () => {
      mockReq.body = {
        volunteerId: 1,
        eventId: 2
      };

      historyService.updateVolunteerEventStatus.mockResolvedValue({
        success: true,
        message: 'Status updated successfully'
      });

      await historyController.updateVolunteerEventStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Status updated successfully'
      });
    });

    it('should handle missing volunteerId', async () => {
      mockReq.body = {
        eventId: 2
      };

      await historyController.updateVolunteerEventStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Volunteer ID and Event ID are required'
      });
    });

    it('should handle missing eventId', async () => {
      mockReq.body = {
        volunteerId: 1
      };

      await historyController.updateVolunteerEventStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Volunteer ID and Event ID are required'
      });
    });

    it('should handle service errors', async () => {
      mockReq.body = {
        volunteerId: 1,
        eventId: 2
      };

      historyService.updateVolunteerEventStatus.mockRejectedValue(
        new Error('Service error')
      );

      await historyController.updateVolunteerEventStatus(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error updating volunteer status'
      });
    });
  });
});