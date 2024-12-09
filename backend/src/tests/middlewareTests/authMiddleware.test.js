const authMiddleware = require('../../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');

jest.mock('jsonwebtoken');
jest.mock('../../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      userId: null,
      userEmail: null,
      userRole: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'volunteer',
      isRegistered: true
    };

    it('should call next if token is valid and user exists', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockImplementation(() => ({ id: 1 }));
      User.findOne.mockResolvedValue(mockUser);

      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.userId).toBe(mockUser.id);
      expect(mockReq.userEmail).toBe(mockUser.email);
      expect(mockReq.userRole).toBe(mockUser.role);
    });

    it('should return 403 if no token is provided', async () => {
      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if authorization header is malformed', async () => {
      mockReq.headers.authorization = 'Bearer ';

      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Malformed token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      mockReq.headers.authorization = 'Bearer expiredtoken';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw error; });

      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token has expired' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw error; });

      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not found or not registered', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockImplementation(() => ({ id: 1 }));
      User.findOne.mockResolvedValue(null);

      await authMiddleware.verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found or registration incomplete' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('verifyAdmin', () => {
    it('should call next if user is admin', async () => {
      mockReq.userRole = 'admin';

      await authMiddleware.verifyAdmin(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if userRole is not set', async () => {
      await authMiddleware.verifyAdmin(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      mockReq.userRole = 'volunteer';

      await authMiddleware.verifyAdmin(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access forbidden: Admin privileges required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('verifyVolunteer', () => {
    it('should call next if user is volunteer', async () => {
      mockReq.userRole = 'volunteer';

      await authMiddleware.verifyVolunteer(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if userRole is not set', async () => {
      await authMiddleware.verifyVolunteer(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not volunteer', async () => {
      mockReq.userRole = 'admin';

      await authMiddleware.verifyVolunteer(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access forbidden: Volunteer privileges required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'volunteer'
    };

    it('should call next with no user if no token provided', async () => {
      await authMiddleware.optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with user data if valid token provided', async () => {
      mockReq.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockImplementation(() => ({ id: 1 }));
      User.findByPk.mockResolvedValue(mockUser);

      await authMiddleware.optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.userId).toBe(mockUser.id);
      expect(mockReq.userEmail).toBe(mockUser.email);
      expect(mockReq.userRole).toBe(mockUser.role);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with no user if token verification fails', async () => {
      mockReq.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await authMiddleware.optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeNull();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('verifyRegistrationComplete', () => {
    it('should call next if user is registered', async () => {
      mockReq.userId = 1;
      User.findByPk.mockResolvedValue({ isRegistered: true });

      await authMiddleware.verifyRegistrationComplete(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user is not registered', async () => {
      mockReq.userId = 1;
      User.findByPk.mockResolvedValue({ isRegistered: false });

      await authMiddleware.verifyRegistrationComplete(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Please complete your registration before accessing this resource' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not found', async () => {
      mockReq.userId = 1;
      User.findByPk.mockResolvedValue(null);

      await authMiddleware.verifyRegistrationComplete(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Please complete your registration before accessing this resource' 
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});