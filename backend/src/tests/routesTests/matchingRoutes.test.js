const request = require('supertest');
const express = require('express');
const matchingRoutes = require('../../routes/matchingRoutes');
const { verifyToken, verifyAdmin } = require('../../middleware/authMiddleware');
const matchingController = require('../../controllers/matchingController');

jest.mock('../../middleware/authMiddleware');
jest.mock('../../controllers/matchingController');

const app = express();
app.use(express.json());
app.use('/api/matching', matchingRoutes);

describe('Matching Routes', () => {
  beforeEach(() => {
    verifyToken.mockImplementation((req, res, next) => next());
    verifyAdmin.mockImplementation((req, res, next) => next());
  });

  describe('GET /:eventId', () => {
    it('should call getMatchingVolunteers controller', async () => {
      matchingController.getMatchingVolunteers.mockImplementation((req, res) => {
        res.status(200).json([{ id: '1', name: 'John Doe' }]);
      });

      const response = await request(app).get('/api/matching/123');

      expect(response.status).toBe(200);
      expect(matchingController.getMatchingVolunteers).toHaveBeenCalled();
    });
  });

  describe('POST /', () => {
    it('should call matchVolunteerToEvent controller', async () => {
      matchingController.matchVolunteerToEvent.mockImplementation((req, res) => {
        res.status(200).json({ message: 'Matched successfully' });
      });

      const response = await request(app)
        .post('/api/matching')
        .send({ eventId: '123', volunteerId: '456' });

      expect(response.status).toBe(200);
      expect(matchingController.matchVolunteerToEvent).toHaveBeenCalled();
    });
  });

  it('should use verifyToken and verifyAdmin middleware', async () => {
    await request(app).get('/api/matching/123');
    expect(verifyToken).toHaveBeenCalled();
    expect(verifyAdmin).toHaveBeenCalled();

    await request(app).post('/api/matching');
    expect(verifyToken).toHaveBeenCalled();
    expect(verifyAdmin).toHaveBeenCalled();
  });
});