const profileService = require('../services/profileService');

exports.getFormOptions = async (req, res) => {
    try {
        const formOptions = await profileService.getFormOptions();
        console.log('Retrieved form options from service');
        res.status(200).json(formOptions);
    } catch (error) {
        console.error('Error getting form options:', error);
        res.status(500).json({ 
            message: 'Failed to load form options',
            error: error.message 
        });
    }
};

exports.finalizeRegistration = async (req, res) => {
    try {
        const { token, ...profileData } = req.body;
        console.log('Received finalize registration request:', { token, profileData });
        const result = await profileService.finalizeRegistration(token, profileData);
        res.status(result.status).json(result);
    } catch (error) {
        console.error('Error in finalizeRegistration:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        console.log('Update profile request for user:', req.userId);
        console.log('Update data received:', req.body);

        const allowedData = {
            skills: req.body.skills,
            preferences: req.body.preferences,
            availability: req.body.availability
        };

        const result = await profileService.updateProfile(req.userId, allowedData);
        
        if (result.status === 200) {
            console.log('Profile updated successfully');
            res.status(200).json(result);
        } else {
            console.log('Profile update failed:', result.message);
            res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error in updateProfile controller:', error);
        res.status(500).json({ 
            message: 'Failed to update profile',
            error: error.message 
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        console.log('Getting profile for user:', req.userId);
        const profile = await profileService.getProfile(req.userId);
        
        if (!profile) {
            console.log('No profile found for user:', req.userId);
            return res.status(404).json({ 
                message: 'Profile not found' 
            });
        }

        console.log('Profile found:', profile);
        res.status(200).json(profile);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};