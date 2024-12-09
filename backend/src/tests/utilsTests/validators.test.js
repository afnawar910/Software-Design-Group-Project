const { 
    validateRegistration, 
    validateLogin, 
    validateProfileUpdate,
    validateRegistrationToken 
  } = require('../../utils/validators');
  const request = require('supertest');
  const express = require('express');
  
  const app = express();
  app.use(express.json());
  
  app.post('/register', validateRegistration, (req, res) => {
    res.status(200).json({ message: 'Registration successful' });
  });
  
  app.post('/login', validateLogin, (req, res) => {
    res.status(200).json({ message: 'Login successful' });
  });
  
  app.post('/profile', validateProfileUpdate, (req, res) => {
    res.status(200).json({ message: 'Profile updated successfully' });
  });
  
  app.post('/verify-token', validateRegistrationToken, (req, res) => {
    res.status(200).json({ message: 'Token verified successfully' });
  });
  
  describe('Validator Tests', () => {
    describe('Registration Validator', () => {
      const validRegistration = {
        email: 'test@example.com',
        password: 'ValidPass1',
        role: 'volunteer'
      };
  
      it('should succeed with valid registration data', async () => {
        const res = await request(app)
          .post('/register')
          .send(validRegistration);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Registration successful');
      });
  
      describe('Email Validation', () => {
        it('should return error if email is missing', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, email: '' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Email is required');
        });
  
        it('should return error if email is invalid', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, email: 'invalid-email' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Must be a valid email address');
        });
      });
  
      describe('Password Validation', () => {
        it('should return error if password is missing', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, password: '' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Password is required');
        });
  
        it('should return error if password is less than 8 characters', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, password: 'Short1' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Password must be at least 8 characters long');
        });
  
        it('should return error if password lacks uppercase letter', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, password: 'lowercase1' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Password must contain at least one uppercase letter');
        });
  
        it('should return error if password lacks lowercase letter', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, password: 'UPPERCASE1' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Password must contain at least one lowercase letter');
        });
  
        it('should return error if password lacks number', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, password: 'NoNumberPass' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Password must contain at least one number');
        });
      });
  
      describe('Role Validation', () => {
        it('should accept valid admin role', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, role: 'admin' });
  
          expect(res.statusCode).toBe(200);
        });
  
        it('should accept valid volunteer role', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, role: 'volunteer' });
  
          expect(res.statusCode).toBe(200);
        });
  
        it('should return error for invalid role', async () => {
          const res = await request(app)
            .post('/register')
            .send({ ...validRegistration, role: 'invalid' });
  
          expect(res.statusCode).toBe(400);
          expect(res.body.errors[0].msg).toBe('Role must be either admin or volunteer');
        });
      });
    });
  
    describe('Login Validator', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'ValidPass1'
      };
  
      it('should succeed with valid login data', async () => {
        const res = await request(app)
          .post('/login')
          .send(validLogin);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login successful');
      });
  
      it('should return error if email is missing', async () => {
        const res = await request(app)
          .post('/login')
          .send({ ...validLogin, email: '' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].msg).toBe('Email is required');
      });
  
      it('should return error if email is invalid', async () => {
        const res = await request(app)
          .post('/login')
          .send({ ...validLogin, email: 'invalid-email' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].msg).toBe('Must be a valid email address');
      });
  
      it('should return error if password is missing', async () => {
        const res = await request(app)
          .post('/login')
          .send({ ...validLogin, password: '' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].msg).toBe('Password is required');
      });
    });
  
    describe('Profile Update Validator', () => {
      const validProfile = {
        skills: ['JavaScript', 'Node.js'],
        preferences: 'Remote work',
        availability: ['2024-12-01', '2024-12-02']
      };
  
      it('should succeed with valid profile data', async () => {
        const res = await request(app)
          .post('/profile')
          .send(validProfile);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Profile updated successfully');
      });
  
      it('should return error if skills is not an array', async () => {
        const res = await request(app)
          .post('/profile')
          .send({ ...validProfile, skills: 'JavaScript' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('Skills must be an array of strings');
      });
  
      it('should return error if preferences is not a string', async () => {
        const res = await request(app)
          .post('/profile')
          .send({ ...validProfile, preferences: ['Remote'] });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('Preferences must be a string');
      });
  
      it('should return error if availability is not an array', async () => {
        const res = await request(app)
          .post('/profile')
          .send({ ...validProfile, availability: 'Monday' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('Availability must be an array of dates');
      });
  
      it('should return error if availability dates are invalid', async () => {
        const res = await request(app)
          .post('/profile')
          .send({ ...validProfile, availability: ['invalid-date'] });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('All availability dates must be valid dates');
      });
    });
  
    describe('Registration Token Validator', () => {
      it('should succeed with valid token', async () => {
        const res = await request(app)
          .post('/verify-token')
          .send({ token: '0123456789012345678901234567890123456789' });
  
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Token verified successfully');
      });
  
      it('should return error if token is missing', async () => {
        const res = await request(app)
          .post('/verify-token')
          .send({ token: '' });
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].msg).toBe('Registration token is required');
      });
  
      it('should return error if token length is invalid', async () => {
        const res = await request(app)
          .post('/verify-token')
          .send({ token: '123456' }); 
  
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].msg).toBe('Invalid token format');
      });
    });
  });