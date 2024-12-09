const eventService = require('../services/eventService');

exports.createEvent = async (req, res) => {
  try {
      console.log('Request headers:', req.headers);
      console.log('User details:', {
          userId: req.userId,
          userEmail: req.userEmail,
          userRole: req.userRole
      });
      console.log('Request body:', req.body);

      if (!req.userId) {
          return res.status(400).json({
              errors: [{
                  field: 'createdBy',
                  message: 'User ID is missing'
              }]
          });
      }

      const result = await eventService.createEvent(req.body, req.userId);
      res.status(201).json(result);
  } catch (error) {
      console.error('Error in createEvent controller:', error);
      if (error.status === 400) {
          res.status(400).json({ errors: error.errors || 'Bad request' });
      } else {
          res.status(500).json({ message: 'Internal server error', error: error.message });
      }
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await eventService.getAllEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    console.log('Fetching event with ID:', req.params.id);
    const event = await eventService.getEventById(req.params.id);
    res.status(200).json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    if (error.status === 404) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
};

exports.getFormOptions = async (req, res) => {
  try {
    const options = await eventService.getFormOptions();
    res.status(200).json(options);
  } catch (error) {
    console.error('Error fetching form options:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};