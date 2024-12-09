import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import FilterOptions from '../Profile/VolunteerHistoryFilter';
import '../../styles/VolunteerHistory.css';

const VolunteerHistory = () => {
  const [volunteerHistory, setVolunteerHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAdmin, user } = useAuth();
  const participationStatuses = [
    { value: 'Not Attended', label: 'Not Attended' },
    { value: 'Matched - Pending Attendance', label: 'Matched - Pending Attendance' },
    { value: 'Attended', label: 'Attended' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    setFilteredHistory(volunteerHistory);
  }, [volunteerHistory]);

  const handleFilterChange = (filters) => {
    let filtered = [...volunteerHistory];

    if (filters.urgency.length > 0) {
      filtered = filtered.filter(item => filters.urgency.includes(item.urgency));
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(item => filters.status.includes(item.participationStatus));
    }

    if (filters.eventNameSort !== 'none') {
      filtered.sort((a, b) => {
        if (filters.eventNameSort === 'asc') {
          return a.eventName.localeCompare(b.eventName);
        } else {
          return b.eventName.localeCompare(a.eventName);
        }
      });
    }

    if (filters.eventDateSort !== 'none') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        if (filters.eventDateSort === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    setFilteredHistory(filtered);
  };

  const fetchVolunteers = useCallback(async () => {
    try {
      setLoading(true);
  
      const endpoint = 'http://localhost:5000/api/auth/registered-volunteers';
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (response.data) {
        let volunteersData = response.data;
        
        if (!isAdmin && user) {
          volunteersData = volunteersData.map(volunteer => ({
            ...volunteer,
            isSelf: volunteer.id === user.id,
          }));
          setSelectedVolunteer(user.id);
          fetchVolunteerHistory(user.id);
        }
  
        setVolunteers(volunteersData);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setError('Failed to fetch volunteers. Please try again later.');
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);
  
  useEffect(() => {
    if (user) {
      fetchVolunteers();
    }
  }, [user, fetchVolunteers]); 

  const fetchVolunteerHistory = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/auth/history/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data) {
        setVolunteerHistory(response.data);
        setFilteredHistory(response.data);
      }
    } catch (err) {
      console.error('Error fetching volunteer history:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Not authorized to view this history.');
      } else {
        setError('Failed to fetch volunteer history. Please try again later.');
      }
      setVolunteerHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVolunteerChange = (e) => {
    const userId = e.target.value;
    setSelectedVolunteer(userId);
    if (userId) {
      fetchVolunteerHistory(userId);
    } else {
      setVolunteerHistory([]);
      setFilteredHistory([]);
      setError(null);
    }
  };

  const updateEventStatus = async (historyId, newStatus) => {
    if (!isAdmin) return;
  
    try {
      const token = localStorage.getItem('token');

      setVolunteerHistory(prevHistory => 
        prevHistory.map(history => 
          history.id === historyId 
            ? { ...history, participationStatus: newStatus }
            : history
        )
      );
  
      const response = await axios.put(
        `http://localhost:5000/api/auth/history/${historyId}`, 
        { participationStatus: newStatus },
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (!response.data.success) {
        throw new Error(response.data.message || 'Update failed');
      }

      setError(null);
      
    } catch (error) {
      console.error('Error updating event status:', error);
      await fetchVolunteerHistory(selectedVolunteer);
      
      setError(
        error.response?.data?.message || 
        'Failed to update event status. Please try again.'
      );
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'Matched - Pending Attendance':
        return 'status-matched';
      case 'Attended':
        return 'status-attended';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'status-not-attended';
    }
  };

  return (
    <div className="volunteer-history-container">
      <h2>Volunteer Participation History</h2>

      <div className="volunteer-selection">
        <label htmlFor="volunteer-dropdown">Select Volunteer: </label>
        <select
          id="volunteer-dropdown"
          value={selectedVolunteer}
          onChange={handleVolunteerChange}
          disabled={loading}
        >
          <option value="">-- Select Volunteer --</option>
          {volunteers.map((volunteer) => (
            <option 
              key={volunteer.id} 
              value={volunteer.id}
            >
              {volunteer.email === user.email ? `${volunteer.email} (You)` : volunteer.email}
            </option>
          ))}
        </select>
      </div>

      {selectedVolunteer && !loading && !error && (
        <FilterOptions onFilterChange={handleFilterChange} />
      )}

      {loading && <p>Loading...</p>}
      {error && selectedVolunteer && <p className="error-message">{error}</p>}

      {selectedVolunteer && !loading && !error && (
        <table className="volunteer-history-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Event Description</th>
              <th>Location</th>
              <th>Required Skills</th>
              <th>Urgency</th>
              <th>Event Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Participation Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((history) => (
                <tr key={history.id}>
                  <td>{history.eventName}</td>
                  <td>{history.eventDescription}</td>
                  <td>{history.location}</td>
                  <td>{history.requiredSkills.join(', ')}</td>
                  <td>{history.urgency}</td>
                  <td>{history.eventDate}</td>
                  <td>{history.startTime}</td>
                  <td>{history.endTime}</td>
                  <td className={getStatusClassName(history.participationStatus)}>
                    {history.participationStatus}
                  </td>
                  {isAdmin && (
                    <td>
                      <select
                        value={history.participationStatus}
                        onChange={(e) => updateEventStatus(history.id, e.target.value)}
                        className={getStatusClassName(history.participationStatus)}
                      >
                        {participationStatuses.map(status => (
                          <option 
                            key={status.value} 
                            value={status.value}
                          >
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 10 : 9}>No history available for this volunteer</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!selectedVolunteer && !loading && !error && (
        <p>Please select a volunteer to view their participation history.</p>
      )}
    </div>
  );
};

export default VolunteerHistory;