import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Calendar.css';

const Calendar = ({ isAdmin }) => {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [events, setEvents] = useState({});

	useEffect(() => {
		const token = localStorage.getItem('token');
		const fetchEvents = async () => {
			try {
				const response = await axios.get('http://localhost:5000/api/auth/events', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				console.log('Full response:', response);
				const eventData = response.data;
				console.log('Fetched event data:', eventData);

				const eventsArray = Array.isArray(eventData) ? eventData : eventData.events || [];
				const eventsByDate = eventsArray.reduce((acc, event) => {
					const dateString = event.eventDate;
					if (!acc[dateString]) {
						acc[dateString] = [];
					}
					acc[dateString].push(event);
					return acc;
				}, {});

				setEvents(eventsByDate);
			} catch (error) {
				console.error('Error fetching events:', error.response ? error.response.data : error.message);
			}
		};

		fetchEvents();
	}, []);

	// Helper to calculate the number of days in the current month
	const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

	// Helper to calculate the first day of the current month
	const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

	const monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	const renderCalendarDays = () => {
		const days = [];
		const totalDays = daysInMonth(currentDate);
		const firstDay = firstDayOfMonth(currentDate);

		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
		}

		for (let day = 1; day <= totalDays; day++) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
			const dateString = date.toISOString().split('T')[0];
			const dayEvents = events[dateString] || [];

			days.push(
				<div key={day} className="calendar-day">
					<span className="day-number">{day}</span>

					{/* Display events for the current day */}
					{dayEvents.map(event => (
						<div
							key={event.id}
							className="event-item"
						>
							<span className="event-title">{event.eventName}</span>
							<span className="event-time">{`${event.startTime} - ${event.endTime}`}</span>
							<div className="event-tooltip">
								<strong>{event.eventName}</strong>
								<br />
								{`${event.startTime} - ${event.endTime}`}
							</div>
						</div>
					))}

				</div>
			);
		}

		return days;
	};

	const changeMonth = (increment) => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
	};

	return (
		<div className="calendar-container">
			<div className="calendar-header">
				<button onClick={() => changeMonth(-1)}>❮</button>
				<h2>Event Calendar</h2>
				<button onClick={() => changeMonth(1)}>❯</button>
			</div>
			<div className="calendar-subheader">
				<h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
			</div>
			<div className="calendar-grid">
				<div className="calendar-day-header">Sun</div>
				<div className="calendar-day-header">Mon</div>
				<div className="calendar-day-header">Tue</div>
				<div className="calendar-day-header">Wed</div>
				<div className="calendar-day-header">Thu</div>
				<div className="calendar-day-header">Fri</div>
				<div className="calendar-day-header">Sat</div>
				{renderCalendarDays()}
			</div>
		</div>
	);
};

export default Calendar;