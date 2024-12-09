import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Routes/ProtectedRoute';
import AdminRoute from './components/Routes/AdminRoute';
import Home from './components/Main/Home';
import Taskbar from './components/Main/Taskbar';
import Calendar from './components/Events/Calendar';
import EventManagementForm from './components/Events/EventManagementForm';
import VolunteerMatchForm from './components/Events/VolunteerMatchingForm';
import Profile from './components/Profile/Dashboard';
import ProfileForm from './components/Profile/ProfileForm';
import Registration from './components/Authentication/RegistrationPage';
import LoginPage from './components/Authentication/LoginPage';
import AdminLoginPage from './components/Authentication/AdminLoginPage';
import VolunteerHistory from './components/Profile/VolunteerHistory';
import NotificationDisplay from './components/Notifications/NotificationDisplay';
import Reports from './components/Events/Reports';
import './App.css'

function App() {
	return (
		<AuthProvider>
			<Router>
				<div>
					<Taskbar />
					<Routes>
						<Route path="/" element={<Navigate to="/home" />} />
						<Route path="/home" element={<Home />} />
						<Route path="/calendar" element={<Calendar />} />

						{/* Auth Routes */}
						<Route path="/register" element={<Registration />} />
						<Route path="/login" element={<LoginPage />} />
						<Route path="/admin-login" element={<AdminLoginPage />} />

						{/* Protected Routes - Require Authentication */}
						<Route element={<ProtectedRoute />}>
							<Route path="/profile" element={<Navigate to="/manage-profile" />} />
							<Route path="/manage-profile" element={<Profile />} />
							<Route path="/volunteer-history" element={<VolunteerHistory />} />
							<Route path="/notifications" element={<NotificationDisplay />} />
						</Route>

						{/* Admin Routes */}
						<Route element={<AdminRoute />}>
							<Route path="/event-management" element={<EventManagementForm />} />
							<Route path="/volunteer-event-match" element={<VolunteerMatchForm />} />
							<Route path="/reports" element={<Reports />} />
						</Route>

						{/* Profile Completion Route */}
						<Route path="/profile-form" element={<ProfileForm />} />
					</Routes>
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;