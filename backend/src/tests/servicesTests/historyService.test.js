const { VolunteerHistory, Event, User } = require('../../../models');
const historyService = require('../../services/historyService');

jest.mock('../../../models', () => ({
  VolunteerHistory: {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
    findByPk: jest.fn()
  },
  Event: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('History Service', () => {
  const mockEvent = {
    id: 1,
    eventName: 'Test Event',
    eventDescription: 'Test Description',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    requiredSkills: ['Animal Care'],
    urgency: 'Medium',
    eventDate: '2024-12-25',
    startTime: '09:00',
    endTime: '17:00'
  };

  const mockVolunteer = {
    id: 1,
    email: 'test@example.com',
    role: 'volunteer'
  };

  const mockHistoryRecord = {
    volunteerId: 1,
    eventId: 1,
    participationStatus: 'Not Attended',
    update: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeHistory', () => {
    it('should initialize history for all volunteers and events when no IDs provided', async () => {
      Event.findAll.mockResolvedValue([mockEvent]);
      User.findAll.mockResolvedValue([mockVolunteer]);
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, true]);

      const result = await historyService.initializeHistory();

      expect(Event.findAll).toHaveBeenCalled();
      expect(User.findAll).toHaveBeenCalledWith({ where: { role: 'volunteer' } });
      expect(VolunteerHistory.findOrCreate).toHaveBeenCalledWith({
        where: {
          volunteerId: mockVolunteer.id,
          eventId: mockEvent.id
        },
        defaults: {
          participationStatus: 'Not Attended'
        }
      });
      expect(result).toEqual([mockHistoryRecord]);
    });

    it('should initialize history for specific volunteer and event when IDs provided', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      User.findByPk.mockResolvedValue(mockVolunteer);
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, true]);

      const result = await historyService.initializeHistory(1, 1);

      expect(Event.findByPk).toHaveBeenCalledWith(1);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockHistoryRecord]);
    });

    it('should handle errors appropriately', async () => {
      Event.findAll.mockRejectedValue(new Error('Database error'));

      await expect(historyService.initializeHistory()).rejects.toThrow('Database error');
    });
  });

  describe('updateVolunteerEventStatus', () => {
    it('should create new history record if not exists', async () => {
      const newStatus = 'Attended';
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, true]);

      const result = await historyService.updateVolunteerEventStatus(1, 1, newStatus);

      expect(VolunteerHistory.findOrCreate).toHaveBeenCalledWith({
        where: { volunteerId: 1, eventId: 1 },
        defaults: {
          participationStatus: newStatus,
          matchedAt: expect.any(Date)
        }
      });
      expect(result).toEqual({
        success: true,
        message: 'Volunteer status updated successfully'
      });
    });

    it('should update existing history record', async () => {
      const newStatus = 'Attended';
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, false]);

      const result = await historyService.updateVolunteerEventStatus(1, 1, newStatus);

      expect(mockHistoryRecord.update).toHaveBeenCalledWith({
        participationStatus: newStatus,
        matchedAt: expect.any(Date)
      });
      expect(result).toEqual({
        success: true,
        message: 'Volunteer status updated successfully'
      });
    });

    it('should handle errors appropriately', async () => {
      VolunteerHistory.findOrCreate.mockRejectedValue(new Error('Database error'));

      await expect(historyService.updateVolunteerEventStatus(1, 1, 'Attended'))
        .rejects.toEqual({
          success: false,
          message: 'Failed to update volunteer status',
          error: 'Database error'
        });
    });
  });

  describe('getAllHistory', () => {
    it('should return all history records with event details', async () => {
      const mockHistoryWithEvent = {
        ...mockHistoryRecord,
        Event: mockEvent
      };
      
      VolunteerHistory.findAll.mockResolvedValue([mockHistoryWithEvent]);

      const result = await historyService.getAllHistory();

      expect(VolunteerHistory.findAll).toHaveBeenCalledWith({
        include: [{
          model: Event,
          attributes: [
            'eventName', 'eventDescription', 'address',
            'city', 'state', 'zipCode', 'requiredSkills',
            'urgency', 'eventDate', 'startTime', 'endTime'
          ]
        }]
      });
      expect(result).toEqual([mockHistoryWithEvent]);
    });

    it('should handle errors appropriately', async () => {
      VolunteerHistory.findAll.mockRejectedValue(new Error('Database error'));

      await expect(historyService.getAllHistory()).rejects.toThrow('Database error');
    });
  });

  describe('getHistory', () => {
    it('should initialize and return history for specific user', async () => {
      const mockHistoryWithEvent = {
        ...mockHistoryRecord,
        Event: mockEvent
      };

      Event.findAll.mockResolvedValue([mockEvent]);
      User.findByPk.mockResolvedValue(mockVolunteer);
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, true]);

      VolunteerHistory.findAll.mockResolvedValue([mockHistoryWithEvent]);

      const result = await historyService.getHistory(1);

      expect(VolunteerHistory.findAll).toHaveBeenCalledWith({
        where: { volunteerId: 1 },
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
      expect(result).toEqual([mockHistoryWithEvent]);
    });
  });

  describe('updateHistoryRecord', () => {
    it('should update an existing history record', async () => {
      VolunteerHistory.findByPk.mockResolvedValue(mockHistoryRecord);
      const updateData = { participationStatus: 'Attended' };

      const result = await historyService.updateHistoryRecord(1, updateData);

      expect(mockHistoryRecord.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual({
        success: true,
        message: 'Record updated successfully',
        record: mockHistoryRecord
      });
    });

    it('should throw error if record not found', async () => {
      VolunteerHistory.findByPk.mockResolvedValue(null);

      await expect(historyService.updateHistoryRecord(999, {}))
        .rejects.toThrow('History record not found');
    });
  });

  describe('initializeEventHistory', () => {
    it('should initialize history for specific event', async () => {
      const mockResult = [mockHistoryRecord];
      Event.findByPk.mockResolvedValue(mockEvent);
      User.findAll.mockResolvedValue([mockVolunteer]);
      VolunteerHistory.findOrCreate.mockResolvedValue([mockHistoryRecord, true]);

      const result = await historyService.initializeEventHistory(1);

      expect(Event.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});