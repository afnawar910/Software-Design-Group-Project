const express = require('express');
const router = express.Router();
const { validateProfileUpdate, validateRegistrationToken } = require('../utils/validators');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// Get form options - no auth required
router.get('/form-options', profileController.getFormOptions);

// Get user profile - auth required
router.get('/', authMiddleware.verifyToken, profileController.getProfile);

// Public route for completing registration with validation
router.post('/finalize-registration', 
    validateRegistrationToken,
    validateProfileUpdate,
    profileController.finalizeRegistration
);

// Protected routes with validation
router.put('/',
    authMiddleware.verifyToken,
    profileController.updateProfile
);

module.exports = router;