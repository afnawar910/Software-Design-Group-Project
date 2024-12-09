const request = require('supertest');
const express = require('express');
const historyRoutes = require('../../routes/historyRoutes');
const { verifyToken, verifyAdmin } = require('../../middleware/authMiddleware');
const historyController = require('../../controllers/historyController');
const eventController = require('../../controllers/eventController');

jest.mock('../../middleware/authMiddleware');
jest.mock('../../controllers/historyController');
jest.mock('../../controllers/eventController');

const app = express();
app.use(express.json());
app.use('/history', historyRoutes);

describe('History Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /history should call verifyToken, eventController.getAllEvents, and historyController.getAllHistory', async () => {
    verifyToken.mockImplementation((req, res, next) => next());
    eventController.getAllEvents.mockImplementation((req, res, next) => next());
    historyController.getAllHistory.mockImplementation((req, res) => res.status(200).json({}));

    const response = await request(app).get('/history');

    expect(verifyToken).toHaveBeenCalled();
    expect(eventController.getAllEvents).toHaveBeenCalled();
    expect(historyController.getAllHistory).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  test('GET /history/:userId should call verifyToken and historyController.getHistory', async () => {
    verifyToken.mockImplementation((req, res, next) => next());
    historyController.getHistory.mockImplementation((req, res) => res.status(200).json({}));

    const response = await request(app).get('/history/123');

    expect(verifyToken).toHaveBeenCalled();
    expect(historyController.getHistory).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  test('PUT /history/:id should call verifyToken, verifyAdmin, and historyController.updateHistoryRecord', async () => {
    verifyToken.mockImplementation((req, res, next) => next());
    verifyAdmin.mockImplementation((req, res, next) => next());
    historyController.updateHistoryRecord.mockImplementation((req, res) => res.status(200).json({}));

    const response = await request(app).put('/history/123');

    expect(verifyToken).toHaveBeenCalled();
    expect(verifyAdmin).toHaveBeenCalled();
    expect(historyController.updateHistoryRecord).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
