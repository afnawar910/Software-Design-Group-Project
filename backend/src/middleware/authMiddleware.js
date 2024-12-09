const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const authMiddleware = {
	verifyToken: async (req, res, next) => {
		try {
			const authHeader = req.headers['authorization'];
			if (!authHeader) {
				return res.status(403).json({ message: 'No token provided' });
			}

			const token = authHeader.split(' ')[1];
			if (!token) {
				return res.status(403).json({ message: 'Malformed token' });
			}

			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				const user = await User.findOne({
					where: {
						id: decoded.id,
						isRegistered: true
					}
				});

				if (!user) {
					return res.status(401).json({
						message: 'User not found or registration incomplete'
					});
				}

				req.userId = user.id;
				req.userEmail = user.email;
				req.userRole = user.role;

				next();
			} catch (err) {
				if (err.name === 'TokenExpiredError') {
					return res.status(401).json({ message: 'Token has expired' });
				}
				if (err.name === 'JsonWebTokenError') {
					return res.status(401).json({ message: 'Invalid token' });
				}
				throw err;
			}
		} catch (error) {
			console.error('Error in verifyToken middleware:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	},

	verifyAdmin: async (req, res, next) => {
		try {
			if (!req.userRole) {
				return res.status(401).json({ message: 'Authentication required' });
			}

			if (req.userRole !== 'admin') {
				return res.status(403).json({
					message: 'Access forbidden: Admin privileges required'
				});
			}

			next();
		} catch (error) {
			console.error('Error in verifyAdmin middleware:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	},

	verifyVolunteer: async (req, res, next) => {
		try {
			if (!req.userRole) {
				return res.status(401).json({ message: 'Authentication required' });
			}

			if (req.userRole !== 'volunteer') {
				return res.status(403).json({
					message: 'Access forbidden: Volunteer privileges required'
				});
			}

			next();
		} catch (error) {
			console.error('Error in verifyVolunteer middleware:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	},

	// Optional verification that allows both registered and unregistered users
	optionalAuth: async (req, res, next) => {
		try {
			const authHeader = req.headers['authorization'];
			if (!authHeader) {
				// No token provided, but that's okay
				req.user = null;
				return next();
			}

			const token = authHeader.split(' ')[1];
			if (!token) {
				req.user = null;
				return next();
			}

			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				const user = await User.findByPk(decoded.id);

				if (user) {
					req.userId = user.id;
					req.userEmail = user.email;
					req.userRole = user.role;
				}

				next();
			} catch (err) {
				// Token verification failed, but that's okay for optional auth
				req.user = null;
				next();
			}
		} catch (error) {
			console.error('Error in optionalAuth middleware:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	},

	verifyRegistrationComplete: async (req, res, next) => {
		try {
			const user = await User.findByPk(req.userId);

			if (!user || !user.isRegistered) {
				return res.status(403).json({
					message: 'Please complete your registration before accessing this resource'
				});
			}

			next();
		} catch (error) {
			console.error('Error in verifyRegistrationComplete middleware:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}
};

module.exports = authMiddleware;