const request = require('supertest');
const express = require('express');
const profileRoutes = require('../../routes/profileRoutes');
const profileController = require('../../controllers/profileController');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRegistrationToken, validateProfileUpdate } = require('../../utils/validators');

jest.mock('../../controllers/profileController');
jest.mock('../../middleware/authMiddleware');
jest.mock('../../utils/validators', () => ({
  validateRegistrationToken: jest.fn(),
  validateProfileUpdate: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/profile', profileRoutes);

describe('Profile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/profile/form-options', () => {
    it('should return form options without requiring authentication', async () => {
      profileController.getFormOptions.mockImplementation((req, res) => {
        res.status(200).json({
          states: [],
          skills: []
        });
      });

      const response = await request(app)
        .get('/api/profile/form-options');

      expect(response.status).toBe(200);
      expect(profileController.getFormOptions).toHaveBeenCalled();
      expect(authMiddleware.verifyToken).not.toHaveBeenCalled();
    });

    it('should handle errors from controller', async () => {
      profileController.getFormOptions.mockImplementation((req, res) => {
        res.status(500).json({ message: 'Internal server error' });
      });

      const response = await request(app)
        .get('/api/profile/form-options');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/profile', () => {
    it('should get profile when authenticated', async () => {
      authMiddleware.verifyToken.mockImplementation((req, res, next) => {
        req.userId = 1;
        next();
      });

      profileController.getProfile.mockImplementation((req, res) => {
        res.status(200).json({
          fullName: 'Test User',
          email: 'test@example.com'
        });
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(authMiddleware.verifyToken).toHaveBeenCalled();
      expect(profileController.getProfile).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      authMiddleware.verifyToken.mockImplementation((req, res) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(401);
      expect(profileController.getProfile).not.toHaveBeenCalled();
    });
  });


  describe('POST /api/profile/finalize-registration', () => {
    const validProfileData = {
      token: 'valid-token',
      fullName: 'Test User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      skills: ['Skill 1'],
      availability: ['2024-01-01']
    };

    it('should finalize registration with valid data', async () => {
      validateRegistrationToken.mockImplementation((req, res, next) => next());
      validateProfileUpdate.mockImplementation((req, res, next) => next());

      profileController.finalizeRegistration.mockImplementation((req, res) => {
        res.status(201).json({
          message: 'Registration finalized and profile created successfully'
        });
      });

      const response = await request(app)
        .post('/api/profile/finalize-registration')
        .send(validProfileData);

      expect(response.status).toBe(201);
      expect(validateRegistrationToken).toHaveBeenCalled();
      expect(validateProfileUpdate).toHaveBeenCalled();
      expect(profileController.finalizeRegistration).toHaveBeenCalled();
    });

    it('should fail with invalid token', async () => {
      validateRegistrationToken.mockImplementation((req, res) => {
        res.status(400).json({ message: 'Invalid token format' });
      });

      const response = await request(app)
        .post('/api/profile/finalize-registration')
        .send({ ...validProfileData, token: 'invalid' });

      expect(response.status).toBe(400);
      expect(profileController.finalizeRegistration).not.toHaveBeenCalled();
    });

    it('should fail with invalid profile data', async () => {
      validateRegistrationToken.mockImplementation((req, res, next) => next());
      validateProfileUpdate.mockImplementation((req, res) => {
        res.status(400).json({ message: 'Invalid profile data' });
      });

      const response = await request(app)
        .post('/api/profile/finalize-registration')
        .send({ ...validProfileData, skills: null });

      expect(response.status).toBe(400);
      expect(profileController.finalizeRegistration).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile', () => {
    const validUpdateData = {
      skills: ['New Skill'],
      preferences: 'New preferences',
      availability: ['2024-01-01']
    };

    it('should update profile when authenticated', async () => {
      authMiddleware.verifyToken.mockImplementation((req, res, next) => {
        req.userId = 1;
        next();
      });

      profileController.updateProfile.mockImplementation((req, res) => {
        res.status(200).json({
          message: 'Profile updated successfully',
          profile: validUpdateData
        });
      });

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(validUpdateData);

      expect(response.status).toBe(200);
      expect(authMiddleware.verifyToken).toHaveBeenCalled();
      expect(profileController.updateProfile).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      authMiddleware.verifyToken.mockImplementation((req, res) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .put('/api/profile')
        .send(validUpdateData);

      expect(response.status).toBe(401);
      expect(profileController.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      authMiddleware.verifyToken.mockImplementation((req, res, next) => {
        req.userId = 1;
        next();
      });

      profileController.updateProfile.mockImplementation((req, res) => {
        res.status(400).json({
          message: 'Validation failed',
          errors: ['Invalid skill format']
        });
      });

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ skills: {} }); 

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });
});