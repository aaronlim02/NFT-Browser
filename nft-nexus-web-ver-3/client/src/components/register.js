import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/register', { username, password });
      alert('Registration successful, please proceed to login');
    } catch (error) {
      if (error.response) {
        console.error('Registration error', error);
        if (error.response.status === 409) {
          alert('User already exists! Please try a different username.');
        } else {
          alert('Registration failed, please try again later.');
        }
      } else {
        alert('The server is not responding. please try again later.');
      }
    }
  };

  return (
    <div>
      <h1 className="center">Register</h1>
      <form className="center" onSubmit={handleRegister}>
        <div>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        </div>
        <div>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;