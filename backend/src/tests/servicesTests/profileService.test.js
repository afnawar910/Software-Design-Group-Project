const profileService = require('../../services/profileService');
const authService = require('../../services/authService');
const { Profile, User, State } = require('../../../models');

jest.mock('../../services/authService');
jest.mock('../../../models', () => ({
  Profile: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findByPk: jest.fn()
  },
  State: {
    findAll: jest.fn()
  }
}));

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormOptions', () => {
    it('should return form options with states and skills', async () => {
      const mockStates = [
        { code: 'NY', name: 'New York' },
        { code: 'CA', name: 'California' }
      ];

      State.findAll.mockResolvedValue(mockStates.map(state => ({
        code: state.code,
        name: state.name,
        toJSON: () => state
      })));

      const options = await profileService.getFormOptions();

      expect(State.findAll).toHaveBeenCalledWith({
        order: [['name', 'ASC']]
      });
      expect(options.states).toEqual(mockStates);
      expect(options.skills).toEqual(expect.arrayContaining([
        expect.objectContaining({ value: 'Animal Care' }),
        expect.objectContaining({ value: 'Dog Walking' })
      ]));
    });

    it('should handle database errors', async () => {
      State.findAll.mockRejectedValue(new Error('Database error'));

      await expect(profileService.getFormOptions()).rejects.toThrow('Database error');
    });
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'volunteer'
    };

    const mockProfile = {
      id: 1,
      userId: 1,
      fullName: 'Test User',
      address1: '123 Test St',
      address2: 'Apt 4',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      skills: ['Skill 1'],
      preferences: 'Test preferences',
      availability: [new Date('2024-01-01')],
      User: mockUser,
      toJSON: function() { return this; }
    };

    it('should return full profile for volunteer user', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(mockProfile);

      const result = await profileService.getProfile(1);

      expect(result).toEqual({
        fullName: mockProfile.fullName,
        email: mockUser.email,
        role: mockUser.role,
        address1: mockProfile.address1,
        address2: mockProfile.address2,
        city: mockProfile.city,
        state: mockProfile.state,
        zipCode: mockProfile.zipCode,
        skills: mockProfile.skills,
        preferences: mockProfile.preferences,
        availability: mockProfile.availability
      });
    });

    it('should return limited profile for admin user', async () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const adminProfile = { ...mockProfile, User: adminUser };
      
      User.findByPk.mockResolvedValue(adminUser);
      Profile.findOne.mockResolvedValue(adminProfile);

      const result = await profileService.getProfile(1);

      expect(result).toEqual({
        fullName: mockProfile.fullName,
        email: adminUser.email,
        role: adminUser.role
      });
      expect(result).not.toHaveProperty('address1');
      expect(result).not.toHaveProperty('skills');
    });

    it('should return null if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const result = await profileService.getProfile(999);

      expect(result).toBeNull();
    });

    it('should return null if profile not found', async () => {
      User.findByPk.mockResolvedValue(mockUser);
      Profile.findOne.mockResolvedValue(null);

      const result = await profileService.getProfile(1);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await expect(profileService.getProfile(1)).rejects.toThrow('Database error');
    });
  });

  describe('createProfile', () => {
    const mockProfileData = {
      fullName: 'New User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      skills: ['Skill 1'],
      availability: ['2024-01-01']
    };

    it('should create a new profile successfully', async () => {
      const createdProfile = {
        ...mockProfileData,
        id: 1,
        userId: 1,
        availability: [new Date('2024-01-01')],
        toJSON: function() {
          return {
            ...this,
            availability: this.availability.map(date => date.toISOString())
          };
        }
      };

      Profile.findOne.mockResolvedValue(null);
      Profile.create.mockResolvedValue(createdProfile);

      const result = await profileService.createProfile(1, mockProfileData);

      expect(result.status).toBe(201);
      expect(result.message).toBe('Profile created successfully');
      expect(result.profile.id).toBe(1);
      expect(result.profile.userId).toBe(1);
      expect(new Date(result.profile.availability[0]).toISOString()).toBe(new Date('2024-01-01T00:00:00.000Z').toISOString());
      expect(result.profile.skills).toEqual(['Skill 1']);
    });

    it('should return error if profile already exists', async () => {
      Profile.findOne.mockResolvedValue({ id: 1 });

      const result = await profileService.createProfile(1, mockProfileData);

      expect(result.status).toBe(400);
      expect(result.message).toBe('Profile already exists');
    });

    it('should handle database errors', async () => {
      Profile.findOne.mockRejectedValue(new Error('Database error'));

      const result = await profileService.createProfile(1, mockProfileData);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error creating profile');
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateProfile', () => {
    const mockProfile = {
      id: 1,
      userId: 1,
      skills: ['Old Skill'],
      preferences: 'Old preferences',
      availability: [new Date('2024-01-01')],
      toJSON: function() {
        return {
          ...this,
          availability: this.availability.map(date => date.toISOString())
        };
      }
    };

    const updateData = {
      skills: ['New Skill'],
      preferences: 'New preferences',
      availability: ['2024-02-01']
    };

    it('should update profile successfully', async () => {
      const updatedProfile = {
        ...mockProfile,
        skills: updateData.skills,
        preferences: updateData.preferences,
        availability: [new Date(updateData.availability[0])],
        update: jest.fn().mockImplementation(function(data) {
          Object.assign(this, data);
          return this;
        }),
        toJSON: function() {
          return {
            ...this,
            availability: this.availability.map(date => date.toISOString())
          };
        }
      };

      Profile.findOne.mockResolvedValue(updatedProfile);

      const result = await profileService.updateProfile(1, updateData);

      expect(result.status).toBe(200);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.profile.skills).toEqual(['New Skill']);
      expect(result.profile.preferences).toBe('New preferences');
      expect(result.profile.availability[0]).toBe('2024-02-01T00:00:00.000Z');
    });

    it('should return error if profile not found', async () => {
      Profile.findOne.mockResolvedValue(null);

      const result = await profileService.updateProfile(1, updateData);

      expect(result.status).toBe(404);
      expect(result.message).toBe('Profile not found');
    });

    it('should handle database errors', async () => {
      Profile.findOne.mockRejectedValue(new Error('Database error'));

      const result = await profileService.updateProfile(1, updateData);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error updating profile');
      expect(result.error).toBe('Database error');
    });
  });


  describe('finalizeRegistration', () => {
    const mockProfileData = {
      fullName: 'New User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      skills: ['Skill 1'],
      availability: ['2024-01-01']
    };

    it('should finalize registration successfully', async () => {
      const mockTempUser = { 
        id: 1, 
        email: 'test@example.com' 
      };
      
      const createdProfile = {
        ...mockProfileData,
        id: 1,
        userId: mockTempUser.id,
        availability: [new Date('2024-01-01')],
        toJSON: function() {
          return {
            ...this,
            availability: this.availability.map(date => date.toISOString())
          };
        }
      };

      authService.verifyTemporaryUserByToken.mockResolvedValue(mockTempUser);
      Profile.create.mockResolvedValue(createdProfile);
      Profile.findOne.mockResolvedValue(null); 
      authService.finalizeRegistration.mockResolvedValue({
        status: 200,
        message: 'Registration finalized'
      });

      const result = await profileService.finalizeRegistration('validToken', mockProfileData);

      expect(result.status).toBe(201);
      expect(result.message).toBe('Registration finalized and profile created successfully');
      expect(result.profile.userId).toBe(mockTempUser.id);
      expect(result.profile.fullName).toBe(mockProfileData.fullName);
      expect(new Date(result.profile.availability[0]).toISOString()).toBe(new Date('2024-01-01T00:00:00.000Z').toISOString());
    });

    it('should return error for invalid token', async () => {
      authService.verifyTemporaryUserByToken.mockResolvedValue(null);

      const result = await profileService.finalizeRegistration('invalidToken', mockProfileData);

      expect(result.status).toBe(400);
      expect(result.message).toBe('Invalid or expired registration attempt');
    });

    it('should validate profile data', async () => {
      authService.verifyTemporaryUserByToken.mockResolvedValue({ id: 1 });

      const result = await profileService.finalizeRegistration('validToken', {});

      expect(result.status).toBe(400);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toHaveProperty('fullName');
      expect(result.errors).toHaveProperty('address1');
    });

    it('should handle auth service errors', async () => {
      authService.verifyTemporaryUserByToken.mockRejectedValue(new Error('Auth error'));

      const result = await profileService.finalizeRegistration('validToken', mockProfileData);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Error finalizing registration');
    });
  });

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      const mockProfiles = [
        { id: 1, fullName: 'User 1' },
        { id: 2, fullName: 'User 2' }
      ];
      Profile.findAll.mockResolvedValue(mockProfiles);

      const result = await profileService.getAllProfiles();

      expect(result).toEqual(mockProfiles);
      expect(Profile.findAll).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      Profile.findAll.mockRejectedValue(new Error('Database error'));

      const result = await profileService.getAllProfiles();

      expect(result).toEqual([]);
    });
  });
});