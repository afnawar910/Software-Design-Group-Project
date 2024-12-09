import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = () => {
	const { isLoggedIn, isAdmin, loading } = useAuth();

	if (loading) {
		return <div>Loading...</div>;
	}

	return isLoggedIn && isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;
