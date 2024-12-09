const { body, validationResult } = require('express-validator');

exports.validateRegistration = [
	body('email')
		.trim()
		.notEmpty().withMessage('Email is required')
		.isEmail().withMessage('Must be a valid email address')
		.normalizeEmail(),

	body('password')
		.trim()
		.notEmpty().withMessage('Password is required')
		.isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
		.matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
		.matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
		.matches(/[0-9]/).withMessage('Password must contain at least one number'),

	body('role')
		.optional()
		.isIn(['admin', 'volunteer']).withMessage('Role must be either admin or volunteer'),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Validation error',
				errors: errors.array()
			});
		}
		next();
	}
];

exports.validateLogin = [
	body('email')
		.trim()
		.notEmpty().withMessage('Email is required')
		.isEmail().withMessage('Must be a valid email address')
		.normalizeEmail(),

	body('password')
		.trim()
		.notEmpty().withMessage('Password is required'),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Validation error',
				errors: errors.array()
			});
		}
		next();
	}
];

exports.validateProfileUpdate = (req, res, next) => {
    const { skills, preferences, availability } = req.body;
    const errors = [];

    if (skills !== undefined && (!Array.isArray(skills) || skills.length === 0)) {
        errors.push('Skills must be an array of strings');
    }

    if (preferences !== undefined && typeof preferences !== 'string') {
        errors.push('Preferences must be a string');
    }

    if (availability !== undefined) {
        if (!Array.isArray(availability)) {
            errors.push('Availability must be an array of dates');
        } else {
            const invalidDates = availability.filter(date => isNaN(new Date(date).getTime()));
            if (invalidDates.length > 0) {
                errors.push('All availability dates must be valid dates');
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

exports.validateRegistrationToken = [
	body('token')
		.trim()
		.notEmpty().withMessage('Registration token is required')
		.isLength({ min: 40, max: 40 }).withMessage('Invalid token format'),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				message: 'Invalid registration token',
				errors: errors.array()
			});
		}
		next();
	}
];