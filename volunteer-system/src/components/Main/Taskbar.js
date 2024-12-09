import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Taskbar.css';
import logo from '../../images/AnimalShelterLogo.png'; 

const Taskbar = () => {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin, logout } = useAuth();

    // For user specific links, non-logged in users cannot access unless logged in first
    const handleAuthenticatedLink = (event, path) => {
        if (!isLoggedIn) {
            event.preventDefault();
            navigate('/login');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDropdown = (e) => {
        e.preventDefault();
    };
    
    return (
        <nav className="navbar">
            <div className="logo-container">
                <img src={logo} alt="Logo" className="logo" />
                <span className="logo-text">Adopt-a-Companion Society</span>
            </div>
            <div className="taskbar">
                <ul>
                    <li><Link to='/home'>Home</Link></li>
                    <li><Link to='/calendar'>Calendar</Link></li>

                    {/* Events viewable only by Admin users */}
                    {isAdmin && (
                        <li className="dropdown">
                            <Link to="#" onClick={handleDropdown}>Events</Link>
                            <ul className="dropdown-content">
                                <li><Link to='/event-management'>Event Management</Link></li> 
                                <li><Link to='/volunteer-event-match' onClick={(e) => handleAuthenticatedLink(e, '/volunteer-event-match')}>Volunteer Event Match</Link></li>
                                <li><Link to='/reports'>Reports</Link></li>
                            </ul>
                        </li>
                    )}
                    
                    <li className="dropdown">
                        <Link to="#" onClick={handleDropdown}>Profile</Link>
                        <ul className="dropdown-content">
                            {!isLoggedIn && <li><Link to='/login'>Log In</Link></li>}
                            {isLoggedIn && (
                                <>
                                    <li><Link to='/manage-profile'>Manage Profile</Link></li>
                                    <li><Link to='/volunteer-history'>Volunteer History</Link></li>
                                    <li><Link to='/home' onClick={handleLogout}>Log Out</Link></li>
                                </>
                            )}
                        </ul>
                    </li>

                    <li><Link to='/notifications' onClick={(e) => handleAuthenticatedLink(e, '/notifications')}>Notifications</Link></li>
                </ul>
            </div>
        </nav>
    );
};

export default Taskbar;