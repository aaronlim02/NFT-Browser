import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, isAuthenticated } from '../utils/auth';
import Dashboard from './account/dashboard';
import Owned_NFTs from './account/owned-nfts';
import Galleries from './account/galleries';
import Settings from './account/settings';
import Watchlist from './account/watchlist';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

const Account = () => {
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState(null);
  const navigate = useNavigate();
  const [content, setContent] = useState('home');
  const { setDynamicTheme } = useContext(ThemeContext); // Use ThemeContext

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const token = getToken();
        const response = await axios.get('http://localhost:5000/api/account', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setAddress(response.data.address);
        setDynamicTheme(response.data.lightDarkMode); // Set theme dynamically
      } catch (error) {
        console.error('Failed to fetch user data', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate, setDynamicTheme]);

  if (!user) return <div>Loading...</div>;

  const RenderContent = () => {
    switch (content) {
      case 'dashboard':
        return <Dashboard walletAddress={address} />;
      case 'owned-nfts':
        return <Owned_NFTs walletAddress={address} />;
      case 'watchlist':
        return <Watchlist />;
      case 'galleries':
        return <Galleries />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard walletAddress={address} />;
    }
  };

  return (
    <main>
      <div className="account-header">
        <div className="account-basic-info">
          <h1 className="account-info">Welcome, {user.username ? user.username : '<undefined>'}!</h1>
          <p className="account-wallet">Address: {address ? address : 'Not Set'}</p>
        </div>
        <button className="account-buttons" onClick={() => setContent('dashboard')}>Account Dashboard</button>
        <button className="account-buttons" onClick={() => setContent('owned-nfts')}>Owned NFTs</button>
        <button className="account-buttons" onClick={() => setContent('watchlist')}>Watchlist</button>
        <button className="account-buttons" onClick={() => setContent('galleries')}>Galleries</button>
        <button className="account-buttons" onClick={() => setContent('settings')}>Settings</button>
      </div>
      <div className="content">
        <RenderContent />
      </div>
    </main>
  );
};

export default Account;