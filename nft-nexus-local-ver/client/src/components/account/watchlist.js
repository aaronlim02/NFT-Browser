import React, { useState, useEffect } from 'react';
import Sidebar from './watchlist-components/Sidebar';
import MainContent from './watchlist-components/MainContent';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import './watchlist.css';

const Watchlist = () => {
  const [watchlistData, setWatchlistData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWatchlist = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        'http://localhost:5000/watchlist/retrieve_from_account',
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setWatchlistData(response.data);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      setError('Error fetching watchlist data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  return (
    <main>
      <div className="main-container">
        <Sidebar />
        <MainContent 
          watchlistData={watchlistData} 
          error={error} 
          isLoading={isLoading}
          setWatchlistData={setWatchlistData}
        />
      </div>
    </main>
  );
};

export default Watchlist;