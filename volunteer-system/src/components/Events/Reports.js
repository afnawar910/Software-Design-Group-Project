import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import '../../styles/Reports.css';

const Reports = () => {
    const [selectedReport, setSelectedReport] = useState('');
    const [selectedVolunteerOption, setSelectedVolunteerOption] = useState('');
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [selectedEventOption, setSelectedEventOption] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [volunteers, setVolunteers] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch volunteers
                const volunteersResponse = await fetch('http://localhost:5000/api/auth/registered-volunteers', {
                    headers
                });
                const volunteersData = await volunteersResponse.json();
                setVolunteers(volunteersData);

                // Fetch events
                const eventsResponse = await fetch('http://localhost:5000/api/auth/events', {
                    headers
                });
                const eventsData = await eventsResponse.json();
                setEvents(eventsData);
            } catch (err) {
                setError('Failed to fetch data');
            }
        };

        fetchData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            let endpoint = '';
            let filename = '';
            const today = new Date();
            const dateString = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${today.getFullYear().toString().substring(2)}`;

            if (selectedReport === 'volunteer-history') {
                endpoint = 'http://localhost:5000/api/auth/reports/volunteers';
                if (selectedVolunteerOption === 'specific') {
                    endpoint += `/${selectedVolunteer}`;
                    const volunteer = volunteers.find(v => v.id.toString() === selectedVolunteer.toString());
                    filename = `Volunteer_Report_${volunteer.email}_${dateString}`;
                } else {
                    filename = `Volunteer_Report_All_${dateString}`;
                }
            } else if (selectedReport === 'event-details') {
                endpoint = 'http://localhost:5000/api/auth/reports/events';
                if (selectedEventOption === 'specific') {
                    endpoint += `/${selectedEvent}`;
                    const event = events.find(e => e.id.toString() === selectedEvent.toString());
                    filename = `Event_Report_${event.eventName}_${dateString}`;
                } else {
                    endpoint += `?startDate=${startDate}&endDate=${endDate}`;
                    filename = `Event_Report_${startDate}_to_${endDate}_${dateString}`;
                }
            }

            endpoint += endpoint.includes('?') ? `&format=${selectedFormat}` : `?format=${selectedFormat}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(
                new Blob([blob], {
                    type: selectedFormat === 'PDF' ? 'application/pdf' : 'text/csv'
                })
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${selectedFormat.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reports-container">
            <h1 className="reports-title">Generate Reports</h1>

            <div className="form-section">
                <label className="form-label">
                    Select Report Type
                </label>
                <div className="select-container">
                    <select
                        value={selectedReport}
                        onChange={(e) => {
                            setSelectedReport(e.target.value);
                            setSelectedVolunteerOption('');
                            setSelectedEventOption('');
                            setSelectedFormat('');
                        }}
                        className="select-input"
                    >
                        <option value="">Select a report type...</option>
                        <option value="volunteer-history">List of volunteers and their participation history</option>
                        <option value="event-details">Event details and volunteer assignments</option>
                    </select>
                    <ChevronDown className="select-arrow" />
                </div>
            </div>

            {selectedReport === 'volunteer-history' && (
                <>
                    <div className="form-section">
                        <label className="form-label">
                            Select Volunteer Option
                        </label>
                        <div className="select-container">
                            <select
                                value={selectedVolunteerOption}
                                onChange={(e) => setSelectedVolunteerOption(e.target.value)}
                                className="select-input"
                            >
                                <option value="">Select an option...</option>
                                <option value="all">All volunteers</option>
                                <option value="specific">Specific volunteer</option>
                            </select>
                            <ChevronDown className="select-arrow" />
                        </div>
                    </div>

                    {selectedVolunteerOption === 'specific' && (
                        <div className="form-section">
                            <label className="form-label">
                                Select Volunteer
                            </label>
                            <div className="select-container">
                                <select
                                    value={selectedVolunteer}
                                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                                    className="select-input"
                                >
                                    <option value="">Select a volunteer...</option>
                                    {volunteers.map((volunteer) => (
                                        <option key={volunteer.id} value={volunteer.id}>
                                            {volunteer.email}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="select-arrow" />
                            </div>
                        </div>
                    )}
                </>
            )}

            {selectedReport === 'event-details' && (
                <>
                    <div className="form-section">
                        <label className="form-label">
                            Select Event Option
                        </label>
                        <div className="select-container">
                            <select
                                value={selectedEventOption}
                                onChange={(e) => setSelectedEventOption(e.target.value)}
                                className="select-input"
                            >
                                <option value="">Select an option...</option>
                                <option value="date-range">Date range</option>
                                <option value="specific">Specific event</option>
                            </select>
                            <ChevronDown className="select-arrow" />
                        </div>
                    </div>

                    {selectedEventOption === 'specific' && (
                        <div className="form-section">
                            <label className="form-label">
                                Select Event
                            </label>
                            <div className="select-container">
                                <select
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                    className="select-input"
                                >
                                    <option value="">Select an event...</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.eventName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="select-arrow" />
                            </div>
                        </div>
                    )}
                    

                    {selectedEventOption === 'date-range' && (
    <>
        <div className="form-section">
            <label className="form-label">Start Date</label>
            <div className="select-container">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="select-input"
                />
            </div>
        </div>
        <div className="form-section">
            <label className="form-label">End Date</label>
            <div className="select-container">
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="select-input"
                />
            </div>
        </div>
    </>
)}
                </>
            )}

            {(selectedVolunteerOption || selectedEventOption) && (
                <div className="form-section">
                    <label className="form-label">
                        Select Format
                    </label>
                    <div className="select-container">
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="select-input"
                        >
                            <option value="">Select a format...</option>
                            <option value="PDF">PDF</option>
                            <option value="CSV">CSV</option>
                        </select>
                        <ChevronDown className="select-arrow" />
                    </div>
                </div>
            )}

            {selectedFormat && (
                <button
                    onClick={handleGenerateReport}
                    disabled={loading || 
                        (selectedEventOption === 'date-range' && (!startDate || !endDate)) ||
                        (selectedEventOption === 'specific' && !selectedEvent) ||
                        (selectedVolunteerOption === 'specific' && !selectedVolunteer)
                    }
                    className="generate-button"
                >
                    {loading && <span className="loading-spinner" />}
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Reports;