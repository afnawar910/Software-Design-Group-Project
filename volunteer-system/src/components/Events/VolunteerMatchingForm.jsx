import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/MatchingForm.css';

const VolunteerMatchingForm = () => {
	const [events, setEvents] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [matchedVolunteers, setMatchedVolunteers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedVolunteer, setSelectedVolunteer] = useState(null);
	const { isAdmin, isLoggedIn } = useAuth();

    useEffect(() => {
        if (!isLoggedIn || !isAdmin) {
            setError('Admin access required');
            return;
        }

        const fetchEvents = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await axios.get('http://localhost:5000/api/auth/volunteer-matching/future-events', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Fetched events:', response.data);
                setEvents(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching events:', error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    setError('Please log in again with admin credentials');
                } else {
                    setError(error.response?.data?.message || 'Failed to load events');
                }
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [isAdmin, isLoggedIn]);

	useEffect(() => {
		const fetchMatchingVolunteers = async () => {
		if (!selectedEvent) return;
		
		setLoading(true);
		setError(null);
		
		try {
			console.log('Fetching volunteers for event:', selectedEvent);
			const token = localStorage.getItem('token');
			const response = await axios.get(
			`http://localhost:5000/api/auth/volunteer-matching/${selectedEvent.id}`,
			{
				headers: { Authorization: `Bearer ${token}` }
			}
			);
			console.log('Matching volunteers response:', response.data);
			setMatchedVolunteers(response.data);
		} catch (error) {
			console.error('Error fetching matching volunteers:', error);
			setError(
			error.response?.data?.message || 
			'Failed to load matching volunteers. Please try again.'
			);
			setMatchedVolunteers([]);
		} finally {
			setLoading(false);
		}
		};

		fetchMatchingVolunteers();
	}, [selectedEvent]);

	const formatDate = (dateString) => {
		const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
		return new Date(dateString).toLocaleDateString(undefined, options);
	  };

	const handleEventSelect = (event) => {
		console.log('Selected event:', event);
		setSelectedEvent(event);
		setSelectedVolunteer(null);
		setError(null);
	};

	const handleVolunteerSelect = (volunteer) => {
		console.log('Selected volunteer:', volunteer);
		setSelectedVolunteer(volunteer);
	};


	const handleMatch = async () => {
		if (!selectedEvent || !selectedVolunteer) {
			setError('Please select both an event and a volunteer');
			return;
		}
	
		try {
			setLoading(true);
			const token = localStorage.getItem('token');
	
			await axios.post(
				'http://localhost:5000/api/auth/history/match-status',
				{
					volunteerId: selectedVolunteer.id,
					eventId: selectedEvent.id,
					participationStatus: 'Matched - Pending Attendance' // Add this explicitly
				},
				{
					headers: { 
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);
	
			// Only update UI if request succeeded
			setMatchedVolunteers(prev => prev.filter(v => v.id !== selectedVolunteer.id));
			setSelectedVolunteer(null);
			setError(null);
	
			alert(`${selectedVolunteer.fullName} has been matched to ${selectedEvent.eventName}! Their status is now "Matched - Pending Attendance".`);
		} catch (error) {
			console.error('Error matching volunteer:', error);
			if (error.response?.status === 500) {
				setError('Server error: Unable to update volunteer status. Please try again.');
			} else if (error.response?.status === 401 || error.response?.status === 403) {
				setError('Authentication error: Please log in again with admin credentials.');
			} else {
				setError(error.response?.data?.message || 'Failed to match volunteer to event. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const getEventUrgencyClass = (urgency) => {
		switch (urgency.toLowerCase()) {
		case 'high':
			return 'urgency-high';
		case 'medium':
			return 'urgency-medium';
		case 'low':
			return 'urgency-low';
		default:
			return '';
		}
	};

	return (
		<div className="volunteer-matching-form">
		<h2>Volunteer Matching</h2>
		
		{error && (
			<div className="error-message">
			<p>{error}</p>
			<button onClick={() => setError(null)}>Dismiss</button>
			</div>
		)}

		{loading && (
			<div className="loading-spinner">
			<p>Loading...</p>
			</div>
		)}

		<div className="event-selection">
			<h3>Available Upcoming Events</h3>
			<div className="events-grid">
			{events.length > 0 ? (
				events.map(event => (
				<div 
					key={event.id}
					className={`event-card ${selectedEvent?.id === event.id ? 'selected' : ''} ${getEventUrgencyClass(event.urgency)}`}
					onClick={() => handleEventSelect(event)}
				>
					<div className="event-header">
					<h4>{event.eventName}</h4>
					<span className="urgency-badge">{event.urgency}</span>
					</div>
					<p className="event-date">📅 {formatDate(event.eventDate)}</p>
					<p className="event-time">⏰ {event.startTime} - {event.endTime}</p>
					<p className="event-location">📍 {event.city}</p>
					<div className="event-skills">
					<p>Required Skills:</p>
					<div className="skills-tags">
						{event.requiredSkills.map((skill, index) => (
						<span key={index} className="skill-tag">{skill}</span>
						))}
					</div>
					</div>
				</div>
				))
			) : (
				<p className="no-events">No upcoming events available</p>
			)}
			</div>
		</div>

		{selectedEvent && (
			<div className="matching-volunteers">
			<h3>Available Matching Volunteers</h3>
			{loading ? (
				<div className="loading-spinner">Loading matching volunteers...</div>
			) : matchedVolunteers.length > 0 ? (
				<div className="volunteers-grid">
				{matchedVolunteers.map(volunteer => (
					<div
					key={volunteer.id}
					className={`volunteer-card ${selectedVolunteer?.id === volunteer.id ? 'selected' : ''}`}
					onClick={() => handleVolunteerSelect(volunteer)}
					>
					<h4>{volunteer.fullName}</h4>
					<p>📧 {volunteer.email}</p>
					<div className="volunteer-skills">
						<p>Matching Skills:</p>
						<div className="skills-tags">
						{volunteer.skills.map((skill, index) => (
							<span key={index} className="skill-tag">{skill}</span>
						))}
						</div>
					</div>
					<p className="volunteer-location">📍 {volunteer.city}</p>
					</div>
				))}
				</div>
			) : (
				<p className="no-volunteers">No matching volunteers found for this event</p>
			)}
			</div>
		)}

		{selectedEvent && selectedVolunteer && (
			<div className="matching-action">
			<button 
				onClick={handleMatch}
				className="match-button"
			>
				Match Volunteer to Event
			</button>
			</div>
		)}
		</div>
	);
};

export default VolunteerMatchingForm;