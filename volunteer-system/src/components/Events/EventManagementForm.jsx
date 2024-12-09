import React, { useState, useEffect } from 'react';
import api from '../../utils/api';  
import '../../styles/Events.css';  

const EventManagementForm = () => {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    requiredSkills: [],
    urgency: '',
    eventDate: '',
    startTime: '',
    endTime: ''
  });
  const [errors, setErrors] = useState({});
  const [formOptions, setFormOptions] = useState({
    skillOptions: [],
    urgencyOptions: [],
    stateOptions: []
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchFormOptions();
  }, []);

 
  const fetchFormOptions = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/events/form-options');
      // Transform the data to match frontend structure
      setFormOptions({
        stateOptions: response.data.states.map(state => state.code), // Convert state objects to array of codes
        skillOptions: response.data.skills || [],
        urgencyOptions: response.data.urgencyLevels || []
      });
    } catch (error) {
      console.error('Error fetching form options:', error.response?.data || error.message);
      setErrorMessage('Unable to load form options. Please try again later.');
      setFormOptions({
        stateOptions: [],
        skillOptions: [],
        urgencyOptions: []
      });
    } finally {
      setIsLoading(false);
    }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSkillsChange = (skill) => {
    setFormData(prevState => ({
      ...prevState,
      requiredSkills: prevState.requiredSkills.includes(skill)
        ? prevState.requiredSkills.filter(s => s !== skill)
        : [...prevState.requiredSkills, skill]
    }));
    if (errors.requiredSkills) {
      setErrors(prevErrors => ({ ...prevErrors, requiredSkills: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.eventName.trim()) newErrors.eventName = 'Event Name is required';
    if (!formData.eventDescription.trim()) newErrors.eventDescription = 'Event Description is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip Code is required';
    if (formData.requiredSkills.length === 0) newErrors.requiredSkills = 'At least one skill is required';
    if (!formData.urgency) newErrors.urgency = 'Urgency is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start Time is required';
    if (!formData.endTime) newErrors.endTime = 'End Time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!validateForm()) {
  //     return;
  //   }
  //   try {
  //     setIsLoading(true);
  //     const response = await api.post('/events', formData);
  //     setSubmitStatus('success');
   
  //     setFormData({
  //       eventName: '',
  //       eventDescription: '',
  //       address1: '',
  //       city: '',
  //       state: '',
  //       zipCode: '',
  //       requiredSkills: [],
  //       urgency: '',
  //       eventDate: '',
  //       startTime: '',
  //       endTime: ''
  //     });
  //     console.log('Event created successfully:', response.data);
  //   } catch (error) {
  //     console.error('Error submitting form:', error.response?.data || error.message);
  //     setErrors(error.response?.data?.errors || {});
  //     setSubmitStatus('error');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }
    try {
        setIsLoading(true);
        
        // Transform address1 to address before sending
        const eventData = {
            ...formData,
            address: formData.address1 // Map address1 to address
        };
        delete eventData.address1;  // Remove address1

        // Log the exact data being sent
        console.log('Sending event data:', eventData);
        
        const response = await api.post('/events', eventData);
        console.log('Server response:', response.data);
        
        setSubmitStatus('success');
        setFormData({
            eventName: '',
            eventDescription: '',
            address1: '',
            city: '',
            state: '',
            zipCode: '',
            requiredSkills: [],
            urgency: '',
            eventDate: '',
            startTime: '',
            endTime: ''
        });
    } catch (error) {
        // More detailed error logging
        console.error('Full error:', error);
        console.error('Error response:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        
        // Handle specific error cases
        if (error.response?.status === 401) {
            setSubmitStatus('error');
            setErrorMessage('Please login again. Your session may have expired.');
            return;
        }
        
        if (error.response?.status === 400) {
            if (error.response.data?.errors) {
                setErrors(error.response.data.errors);
                console.log('Validation errors:', error.response.data.errors);
            } else {
                setErrorMessage(error.response.data?.message || 'Invalid data submitted');
            }
            setSubmitStatus('error');
            return;
        }
        
        setSubmitStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
};
  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (errorMessage) {
    return (
      <div className="error-message">
        <p>{errorMessage}</p>
        <button onClick={fetchFormOptions}>Retry</button>
      </div>
    );
  }

  return (
    <div className="event-management-form">
      <h2>Event Management Form</h2>
      {submitStatus === 'success' && <div className="success-message">Event created successfully!</div>}
      {submitStatus === 'error' && <div className="error-message">Error creating event. Please try again.</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventName">Event Name:</label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
          />
          {errors.eventName && <span className="error">{errors.eventName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="eventDescription">Event Description:</label>
          <textarea
            id="eventDescription"
            name="eventDescription"
            value={formData.eventDescription}
            onChange={handleChange}
          />
          {errors.eventDescription && <span className="error">{errors.eventDescription}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="address1">Address:</label>
          <input
            type="text"
            id="address1"
            name="address1"
            value={formData.address1}
            onChange={handleChange}
          />
          {errors.address1 && <span className="error">{errors.address1}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="city">City:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
          {errors.city && <span className="error">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="state">State:</label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          >
            <option value="">Select State</option>
            {formOptions.stateOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.state && <span className="error">{errors.state}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">Zip Code:</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
          />
          {errors.zipCode && <span className="error">{errors.zipCode}</span>}
        </div>

        <div className="form-group">
          <label>Required Skills:</label>
          <div className="multi-select-container">
            <div className="multi-select-header" onClick={() => setIsSkillsOpen(!isSkillsOpen)}>
              <span>{formData.requiredSkills.length ? formData.requiredSkills.join(', ') : 'Select skills'}</span>
              <span className="arrow">{isSkillsOpen ? '▲' : '▼'}</span>
            </div>
            {isSkillsOpen && (
              <div className="multi-select-options">
                {formOptions.skillOptions.map(option => (
                  <label key={option} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={formData.requiredSkills.includes(option)}
                      onChange={() => handleSkillsChange(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.requiredSkills && <span className="error">{errors.requiredSkills}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="urgency">Urgency:</label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
          >
            <option value="">Select Urgency</option>
            {formOptions.urgencyOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {errors.urgency && <span className="error">{errors.urgency}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="eventDate">Event Date:</label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
          />
          {errors.eventDate && <span className="error">{errors.eventDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />
          {errors.startTime && <span className="error">{errors.startTime}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time:</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
          />
          {errors.endTime && <span className="error">{errors.endTime}</span>}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default EventManagementForm;