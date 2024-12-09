const matchingService = require('../services/matchingService');
const historyService = require('../services/historyService');

exports.getMatchingVolunteers = async (req, res) => {
    try {
        const { eventId } = req.params;
        const matchedVolunteers = await matchingService.matchVolunteersToEvent(eventId);
        res.status(200).json(matchedVolunteers); 
    } catch (error) {
        console.error('Error matching volunteer:', error);
        res.status(error.status || 500).json({
            message: error.message || 'Error finding matching volunteers.'
        });
    }
};

exports.getFutureEvents = async (req, res) => {
    try {
        const futureEvents = await matchingService.getFutureEvents(); 
        res.status(200).json(futureEvents);
    } catch (error) {
        console.error('Error fetching future events:', error);
        res.status(500).json({ 
            message: 'Error fetching future events' 
        });
    }
};

exports.matchVolunteerToEvent = async (req, res) => {
    try {
        const { volunteerId, eventId } = req.body;
        
        if (!volunteerId || !eventId) {
            return res.status(400).json({ message: 'Volunteer ID and Event ID are required' });
        }
        
        await historyService.initializeHistory(volunteerId, eventId);

        const result = await historyService.updateVolunteerEventStatus(
            volunteerId, 
            eventId, 
            'Matched - Pending Attendance'
        );
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error matching volunteer to event:', error);
        const status = error.status || 500;
        const message = status === 500 ? 
            'Error matching volunteer to event' : 
            error.message;
            
        res.status(status).json({ message });
    }
};