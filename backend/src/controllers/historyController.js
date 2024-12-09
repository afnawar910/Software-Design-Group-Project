const historyService = require('../services/historyService');

exports.getAllHistory = (req, res) => {
	console.log('Controller: Fetching all history records');
	const allHistory = historyService.getAllHistory();
	res.status(200).json(allHistory);
};

exports.getHistory = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log('Controller: Fetching history for userId:', userId);

        const history = await historyService.getHistory(userId);
        
        const formattedHistory = history.map(record => ({
            id: record.id,
            eventName: record.Event.eventName,
            eventDescription: record.Event.eventDescription,
            location: `${record.Event.address}, ${record.Event.city}, ${record.Event.state} ${record.Event.zipCode}`,
            requiredSkills: record.Event.requiredSkills,
            urgency: record.Event.urgency,
            eventDate: record.Event.eventDate,
            startTime: record.Event.startTime,
            endTime: record.Event.endTime,
            participationStatus: record.participationStatus
        }));

        res.status(200).json(formattedHistory);
    } catch (error) {
        console.error('Error in getHistory controller:', error);
        res.status(500).json({
            message: 'Error fetching volunteer history',
            error: error.message
        });
    }
};

exports.updateHistoryRecord = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
  
    try {
      if (!req.userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }
  
      if (req.userRole !== 'admin' && updateData.participationStatus !== undefined) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admins can update participation status' 
        });
      }    
  
      const result = await historyService.updateHistoryRecord(id, updateData);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Failed to update record'
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Record updated successfully',
        record: result.record
      });
  
    } catch (error) {
      console.error('Error in updateHistoryRecord:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during update'
      });
    }
  };

exports.updateVolunteerEventStatus = async (req, res) => {
	try {
		const { volunteerId, eventId } = req.body;
		if (!volunteerId || !eventId) {
			return res.status(400).json({ message: 'Volunteer ID and Event ID are required' });
		}

		const result = await historyService.updateVolunteerEventStatus(volunteerId, eventId, 'Matched - Pending Attendance');
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ message: 'Error updating volunteer status' });
	}
};