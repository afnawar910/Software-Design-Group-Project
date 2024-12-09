const profileController = require('../../controllers/profileController');
const profileService = require('../../services/profileService');

jest.mock('../../services/profileService');

describe('Profile Controller', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      body: {},
      userId: null
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getFormOptions', () => {
    const mockOptions = {
      states: [
        { code: 'NY', name: 'New York' },
        { code: 'CA', name: 'California' }
      ],
      skills: [
        { value: 'Skill 1', label: 'Skill 1' },
        { value: 'Skill 2', label: 'Skill 2' }
      ]
    };

    it('should return form options successfully', async () => {
      profileService.getFormOptions.mockResolvedValue(mockOptions);

      await profileController.getFormOptions(mockRequest, mockResponse);

      expect(profileService.getFormOptions).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOptions);
    });

    it('should handle errors with proper error message', async () => {
      const error = new Error('Test error');
      profileService.getFormOptions.mockRejectedValue(error);

      await profileController.getFormOptions(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Failed to load form options',
        error: error.message 
      });
    });
  });

  describe('finalizeRegistration', () => {
    const mockProfileData = {
      fullName: 'Test User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      skills: ['Skill 1'],
      availability: ['2024-01-01']
    };

    it('should finalize registration successfully', async () => {
      const token = 'validToken';
      mockRequest.body = { token, ...mockProfileData };
      
      const mockResult = { 
        status: 201, 
        message: 'Registration finalized and profile created successfully',
        profile: { ...mockProfileData, id: 1 }
      };
      profileService.finalizeRegistration.mockResolvedValue(mockResult);

      await profileController.finalizeRegistration(mockRequest, mockResponse);

      expect(profileService.finalizeRegistration).toHaveBeenCalledWith(token, mockProfileData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { token: 'validToken', ...mockProfileData };
      const mockResult = { 
        status: 400, 
        message: 'Validation failed',
        errors: { fullName: 'Full Name is required' }
      };
      profileService.finalizeRegistration.mockResolvedValue(mockResult);

      await profileController.finalizeRegistration(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle internal server errors', async () => {
      mockRequest.body = { token: 'validToken', ...mockProfileData };
      const error = new Error('Test error');
      profileService.finalizeRegistration.mockRejectedValue(error);

      await profileController.finalizeRegistration(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Internal server error',
        error: error.message 
      });
    });
  });

  describe('updateProfile', () => {
    const mockUpdateData = {
      skills: ['New Skill'],
      preferences: 'New preferences',
      availability: ['2024-01-01'],
      fullName: 'Should Not Update'  
    };

    it('should update profile successfully with allowed fields only', async () => {
      mockRequest.userId = 1;
      mockRequest.body = mockUpdateData;
      
      const mockResult = { 
        status: 200, 
        message: 'Profile updated successfully',
        profile: {
          skills: mockUpdateData.skills,
          preferences: mockUpdateData.preferences,
          availability: mockUpdateData.availability
        }
      };
      profileService.updateProfile.mockResolvedValue(mockResult);

      await profileController.updateProfile(mockRequest, mockResponse);

      expect(profileService.updateProfile).toHaveBeenCalledWith(1, {
        skills: mockUpdateData.skills,
        preferences: mockUpdateData.preferences,
        availability: mockUpdateData.availability
      });
      expect(profileService.updateProfile).not.toHaveBeenCalledWith(
        expect.anything(), 
        expect.objectContaining({ fullName: expect.anything() })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle profile not found', async () => {
      mockRequest.userId = 1;
      mockRequest.body = mockUpdateData;
      const mockResult = { status: 404, message: 'Profile not found' };
      profileService.updateProfile.mockResolvedValue(mockResult);

      await profileController.updateProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Profile not found' });
    });

    it('should handle service errors', async () => {
      mockRequest.userId = 1;
      mockRequest.body = mockUpdateData;
      const error = new Error('Test error');
      profileService.updateProfile.mockRejectedValue(error);

      await profileController.updateProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Failed to update profile',
        error: error.message
      });
    });
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: 1,
      fullName: 'Test User',
      skills: ['Skill 1'],
      preferences: 'Test preferences',
      availability: ['2024-01-01']
    };

    it('should return profile successfully', async () => {
      mockRequest.userId = 1;
      profileService.getProfile.mockResolvedValue(mockProfile);

      await profileController.getProfile(mockRequest, mockResponse);

      expect(profileService.getProfile).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProfile);
    });

    it('should return 404 when profile not found', async () => {
      mockRequest.userId = 1;
      profileService.getProfile.mockResolvedValue(null);

      await profileController.getProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Profile not found' 
      });
    });

    it('should handle service errors', async () => {
      mockRequest.userId = 1;
      const error = new Error('Test error');
      profileService.getProfile.mockRejectedValue(error);

      await profileController.getProfile(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Internal server error',
        error: error.message 
      });
    });
  });
});