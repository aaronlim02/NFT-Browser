  import React, { useEffect, useState } from 'react';
  import axios from 'axios';
  import { useNavigate } from 'react-router-dom';
  import { getToken, isAuthenticated } from '../utils/auth';
  import Dashboard from './account/dashboard';
  import Owned_NFTs from './account/owned-nfts';
  import Galleries from './account/galleries';
  import Settings from './account/settings';
  import Watchlist from './account/watchlist';

  const Account = () => {
    const [user, setUser] = useState(null);
    const [address, setAddress] = useState(null);
    const navigate = useNavigate();
    const [content, setContent] = useState('home');

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
        } catch (error) {
          console.error('Failed to fetch user data', error);
          navigate('/login');
        }
      };

      fetchUserData();
    }, [navigate]);

    if (!user) return <div>Loading...</div>;

    const RenderContent = () => {
      switch (content) {
        case 'dashboard':
          return <Dashboard walletAddress={address} />;
        case 'owned-nfts':
          return <Owned_NFTs walletAddress={address} />;
        case 'watchlist':
          return <Watchlist />
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
        <div class="account-header">
          <div class="account-basic-info">
            <h1 class='account-info'>Welcome, {user.username ? user.username : '<undefined>'}!</h1> {/* Display username */}
            <p class='account-wallet'>Address: {address ? address : 'Not Set'}</p>
          </div>
          <button class='account-buttons' onClick={() => setContent('dashboard')}>Account Dashboard</button>
          <button class='account-buttons' onClick={() => setContent('owned-nfts')}>Owned NFTs</button>
          <button class='account-buttons' onClick={() => setContent('watchlist')}>Watchlist</button>
          <button class='account-buttons' onClick={() => setContent('galleries')}>Galleries</button>
          <button class='account-buttons' onClick={() => setContent('settings')}>Settings</button>
        </div>
        <div class="content">
          <RenderContent />
        </div>
      </main>
    );
  };

export default Account;