import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/NotificationDisplay.css';

const NotificationDisplay = () => {
  const [notifications, setNotifications] = useState([]);
  const [newUpdate, setNewUpdate] = useState('');
  const [newReminder, setNewReminder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sortedNotifications = response.data.notifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(sortedNotifications);
      setError('');
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        'http://localhost:5000/api/notifications/add',
        {
          type: 'Update',
          message: newUpdate
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(prev => [response.data.notification, ...prev]);
      setNewUpdate('');
      setError('');
    } catch (error) {
      console.error('Failed to add update:', error);
      setError('Failed to add update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.trim()) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        'http://localhost:5000/api/notifications/add',
        {
          type: 'Reminder',
          message: newReminder
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications(prev => [response.data.notification, ...prev]);
      setNewReminder('');
      setError('');
    } catch (error) {
      console.error('Failed to add reminder:', error);
      setError('Failed to add reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`http://localhost:5000/api/notifications/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(prev => prev.filter(notification => notification.id !== id));
      setError('');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setError('Failed to delete notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationClassName = (type) => {
    switch (type.toLowerCase()) {
      case 'new event':
        return 'notification-item new-event';
      case 'update':
        return 'notification-item update';
      case 'reminder':
        return 'notification-item reminder';
      default:
        return 'notification-item';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && notifications.length === 0) {
    return <div className="notification-loading">Loading notifications...</div>;
  }

  return (
    <div className="notification-display-container">
      <h2>Notifications</h2>
      
      {error && (
        <div className="notification-error">
          {error}
          <button onClick={fetchNotifications} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="admin-notification-actions">
          <h3>Create Notification</h3>
          <div className="add-notification">
            <input
              type="text"
              placeholder="Add Update Message"
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleAddUpdate}
              disabled={loading || !newUpdate.trim()}
            >
              Add Update
            </button>
          </div>
          <div className="add-notification">
            <input
              type="text"
              placeholder="Add Reminder Message"
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleAddReminder}
              disabled={loading || !newReminder.trim()}
            >
              Add Reminder
            </button>
          </div>
        </div>
      )}

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={getNotificationClassName(notification.type)}
            >
              <div className="notification-header">
                <span className="notification-type">{notification.type}</span>
                <span className="notification-date">
                  {formatDate(notification.createdAt)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="delete-notification"
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="notification-message">
                {notification.message}
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            No notifications available
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDisplay;