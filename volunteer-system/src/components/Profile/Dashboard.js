import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    skills: [],
    preferences: '',
    availability: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOptions, setFormOptions] = useState({
    states: [],
    skills: []
  });
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  useEffect(() => {
    console.log('Current isEditing state:', isEditing);
  }, [isEditing]); 

  // Fetch form options = states and skills
  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/profile/form-options');
        setFormOptions(response.data);
      } catch (error) {
        console.error('Error fetching form options:', error);
        setError('Failed to load form options');
      }
    };

    fetchFormOptions();
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Use the same endpoint for both admin and regular users
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data) {
          const profile = response.data;
          // Only convert availability dates for regular users since admins don't have them
          if (!isAdmin && profile.availability) {
            profile.availability = profile.availability.map(date => new Date(date));
          }
          
          setUserData(profile);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error.response || error);
        setError(
          error.response?.data?.message || 
          'Failed to load user data. Please try again later.'
        );
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, isAdmin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (selectedOptions) => {
    setUserData(prev => ({
      ...prev,
      skills: selectedOptions.map(option => option.value)
    }));
  };

  const handleDateChange = (date) => {
    if (!userData.availability.some(d => d.getTime() === date.getTime())) {
      setUserData(prev => ({
        ...prev,
        availability: [...prev.availability, date]
      }));
    }
  };

  const handleRemoveDate = (dateToRemove) => {
    setUserData(prev => ({
      ...prev,
      availability: prev.availability.filter(date => 
        date.getTime() !== dateToRemove.getTime()
      )
    }));
  };

  const handleEditClick = (e) => {
    e.preventDefault(); 
    console.log('Edit button clicked, current isEditing state:', isEditing);
    setIsEditing(prevState => {
      console.log('Setting isEditing from', prevState, 'to true');
      return true;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, current editing state:', isEditing);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const updatedData = {
        skills: userData.skills,
        preferences: userData.preferences,
        availability: userData.availability.map(date => date.toISOString())
      };
      
      console.log('Sending update data:', updatedData);

      await axios.put(
        'http://localhost:5000/api/profile',
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <h2>Profile Dashboard</h2>
      {isAdmin ? (
        // Admin View - Now using database values
        <div className="admin-profile">
          <div className="form-group">
            <label>Full Name:</label>
            <span>{userData.fullName || 'Not set'}</span>
          </div>
  
          <div className="form-group">
            <label>Email:</label>
            <span>{userData.email}</span>
          </div>
  
          <div className="form-group">
            <label>Role:</label>
            <span className="admin-badge">Administrator</span>
          </div>
  
          <div className="admin-note">
            <p>Administrator Account</p>
          </div>
  
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      ) : (
        // Regular User View remains the same
        <form onSubmit={handleSubmit}>
          {/* Read-only fields */}
          <div className="form-group">
            <label>Full Name:</label>
            <span>{userData.fullName}</span>
          </div>
  
          <div className="form-group">
            <label>Email:</label>
            <span>{userData.email}</span>
          </div>
  
          <div className="form-group">
            <label>Address:</label>
            <span>{userData.address1}</span>
          </div>
  
          <div className="form-group">
            <label>Address 2:</label>
            <span>{userData.address2}</span>
          </div>
  
          <div className="form-group">
            <label>City:</label>
            <span>{userData.city}</span>
          </div>
  
          <div className="form-group">
            <label>State:</label>
            <span>{userData.state}</span>
          </div>
  
          <div className="form-group">
            <label>ZIP Code:</label>
            <span>{userData.zipCode}</span>
          </div>
  
          {/* Editable fields */}
          <div className="form-group">
            <label>Skills:</label>
            {isEditing ? (
              <div className="skills-section">
                <Select
                  isMulti
                  options={formOptions.skills}
                  value={formOptions.skills.filter(skill => 
                    userData.skills.includes(skill.value)
                  )}
                  onChange={handleSkillChange}
                  className="skills-select"
                  placeholder="Select or add more skills..."
                />
                <small className="help-text">You can select multiple skills</small>
              </div>
            ) : (
              <div className="skills-display">
                {userData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            )}
          </div>
  
          {/* Update the Preferences section */}
          <div className="form-group">
            <label>Preferences:</label>
            {isEditing ? (
              <div className="preferences-section">
                <textarea
                  name="preferences"
                  value={userData.preferences || ''}
                  onChange={handleInputChange}
                  className="preferences-textarea"
                  placeholder="Enter your preferences..."
                  rows="4"
                />
              </div>
            ) : (
              <span>{userData.preferences || 'No preferences specified'}</span>
            )}
          </div>
  
          {/* Update the Availability section */}
          <div className="form-group">
            <label>Availability:</label>
            {isEditing ? (
              <div className="availability-section">
                <DatePicker
                  selected={null}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  inline
                />
                <div className="selected-dates">
                  {userData.availability.map((date, index) => (
                    <div key={index} className="date-tag">
                      <span>{new Date(date).toLocaleDateString()}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDate(date)}
                        className="remove-date"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="dates-display">
                {userData.availability.map((date, index) => (
                  <span key={index} className="date-tag">
                    {new Date(date).toLocaleDateString()}
                  </span>
                ))}
              </div>
            )}
          </div>
  
          {/* Update the action buttons */}
          <div className="dashboard-actions">
            {isEditing ? (
              <>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="cancel-button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                type="button" 
                onClick={handleEditClick}
                className="edit-button"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )};
  
export default Dashboard;