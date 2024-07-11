import React, { useState, useEffect } from 'react';
import Sidebar from './watchlist-components/Sidebar';
import MainContent from './watchlist-components/MainContent';
import Notifications from './watchlist-components/Notifications';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import './watchlist.css';

const Watchlist = () => {
  const [watchlistData, setWatchlistData] = useState([]);
  const [notificationData, setNotificationData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('watchlist');

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      const response = await axios.get(
        'http://localhost:5000/watchlist/retrieve_from_account',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWatchlistData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      setError('Error fetching watchlist data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      const response = await axios.get(
        'http://localhost:5000/notifications/retrieve_from_account',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotificationData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching notification data:', error);
      setError('Error fetching notification data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (currentView === 'watchlist') {
      loadWatchlist();
    } else if (currentView === 'notifications') {
      loadNotifications();
    }
  }, [currentView]);

  const renderContent = () => {
    if (currentView === 'watchlist') {
      return (
        <MainContent
          watchlistData={watchlistData}
          error={error}
          isLoading={isLoading}
          setWatchlistData={setWatchlistData}
        />
      );
    } else if (currentView === 'notifications') {
      return (
        <Notifications
          notificationData={notificationData}
          error={error}
          isLoading={isLoading}
          setNotificationData={setNotificationData}
        />
      );
    }
  };

  return (
    <main>
      <div className="main-container">
        <Sidebar onSidebarClick={setCurrentView} />
        {renderContent()}
      </div>
    </main>
  );
};

export default Watchlist;