import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/RegistrationPage.css';

const RegistrationPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [confirmPasswordError, setConfirmPasswordError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { register } = useAuth();

	const validateEmail = (email) => {
		const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(String(email).toLowerCase());
	};

	const handleEmailChange = (e) => {
		const newEmail = e.target.value;
		setEmail(newEmail);
		if (!validateEmail(newEmail)) {
			setEmailError('Please enter a valid email address');
		} else {
			setEmailError('');
		}
	};

	const validatePassword = (password) => {
		const errors = [];
		if (password.length < 8) {
			errors.push('Password must be at least 8 characters long');
		}
		if (!/[A-Z]/.test(password)) {
			errors.push('Password must contain at least one uppercase letter');
		}
		if (!/[a-z]/.test(password)) {
			errors.push('Password must contain at least one lowercase letter');
		}
		if (!/[0-9]/.test(password)) {
			errors.push('Password must contain at least one number');
		}
		return errors;
	};

	const handlePasswordChange = (e) => {
		const newPassword = e.target.value;
		setPassword(newPassword);
		const errors = validatePassword(newPassword);
		setPasswordError(errors.length > 0 ? errors : '');

		if (confirmPassword && newPassword !== confirmPassword) {
			setConfirmPasswordError('Passwords do not match');
		} else {
			setConfirmPasswordError('');
		}
	};

	const handleConfirmPasswordChange = (e) => {
		const newConfirmPassword = e.target.value;
		setConfirmPassword(newConfirmPassword);
		if (newConfirmPassword !== password) {
			setConfirmPasswordError('Passwords do not match');
		} else {
			setConfirmPasswordError('');
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		const passwordErrors = validatePassword(password);
		if (!validateEmail(email)) {
			setEmailError('Please enter a valid email address');
			setLoading(false);
			return;
		}

		if (passwordErrors.length > 0) {
			setPasswordError(passwordErrors);
			setLoading(false);
			return;
		}

		if (password !== confirmPassword) {
			setConfirmPasswordError('Passwords do not match');
			setLoading(false);
			return;
		}

		try {
			const result = await register(email, password);

			if (result.success) {
				if (result.needsProfile) {
					navigate('/profile-form');
				} else {
					navigate('/login');
				}
			} else {
				setPasswordError([result.message || 'Registration failed']);
			}
		} catch (error) {
			console.error('Registration error:', error);
			setPasswordError([error.response?.data?.message || 'Registration failed']);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="registration-container">
			<form className="registration-form" onSubmit={handleSubmit}>
				<h2>Volunteer Registration</h2>

				<div className="form-group">
					<label htmlFor="email">Email:</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={handleEmailChange}
						required
					/>
					{emailError && <div className="error-message">{emailError}</div>}
				</div>

				<div className="form-group">
					<label htmlFor="password">Password:</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={handlePasswordChange}
						required
					/>
					{passwordError && Array.isArray(passwordError) && passwordError.map((error, index) => (
						<div key={index} className="error-message">{error}</div>
					))}
				</div>

				<div className="form-group">
					<label htmlFor="confirm-password">Confirm Password:</label>
					<input
						type="password"
						id="confirm-password"
						value={confirmPassword}
						onChange={handleConfirmPasswordChange}
						required
					/>
					{confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
				</div>

				<button
					type="submit"
					className="register-button"
					disabled={loading || !!emailError || !!passwordError || !!confirmPasswordError}
				>
					{loading ? 'Registering...' : 'Register'}
				</button>
			</form>
		</div>
	);
};

export default RegistrationPage;