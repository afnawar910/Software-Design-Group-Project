const authService = require('../services/authService');

exports.register = async (req, res) => {
	try {
		const { email, password, role } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		const response = await authService.registerUser(email, password, role);

		if (response.status === 201) {
			return res.status(201).json({
				message: response.message,
				token: response.token,
				needsProfile: response.needsProfile
			});
		} else {
			return res.status(response.status).json({
				message: response.message
			});
		}
	} catch (error) {
		console.error('Error in register controller:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const response = await authService.loginUser(email, password);
		if (response.status === 200) {
			return res.status(200).json({
				token: response.token,
				role: response.role
			});
		} else {
			return res.status(response.status).json({
				message: response.message
			});
		}
	} catch (error) {
		console.error('Error in login controller:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
};

exports.getAllVolunteers = async (req, res) => {
	try {
		const volunteers = await authService.getAllVolunteers();
		return res.status(200).json(volunteers);
	} catch (error) {
		console.error('Error in getAllVolunteers:', error);
		return res.status(500).json({
			message: 'Error fetching volunteers'
		});
	}
};

exports.getRegisteredVolunteers = async (req, res) => {
	try {
		const volunteers = await authService.getRegisteredVolunteers();
		return res.status(200).json(volunteers);
	} catch (error) {
		console.error('Error in getRegisteredVolunteers:', error);
		return res.status(500).json({
			message: 'Error fetching registered volunteers'
		});
	}
};