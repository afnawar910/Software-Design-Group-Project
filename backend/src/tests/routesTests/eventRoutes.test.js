const request = require('supertest');
const express = require('express');
const eventRoutes = require('../../routes/eventRoutes');
const { verifyToken, verifyAdmin } = require('../../middleware/authMiddleware');
const eventController = require('../../controllers/eventController');

jest.mock('../../middleware/authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => next()),
  verifyAdmin: jest.fn((req, res, next) => next())
}));

jest.mock('../../controllers/eventController', () => ({
  getAllEvents: jest.fn((req, res) => res.json({ message: 'getAllEvents' })),
  getFormOptions: jest.fn((req, res) => res.json({ message: 'getFormOptions' })),
  getEventById: jest.fn((req, res) => res.json({ message: 'getEventById' })),
  createEvent: jest.fn((req, res) => res.json({ message: 'createEvent' })),
}));

describe('Event Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/events', eventRoutes);

    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should route to getAllEvents and use verifyToken middleware', async () => {
      const response = await request(app)
        .get('/api/events')
        .expect(200);

      expect(verifyToken).toHaveBeenCalled();
      expect(eventController.getAllEvents).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'getAllEvents' });
    });

    it('should handle unauthorized access', async () => {
      verifyToken.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      await request(app)
        .get('/api/events')
        .expect(401);

      expect(verifyToken).toHaveBeenCalled();
      expect(eventController.getAllEvents).not.toHaveBeenCalled();
    });
  });

  describe('GET /form-options', () => {
    it('should route to getFormOptions and use both auth middlewares', async () => {
      const response = await request(app)
        .get('/api/events/form-options')
        .expect(200);

      expect(verifyToken).toHaveBeenCalled();
      expect(verifyAdmin).toHaveBeenCalled();
      expect(eventController.getFormOptions).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'getFormOptions' });
    });

    it('should handle non-admin access', async () => {
      verifyAdmin.mockImplementationOnce((req, res, next) => {
        res.status(403).json({ message: 'Forbidden' });
      });

      await request(app)
        .get('/api/events/form-options')
        .expect(403);

      expect(verifyToken).toHaveBeenCalled();
      expect(verifyAdmin).toHaveBeenCalled();
      expect(eventController.getFormOptions).not.toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should route to getEventById and use both auth middlewares', async () => {
      const response = await request(app)
        .get('/api/events/1')
        .expect(200);

      expect(verifyToken).toHaveBeenCalled();
      expect(verifyAdmin).toHaveBeenCalled();
      expect(eventController.getEventById).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'getEventById' });
    });
  });

  describe('POST /', () => {
    it('should route to createEvent and use auth middlewares', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({ eventName: 'Test Event' })
        .expect(200);

      expect(verifyToken).toHaveBeenCalled();
      expect(verifyAdmin).toHaveBeenCalled();
      expect(eventController.createEvent).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'createEvent' });
    });
  });

  describe('Middleware Error Handling', () => {
    it('should handle verifyToken errors for all routes', async () => {
      verifyToken.mockImplementation((req, res, next) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      await request(app).get('/api/events').expect(401);
      await request(app).get('/api/events/form-options').expect(401);
      await request(app).get('/api/events/1').expect(401);
      await request(app).post('/api/events').expect(401);
    });

    it('should handle verifyAdmin errors for protected routes', async () => {
      // Allow verifyToken to pass but fail on verifyAdmin
      verifyToken.mockImplementation((req, res, next) => next());
      verifyAdmin.mockImplementation((req, res, next) => {
        res.status(403).json({ message: 'Forbidden' });
      });

      // Test admin-protected routes
      await request(app).get('/api/events/form-options').expect(403);
      await request(app).get('/api/events/1').expect(403);
      await request(app).post('/api/events').expect(403);
    });
  });
});