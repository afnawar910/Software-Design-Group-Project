import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/ProfileForm.css';

const ProfileForm = () => {
	const [formData, setFormData] = useState({
		fullName: '',
		address1: '',
		address2: '',
		city: '',
		state: '',
		zipCode: '',
		skills: [],
		preferences: '',
		availability: []
	});
	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [formOptions, setFormOptions] = useState({
		states: [],
		skills: []
	});
	const navigate = useNavigate();

	useEffect(() => {
		const fetchFormOptions = async () => {
			try {
				const response = await axios.get('http://localhost:5000/api/profile/form-options');
				setFormOptions(response.data);
			} catch (error) {
				console.error('Error fetching form options:', error);
				setErrors(prev => ({
					...prev,
					general: 'Failed to load form options. Please try again.'
				}));
			}
		};

		fetchFormOptions();
	}, []);

	const validateForm = () => {
		const newErrors = {};

		if (!formData.fullName.trim()) {
			newErrors.fullName = 'Full name is required';
		}

		if (!formData.address1.trim()) {
			newErrors.address1 = 'Address is required';
		}

		if (!formData.city.trim()) {
			newErrors.city = 'City is required';
		}

		if (!formData.state) {
			newErrors.state = 'State is required';
		}

		if (!formData.zipCode.trim()) {
			newErrors.zipCode = 'Zip code is required';
		} else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
			newErrors.zipCode = 'Invalid zip code format';
		}

		if (formData.skills.length === 0) {
			newErrors.skills = 'Please select at least one skill';
		}

		if (formData.availability.length === 0) {
			newErrors.availability = 'Please select at least one availability date';
		}

		return newErrors;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	const handleSkillChange = (selectedOptions) => {
		const selectedSkills = selectedOptions.map(option => option.value);
		setFormData(prev => ({
			...prev,
			skills: selectedSkills
		}));
		if (errors.skills) {
			setErrors(prev => ({
				...prev,
				skills: ''
			}));
		}
	};

	const handleDateChange = (date) => {
		if (!formData.availability.some(d => d.getTime() === date.getTime())) {
			setFormData(prev => ({
				...prev,
				availability: [...prev.availability, date]
			}));
		}
		if (errors.availability) {
			setErrors(prev => ({
				...prev,
				availability: ''
			}));
		}
	};

	const handleRemoveDate = (dateToRemove) => {
		setFormData(prev => ({
			...prev,
			availability: prev.availability.filter(
				date => date.getTime() !== dateToRemove.getTime()
			)
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		const validationErrors = validateForm();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			setLoading(false);
			return;
		}

		try {
			const registrationToken = localStorage.getItem('registrationToken');
			if (!registrationToken) {
				throw new Error('Registration token not found');
			}

			const formattedData = {
				...formData,
				availability: formData.availability.map(date => date.toISOString())
			};

			const response = await axios.post('http://localhost:5000/api/profile/finalize-registration', {
				token: registrationToken,
				...formattedData
			});

			if (response.status === 201) {
				localStorage.removeItem('registrationToken');
				navigate('/login');
			}
		} catch (error) {
			console.error('Error submitting profile:', error);
			setErrors(prev => ({
				...prev,
				general: error.response?.data?.message || 'Failed to complete registration'
			}));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="profile-form-container">
			<form className="profile-form" onSubmit={handleSubmit}>
				<h2>Complete Your Profile</h2>

				{errors.general && (
					<div className="error-message general-error">
						{errors.general}
					</div>
				)}

				<div className="form-group">
					<label htmlFor="fullName">Full Name:</label>
					<input
						type="text"
						id="fullName"
						name="fullName"
						value={formData.fullName}
						onChange={handleInputChange}
						maxLength={100}
						required
					/>
					{errors.fullName && <span className="error-message">{errors.fullName}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="address1">Address:</label>
					<input
						type="text"
						id="address1"
						name="address1"
						value={formData.address1}
						onChange={handleInputChange}
						maxLength={100}
						required
					/>
					{errors.address1 && <span className="error-message">{errors.address1}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="address2">Address 2 (Optional):</label>
					<input
						type="text"
						id="address2"
						name="address2"
						value={formData.address2}
						onChange={handleInputChange}
						maxLength={100}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="city">City:</label>
					<input
						type="text"
						id="city"
						name="city"
						value={formData.city}
						onChange={handleInputChange}
						maxLength={50}
						required
					/>
					{errors.city && <span className="error-message">{errors.city}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="state">State:</label>
					<Select
						id="state"
						name="state"
						options={formOptions.states.map(state => ({
							value: state.code,
							label: state.name
						}))}
						value={formOptions.states
							.filter(state => state.code === formData.state)
							.map(state => ({
								value: state.code,
								label: state.name
							}))[0]}
						onChange={(selected) => {
							setFormData(prev => ({
								...prev,
								state: selected.value
							}));
						}}
						isSearchable
						required
					/>
					{errors.state && <span className="error-message">{errors.state}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="zipCode">Zip Code:</label>
					<input
						type="text"
						id="zipCode"
						name="zipCode"
						value={formData.zipCode}
						onChange={handleInputChange}
						maxLength={10}
						pattern="^\d{5}(-\d{4})?$"
						required
					/>
					{errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="skills">Skills:</label>
					<Select
						isMulti
						id="skills"
						options={formOptions.skills}
						onChange={handleSkillChange}
						value={formOptions.skills.filter(skill =>
							formData.skills.includes(skill.value)
						)}
						required
					/>
					{errors.skills && <span className="error-message">{errors.skills}</span>}
				</div>

				<div className="form-group">
					<label htmlFor="preferences">Preferences (Optional):</label>
					<textarea
						id="preferences"
						name="preferences"
						value={formData.preferences}
						onChange={handleInputChange}
						rows="4"
						maxLength={500}
					/>
				</div>

				<div className="form-group">
					<label>Availability:</label>
					<DatePicker
						selected={null}
						onChange={handleDateChange}
						minDate={new Date()}
						inline
						required
					/>
					<div className="selected-dates">
						{formData.availability.map((date, index) => (
							<div key={index} className="date-tag">
								<span>{date.toLocaleDateString()}</span>
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
					{errors.availability && (
						<span className="error-message">{errors.availability}</span>
					)}
				</div>

				<button
					type="submit"
					className="submit-button"
					disabled={loading || Object.keys(errors).length > 0}
				>
					{loading ? 'Completing Registration...' : 'Complete Registration'}
				</button>
			</form>
		</div>
	);
};

export default ProfileForm;