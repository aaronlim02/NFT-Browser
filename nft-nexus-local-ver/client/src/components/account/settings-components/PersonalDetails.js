import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, isAuthenticated } from '../../../utils/auth';

const PersonalDetails = () => {

  const [yourWalletAddress, setYourWalletAddress] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (yourWalletAddress === '') {
      alert('Please enter a value to update');
      return;
    }
    try {
      console.log(yourWalletAddress)
      const token = getToken();
      // https://nft-browser.vercel.app/settings/personal-details / http://localhost:5000/settings/personal-details
      const response = await axios.post('http://localhost:5000/settings/personal-details', 
        { yourWalletAddress }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );  
      alert('Update successful');
      window.location.reload();
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status >= 400 && error.response.status < 500) {
          alert('Invalid input');
        } else if (error.response.status >= 500 && error.response.status < 600) {
          alert('Server error, please try again later (please report this error)');
        } else {
          alert('An unexpected error occurred (with response) (please report this error)');
        }
      } else if (error.request) {
        // The request was made but no response was received
        alert('No response from server, please try again later (please report this error)');
      } else {
        // Something happened in setting up the request that triggered an Error
        alert('An unexpected error occurred (with no response) (please report this error)');
      }
      console.error('Login error', error);
    }
  }

  return (
    <div class="personal-details-body">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Update your wallet address: </label>
          <input class="your-wallet-address"
            type="text"
            value={yourWalletAddress}
            placeholder='(unchanged)'
            onChange={(e) => setYourWalletAddress(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default PersonalDetails;