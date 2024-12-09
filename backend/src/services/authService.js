const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../models');
const { Op } = require('sequelize');

const authService = {
	registerUser: async (email, password, role) => {
		try {
			const userExists = await User.findOne({ where: { email } });
			if (userExists) {
				return { status: 400, message: 'User already exists' };
			}

			const token = crypto.randomBytes(20).toString('hex');
			const tokenExpiresAt = new Date();
			tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 10); 

			const newUser = await User.create({
				email,
				password, // Password = hashed by model hooks
				role: role || 'volunteer',
				registrationToken: token,
				tokenExpiresAt,
				isRegistered: false
			});

			if (!newUser) {
				return { status: 500, message: 'Error creating temporary user' };
			}

			return {
				status: 201,
				message: 'Temporary user created. Please complete your profile.',
				token: token, 
				needsProfile: true
			};
		} catch (error) {
			console.error('Error in registerUser:', error);
			return { status: 500, message: 'Error creating user' };
		}
	},

	verifyTemporaryUserByToken: async (token) => {
		try {
			const tempUser = await User.findOne({
				where: {
					registrationToken: token,
					tokenExpiresAt: { [Op.gt]: new Date() }, 
					isRegistered: false
				}
			});

			if (!tempUser) {
				console.log('No temporary user found for token or token expired');
				return null;
			}

			return tempUser;
		} catch (error) {
			console.error('Error verifying temporary user:', error);
			return null;
		}
	},

	finalizeRegistration: async (userId, profileData) => {
		try {
			const user = await User.findOne({
				where: {
					id: userId,
					isRegistered: false 
				}
			});

			if (!user) {
				return { status: 404, message: 'Temporary user not found' };
			}

			if (user.tokenExpiresAt < new Date()) {
				return { status: 400, message: 'Registration token has expired' };
			}

			await user.update({
				isRegistered: true,
				registrationToken: null,
				tokenExpiresAt: null
			});

			return {
				status: 200,
				message: 'Registration finalized successfully',
				userId: user.id
			};
		} catch (error) {
			console.error('Error finalizing registration:', error);
			return { status: 500, message: 'Error finalizing registration' };
		}
	},

	loginUser: async (email, password) => {
		try {
			console.log('Attempting login for email:', email);

			const user = await User.findOne({ where: { email } });
			if (!user) {
				console.log('User not found for email:', email);
				return { status: 404, message: 'User not found' };
			}

			if (!user.isRegistered) {
				console.log('User has not completed registration:', email);
				return { status: 401, message: 'Error: Registration not complete. Try registering again in 10 minutes.' };
			}

			const validPassword = await user.validatePassword(password);
			if (!validPassword) {
				console.log('Invalid password for email:', email);
				return { status: 401, message: 'Invalid credentials' };
			}

			const token = jwt.sign(
				{ id: user.id, email: user.email, role: user.role },
				process.env.JWT_SECRET,
				{ expiresIn: '1h' }
			);

			console.log('Login successful for email:', email);
			return { status: 200, token, role: user.role };
		} catch (error) {
			console.error('Error in loginUser:', error);
			return { status: 500, message: 'Error during login' };
		}
	},

	getAllVolunteers: async () => {
		try {
			return await User.findAll({
				where: {
					role: 'volunteer',
					isRegistered: true
				},
				attributes: ['id', 'email']
			});
		} catch (error) {
			console.error('Error getting all volunteers:', error);
			return [];
		}
	},

	getRegisteredVolunteers: async () => {
		try {
			return await User.findAll({
				where: {
					role: 'volunteer',
					isRegistered: true
				},
				attributes: ['id', 'email']
			});
		} catch (error) {
			console.error('Error getting registered volunteers:', error);
			return [];
		}
	},
	
	// Delete users where token is expired and registration is not complete
	cleanupTemporaryUsers: async () => {
		try {
			const result = await User.destroy({
				where: {
					isRegistered: false,
					tokenExpiresAt: {
						[Op.lt]: new Date()
					}
				}
			});
			
			if (result > 0) {
				console.log(`Cleaned up ${result} expired temporary users`);
			}
		} catch (error) {
			console.error('Error in cleanup task:', error);
		}
	}
};

module.exports = authService;