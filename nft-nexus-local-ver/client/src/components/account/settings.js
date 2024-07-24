import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, isAuthenticated } from '../../utils/auth';

const PersonalDetails = () => {
  const [yourWalletAddress, setYourWalletAddress] = useState('');
  const [lightDarkMode, setLightDarkMode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const response = await axios.post('http://localhost:5000/settings/personal-details', 
        { yourWalletAddress, lightDarkMode }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );  
      alert('Update successful');
      window.location.reload();
    } catch (error) {
      handleError(error);
    }
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post('http://localhost:5000/settings/change-password', 
        { newPassword }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );  
      alert('Update successful');
      window.location.reload();
    } catch (error) {
      handleError(error);
    }
  }

  const handleError = (error) => {
    if (error.response) {
      if (error.response.status >= 400 && error.response.status < 500) {
        alert('Invalid input');
      } else if (error.response.status >= 500 && error.response.status < 600) {
        alert('Server error, please try again later (please report this error)');
      } else {
        alert('An unexpected error occurred (with response) (please report this error)');
      }
    } else if (error.request) {
      alert('No response from server, please try again later (please report this error)');
    } else {
      alert('An unexpected error occurred (with no response) (please report this error)');
    }
    console.error('Login error', error);
  }

  return (
    <div class="settings-body">
      <form class="settings-form" onSubmit={handleSubmit}>
        <div>
          <h2>Wallet Details</h2>
          <label>Update your wallet address: </label>
          <input class="settings-input"
            type="text"
            value={yourWalletAddress}
            placeholder='(unchanged)'
            onChange={(e) => setYourWalletAddress(e.target.value)}
          />
          <h2>Appearance</h2>
          <label>Choose Light/Dark Mode: </label>
          <select
            value={lightDarkMode}
            onChange={(e) => setLightDarkMode(e.target.value)}
            >
              <option value="">(unchanged)</option>
              <option value="light">light</option>
              <option value="dark">dark</option>
          </select>
          
        </div>
        <p></p>
        <button type="submit">Submit</button>
      </form>
      <form class="settings-form" onSubmit={handleSubmitPassword}>
        <div class="settings-form-password-input">
          <h2>Password</h2>
          <label>New Password: </label>
          <input class="settings-input"
            type="password"
            value={newPassword}
            placeholder='New Password'
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <label>Confirm New Password: </label>
          <input class="settings-input"
            type="password"
            value={confirmPassword}
            placeholder='Confirm New Password'
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <p></p>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default PersonalDetails;