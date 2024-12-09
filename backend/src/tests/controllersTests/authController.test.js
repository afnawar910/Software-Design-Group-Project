const authController = require('../../controllers/authController');
const authService = require('../../services/authService');

const mockRequest = (body = {}) => ({
    body
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

jest.mock('../../services/authService');

describe('AuthController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return 201 and token when registration is successful', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123', role: 'volunteer' });
            const res = mockResponse();

            authService.registerUser.mockResolvedValue({
                status: 201,
                message: 'User registered successfully',
                token: 'test-token',
                needsProfile: true
            });

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User registered successfully',
                token: 'test-token',
                needsProfile: true
            });
        });

        it('should return 400 when email or password is missing', async () => {
            const req = mockRequest({ email: '', password: '' });
            const res = mockResponse();

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
        });

        it('should return 500 when an error occurs', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();

            authService.registerUser.mockRejectedValue(new Error('Registration failed'));

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });

        it('should return the correct error status and message from the service', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();

            authService.registerUser.mockResolvedValue({
                status: 409,
                message: 'User already exists'
            });

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        });
    });

    describe('login', () => {
        it('should return 200 and token when login is successful', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();

            authService.loginUser.mockResolvedValue({
                status: 200,
                token: 'test-token',
                role: 'volunteer'
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: 'test-token',
                role: 'volunteer'
            });
        });

        it('should return 500 when an error occurs', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();

            authService.loginUser.mockRejectedValue(new Error('Login failed'));

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });

        it('should return the correct error status and message when login fails', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'wrongpassword' });
            const res = mockResponse();

            authService.loginUser.mockResolvedValue({
                status: 401,
                message: 'Invalid credentials'
            });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });

    describe('getAllVolunteers', () => {
        it('should return 200 and a list of volunteers', async () => {
            const req = mockRequest();
            const res = mockResponse();

            const mockVolunteers = [
                { id: 1, email: 'volunteer1@example.com', fullName: 'Volunteer One' },
                { id: 2, email: 'volunteer2@example.com', fullName: 'Volunteer Two' }
            ];

            authService.getAllVolunteers.mockResolvedValue(mockVolunteers);

            await authController.getAllVolunteers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockVolunteers);
        });

        it('should return 500 if there is an error fetching volunteers', async () => {
            const req = mockRequest();
            const res = mockResponse();

            authService.getAllVolunteers.mockRejectedValue(new Error('Error fetching volunteers'));

            await authController.getAllVolunteers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Error fetching volunteers'
            });
        });
    });

    describe('getRegisteredVolunteers', () => {
        it('should return 200 and a list of registered volunteers', async () => {
            const req = mockRequest();
            const res = mockResponse();

            const mockRegisteredVolunteers = [
                { id: 1, email: 'registered1@example.com', fullName: 'Registered One' },
                { id: 2, email: 'registered2@example.com', fullName: 'Registered Two' }
            ];

            authService.getRegisteredVolunteers.mockResolvedValue(mockRegisteredVolunteers);

            await authController.getRegisteredVolunteers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRegisteredVolunteers);
        });

        it('should return 500 if there is an error fetching registered volunteers', async () => {
            const req = mockRequest();
            const res = mockResponse();

            authService.getRegisteredVolunteers.mockRejectedValue(new Error('Error fetching registered volunteers'));

            await authController.getRegisteredVolunteers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Error fetching registered volunteers'
            });
        });
    });
});