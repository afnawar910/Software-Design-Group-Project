const request = require('supertest');
const { app, cronManager } = require('../app');
const authService = require('../services/authService');

jest.mock('../services/authService', () => ({
    cleanupTemporaryUsers: jest.fn(),
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    getAllVolunteers: jest.fn(),
    getRegisteredVolunteers: jest.fn()
}));

describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        cronManager.destroy();
    });

    test('should return 200 OK for the root route', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Animal Volunteer System Backend');
    });

    test('should mount auth routes correctly', async () => {
        authService.registerUser.mockResolvedValueOnce({
            status: 201,
            message: 'Temporary user created. Please complete your profile.',
            token: 'mockToken',
            needsProfile: true
        });

        const validRegisterData = {
            email: 'test@example.com',
            password: 'Password123!',
            role: 'volunteer'
        };

        const registerRes = await request(app)
            .post('/api/auth/register')
            .send(validRegisterData);
            
        expect(registerRes.status).toBe(201);

        authService.loginUser.mockResolvedValueOnce({
            status: 200,
            token: 'mockToken',
            role: 'volunteer'
        });

        const validLoginData = {
            email: 'test@example.com',
            password: 'Password123!'
        };

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send(validLoginData);
            
        expect(loginRes.status).toBe(200);
    });

    test('should handle errors using error-handling middleware', async () => {
        const response = await request(app)
            .get('/non-existent-route-to-trigger-error');
        expect(response.status).toBe(404);
    });

    describe('Auth Routes', () => {
        test('should handle successful registration', async () => {
            authService.registerUser.mockResolvedValueOnce({
                status: 201,
                message: 'Temporary user created. Please complete your profile.',
                token: 'mockToken',
                needsProfile: true
            });

            const validRegistrationData = {
                email: 'newUser@example.com',
                password: 'Password123!',
                role: 'volunteer'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(validRegistrationData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Temporary user created. Please complete your profile.');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('needsProfile', true);
        });

        test('should handle registration validation failure', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123', 
                role: 'invalid-role'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        test('should handle successful login', async () => {
            authService.loginUser.mockResolvedValueOnce({
                status: 200,
                token: 'mockToken',
                role: 'volunteer'
            });

            const validLoginData = {
                email: 'test@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(validLoginData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('role', 'volunteer');
        });

        test('should handle login validation failure', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        test('should handle login authentication failure', async () => {
            authService.loginUser.mockResolvedValueOnce({
                status: 401,
                message: 'Invalid credentials'
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    describe('Protected Routes', () => {
        test('should forbid access to admin routes without authentication', async () => {
            const response = await request(app)
                .get('/api/auth/volunteers');
            
            expect(response.status).toBe(403); 
            expect(response.body).toHaveProperty('message');
        });

        test('should forbid access to registered volunteers route without authentication', async () => {
            const response = await request(app)
                .get('/api/auth/registered-volunteers');
            
            expect(response.status).toBe(403); 
            expect(response.body).toHaveProperty('message');
        });
    });
});