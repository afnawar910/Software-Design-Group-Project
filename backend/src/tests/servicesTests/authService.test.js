const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../../models');
const { Op } = require('sequelize');
const authService = require('../../services/authService');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
    update: jest.fn()
  }
}));

describe('AuthService', () => {
  let tokenCounter = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenCounter = 0;
    crypto.randomBytes.mockImplementation(() => ({
      toString: () => `mockedToken${++tokenCounter}`
    }));
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValueOnce(null);
      
      User.create.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        role: 'volunteer'
      });

      const result = await authService.registerUser('test@example.com', 'password123');

      expect(result.status).toBe(201);
      expect(result.message).toBe('Temporary user created. Please complete your profile.');
      expect(result.token).toBeDefined();
      expect(result.needsProfile).toBe(true);
      
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        role: 'volunteer',
        registrationToken: expect.any(String),
        tokenExpiresAt: expect.any(Date),
        isRegistered: false
      });
    });

    it('should prevent registration with existing email', async () => {
      User.findOne.mockResolvedValueOnce({ id: 1, email: 'existing@example.com' });

      const result = await authService.registerUser('existing@example.com', 'password123');

      expect(result.status).toBe(400);
      expect(result.message).toBe('User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      User.findOne.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.registerUser('test@example.com', 'password123');

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error creating user');
    });

    it('should handle user creation failure', async () => {
      User.findOne.mockResolvedValueOnce(null);
      User.create.mockResolvedValueOnce(null); 

      const result = await authService.registerUser('test@example.com', 'password123');

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error creating temporary user');
    });
  });

  describe('verifyTemporaryUserByToken', () => {
    it('should verify a temporary user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'temp@example.com',
        isRegistered: false,
        tokenExpiresAt: new Date(Date.now() + 600000) // 10 minutes from now
      };

      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await authService.verifyTemporaryUserByToken('valid-token');

      expect(result).toEqual(mockUser);
      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          registrationToken: 'valid-token',
          tokenExpiresAt: expect.any(Object),
          isRegistered: false
        }
      });
    });

    it('should return null for expired or invalid token', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const result = await authService.verifyTemporaryUserByToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('finalizeRegistration', () => {
    it('should finalize registration successfully', async () => {
      const mockUser = {
        id: 1,
        tokenExpiresAt: new Date(Date.now() + 600000),
        update: jest.fn().mockResolvedValueOnce(true)
      };

      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await authService.finalizeRegistration(1, { name: 'John' });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Registration finalized successfully');
      expect(mockUser.update).toHaveBeenCalledWith({
        isRegistered: true,
        registrationToken: null,
        tokenExpiresAt: null
      });
    });

    it('should handle non-existent user', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const result = await authService.finalizeRegistration(999, { name: 'John' });

      expect(result.status).toBe(404);
      expect(result.message).toBe('Temporary user not found');
    });

    it('should handle expired token during finalization', async () => {
      const mockUser = {
        id: 1,
        tokenExpiresAt: new Date(Date.now() - 600000) // 10 minutes ago (expired)
      };

      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await authService.finalizeRegistration(1, { name: 'John' });

      expect(result.status).toBe(400);
      expect(result.message).toBe('Registration token has expired');
    });

    it('should handle database errors during finalization', async () => {
      User.findOne.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.finalizeRegistration(1, { name: 'John' });

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error finalizing registration');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'volunteer',
        isRegistered: true,
        validatePassword: jest.fn().mockResolvedValueOnce(true)
      };

      User.findOne.mockResolvedValueOnce(mockUser);
      jwt.sign.mockReturnValueOnce('mocked-jwt-token');

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(result.status).toBe(200);
      expect(result.token).toBe('mocked-jwt-token');
      expect(result.role).toBe('volunteer');
    });

    it('should reject login for unregistered user', async () => {
      const mockUser = {
        isRegistered: false
      };

      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await authService.loginUser('temp@example.com', 'password123');

      expect(result.status).toBe(401);
      expect(result.message).toBe('Error: Registration not complete. Try registering again in 10 minutes.');
    });

    it('should reject login with invalid credentials', async () => {
      const mockUser = {
        isRegistered: true,
        validatePassword: jest.fn().mockResolvedValueOnce(false)
      };

      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await authService.loginUser('test@example.com', 'wrongpassword');

      expect(result.status).toBe(401);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should handle user not found during login', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const result = await authService.loginUser('nonexistent@example.com', 'password123');

      expect(result.status).toBe(404);
      expect(result.message).toBe('User not found');
    });

    it('should handle database errors during login', async () => {
      User.findOne.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error during login');
    });
  });

  describe('getAllVolunteers', () => {
    it('should return all registered volunteers', async () => {
      const mockVolunteers = [
        { id: 1, email: 'vol1@example.com' },
        { id: 2, email: 'vol2@example.com' }
      ];

      User.findAll.mockResolvedValueOnce(mockVolunteers);

      const result = await authService.getAllVolunteers();

      expect(result).toEqual(mockVolunteers);
      expect(User.findAll).toHaveBeenCalledWith({
        where: {
          role: 'volunteer',
          isRegistered: true
        },
        attributes: ['id', 'email']
      });
    });

    it('should handle database errors', async () => {
      User.findAll.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.getAllVolunteers();

      expect(result).toEqual([]);
    });
  });

  describe('cleanupTemporaryUsers', () => {
    it('should remove expired temporary users', async () => {
      User.destroy.mockResolvedValueOnce(2); 

      await authService.cleanupTemporaryUsers();

      expect(User.destroy).toHaveBeenCalledWith({
        where: {
          isRegistered: false,
          tokenExpiresAt: {
            [Op.lt]: expect.any(Date)
          }
        }
      });
    });

    it('should handle database errors during cleanup', async () => {
      User.destroy.mockRejectedValueOnce(new Error('Database error'));

      await authService.cleanupTemporaryUsers();
    });
  });
  
  describe('getRegisteredVolunteers', () => {
    it('should return registered volunteers successfully', async () => {
      const mockVolunteers = [
        { id: 1, email: 'vol1@example.com' },
        { id: 2, email: 'vol2@example.com' }
      ];

      User.findAll.mockResolvedValueOnce(mockVolunteers);

      const result = await authService.getRegisteredVolunteers();

      expect(result).toEqual(mockVolunteers);
      expect(User.findAll).toHaveBeenCalledWith({
        where: {
          role: 'volunteer',
          isRegistered: true
        },
        attributes: ['id', 'email']
      });
    });

    it('should handle database errors when getting registered volunteers', async () => {
      User.findAll.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.getRegisteredVolunteers();

      expect(result).toEqual([]);
    });
  });
});