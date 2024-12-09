const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middleware/authMiddleware');

jest.mock('../../controllers/authController');
jest.mock('../../middleware/authMiddleware');
jest.mock('../../utils/validators', () => ({
  validateRegistration: jest.fn((req, res, next) => next()),
  validateLogin: jest.fn((req, res, next) => next())
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    authMiddleware.verifyToken.mockImplementation((req, res, next) => {
      req.userId = 'mock-user-id';
      req.userEmail = 'test@example.com';
      req.userRole = 'volunteer';
      next();
    });
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    it('should successfully register a new user', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ message: 'User registered successfully' });
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
      expect(response.body).toEqual({ message: 'User registered successfully' });
    });

    it('should handle registration errors', async () => {
      authController.register.mockImplementation((req, res) => {
        res.status(400).json({ error: 'Email already exists' });
      });

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Email already exists' });
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should successfully login a user', async () => {
      authController.login.mockImplementation((req, res) => {
        res.json({ token: 'mock-token' });
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
      expect(response.body).toHaveProperty('token');
    });

    it('should handle invalid credentials', async () => {
      authController.login.mockImplementation((req, res) => {
        res.status(401).json({ error: 'Invalid credentials' });
      });

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /auth/volunteers', () => {
      it('should return all volunteers when authenticated', async () => {
        authController.getAllVolunteers.mockImplementation((req, res) => {
          res.json({ volunteers: [] });
        });

        const response = await request(app)
          .get('/auth/volunteers')
          .set('Authorization', 'Bearer mock-token');

        expect(response.status).toBe(200);
        expect(authController.getAllVolunteers).toHaveBeenCalled();
      });

      it('should handle unauthorized access', async () => {
        authMiddleware.verifyToken.mockImplementation((req, res) => {
          res.status(401).json({ error: 'Unauthorized' });
        });

        const response = await request(app)
          .get('/auth/volunteers')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Unauthorized' });
      });
    });

    describe('GET /auth/registered-volunteers', () => {
      it('should return registered volunteers when authenticated', async () => {
        authController.getRegisteredVolunteers.mockImplementation((req, res) => {
          res.json({ registeredVolunteers: [] });
        });

        const response = await request(app)
          .get('/auth/registered-volunteers')
          .set('Authorization', 'Bearer mock-token');

        expect(response.status).toBe(200);
        expect(authController.getRegisteredVolunteers).toHaveBeenCalled();
      });
    });

    describe('GET /auth/verify', () => {
      it('should return user details when token is valid', async () => {
        const response = await request(app)
          .get('/auth/verify')
          .set('Authorization', 'Bearer mock-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          id: 'mock-user-id',
          email: 'test@example.com',
          role: 'volunteer'
        });
      });
    });
  });
});