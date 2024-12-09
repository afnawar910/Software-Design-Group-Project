const eventService = require('../services/eventService');
const profileService = require('../services/profileService');
const { VolunteerHistory } = require('../../models');
const { Op } = require('sequelize');

const matchingService = {
    matchVolunteersToEvent: async (eventId) => {
        try {
            console.log('Attempting to match volunteers for event:', eventId);
            
            const event = await eventService.getEventById(eventId.toString());
            
            if (!event) {
                console.log('Event not found for ID:', eventId);
                throw { status: 404, message: 'Event not found' };
            }

            const existingMatches = await VolunteerHistory.findAll({
                where: {
                    eventId: event.id,
                    participationStatus: 'Matched - Pending Attendance'
                },
                attributes: ['volunteerId']
            });

            const matchedVolunteerIds = existingMatches.map(match => match.volunteerId);

            const allProfiles = await profileService.getAllProfiles();
            console.log('Total volunteer profiles found:', allProfiles.length);
            
            const matchedVolunteers = allProfiles.filter(volunteer => {
                if (matchedVolunteerIds.includes(volunteer.userId)) {
                    return false;
                }

                const isDateAvailable = volunteer.availability.some(date => {
                    const availDate = new Date(date);
                    return availDate.toISOString().split('T')[0] === event.eventDate;
                });

                const hasMatchingSkill = volunteer.skills.some(skill => 
                    event.requiredSkills.includes(skill)
                );

                const isSameCity = volunteer.city.toLowerCase() === event.city.toLowerCase();

                const isMatch = isDateAvailable && hasMatchingSkill && isSameCity;
                if (isMatch) {
                    console.log('Found matching volunteer:', volunteer.fullName);
                }

                return isMatch;
            });

            console.log('Total matching volunteers found:', matchedVolunteers.length);

            return matchedVolunteers.map(volunteer => ({
                id: volunteer.userId,
                fullName: volunteer.fullName,
                email: volunteer.email,
                skills: volunteer.skills.filter(skill => event.requiredSkills.includes(skill)),
                city: volunteer.city
            }));
        } catch (error) {
            console.error('Error in matchVolunteersToEvent:', error);
            throw error;
        }
    },

    matchVolunteerToEvent: async (eventId, volunteerIds) => {
        try {
            const event = await eventService.getEventById(eventId);

            if (!event) {
                throw { status: 404, message: 'Event not found' };
            }

            const results = [];
            for (let volunteerId of volunteerIds) {
                const volunteer = await profileService.getProfile(volunteerId);

                if (!volunteer) {
                    results.push({ volunteerId, message: 'Volunteer not found' });
                    continue;
                }

                if (!volunteer.availability.includes(event.eventDate)) {
                    results.push({ volunteerId, message: 'Volunteer is not available on the event date' });
                    continue;
                }

                if (volunteer.city !== event.city) {
                    results.push({ volunteerId, message: 'Volunteer is not in the same city as the event' });
                    continue;
                }

                if (!volunteer.skills.some(skill => event.requiredSkills.includes(skill))) {
                    results.push({ volunteerId, message: 'Volunteer does not have the required skills for this event' });
                    continue;
                }
                results.push({ volunteerId, message: `Volunteer ${volunteer.fullName} successfully matched to event ${event.eventName}` });
            }

            return results;
        } catch (error) {
            console.error('Error in matchVolunteerToEvent:', error);
            throw error;
        }
    },

    getFutureEvents: async () => {
        try {
            const allEvents = await eventService.getAllEvents();
            console.log('Total events found:', allEvents.length);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
        
            const futureEvents = allEvents.filter(event => {
                const eventDate = new Date(event.eventDate);
                return eventDate >= today;
            });
        
            console.log('Future events found:', futureEvents.length);
            return futureEvents;
        } catch (error) {
            console.error('Error in getFutureEvents:', error);
            throw error;
        }
    }
};

module.exports = matchingService;