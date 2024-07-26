import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', { username, password });
      alert('Registration successful');
    } catch (error) {
      if (error.response) {
        console.error('Registration error', error);
        if (error.response.status === 409) {
          alert('User already exists!');
        } else {
          alert('Registration failed, please try again later.');
        }
      } else {
        alert('The backend server is not running. Please ensure it is running.');
      }
    }
  };

  return (
    <div>
      <h1 className="center">Register</h1>
      <form className="center" onSubmit={handleRegister}>
        <div>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        </div>
        <div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;