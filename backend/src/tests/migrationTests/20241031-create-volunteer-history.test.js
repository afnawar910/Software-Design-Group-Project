const { Sequelize, DataTypes, QueryInterface } = require('sequelize');
const migration = require('../../../migrations/20241031-create-volunteer-history.js');

describe('20241031-create-volunteer-history Migration', () => {
  let queryInterface;
  let mockVolunteers;
  let mockEvents;

  beforeEach(() => {
    queryInterface = {
      addConstraint: jest.fn(),
      removeConstraint: jest.fn(),
      bulkInsert: jest.fn(),
      sequelize: {
        query: jest.fn()
      }
    };

    mockVolunteers = [
      { id: 1 },
      { id: 2 }
    ];
    mockEvents = [
      { id: 101 },
      { id: 102 }
    ];

    queryInterface.sequelize.query.mockImplementation((sql) => {
      if (sql.includes('Users')) {
        return [mockVolunteers];
      } else if (sql.includes('Events')) {
        return [mockEvents];
      }
      return [[]];
    });
  });

  describe('up migration', () => {
    test('adds unique constraint on volunteerId and eventId', async () => {
      await migration.up(queryInterface, Sequelize);

      expect(queryInterface.addConstraint).toHaveBeenCalledWith(
        'VolunteerHistories',
        {
          fields: ['volunteerId', 'eventId'],
          type: 'unique',
          name: 'volunteer_event_unique'
        }
      );
    });

    test('creates volunteer history records for all volunteer-event combinations', async () => {
      await migration.up(queryInterface, Sequelize);

      const expectedRecords = mockVolunteers.flatMap(volunteer => 
        mockEvents.map(event => ({
          volunteerId: volunteer.id,
          eventId: event.id,
          participationStatus: 'Not Attended',
          matchedAt: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }))
      );

      expect(queryInterface.bulkInsert).toHaveBeenCalledWith(
        'VolunteerHistories',
        expectedRecords,
        { ignoreDuplicates: true }
      );
    });

    test('queries for volunteers and events', async () => {
      await migration.up(queryInterface, Sequelize);

      expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
        `SELECT id FROM "Users" WHERE role = 'volunteer'`
      );
      expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
        `SELECT id FROM "Events"`
      );
    });
  });

  describe('down migration', () => {
    test('removes the unique constraint', async () => {
      await migration.down(queryInterface, Sequelize);

      expect(queryInterface.removeConstraint).toHaveBeenCalledWith(
        'VolunteerHistories',
        'volunteer_event_unique'
      );
    });
  });
});