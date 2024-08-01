import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { login } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    // authentication
    if (username === '' || password === '') {
      alert('Please enter both username and password');
    }
    try {
      const response = await axios.post('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/login', { username, password });
      login(response.data.token); // Save the token
      alert('Login successful');
      navigate('/account', { state: { username } });
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status == 401) {
          alert('Invalid username or password');
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
  };

  const handleRegister = () => {
    navigate('/register');
  }

  return (
    <div>
      <h1 align="center">Login</h1>
      <form class="center" onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <div align="center">
        <button onClick={handleRegister}>Register</button>
      </div>
    </div>
  );
};

export default Login;