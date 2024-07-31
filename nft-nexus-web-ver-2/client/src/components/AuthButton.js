// client/src/components/AuthButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from '../utils/auth';

const AuthButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    isAuthenticated() ? (
      <button className="auth-button" onClick={handleLogout}>Log Out</button>
    ) : (
      <button className="auth-button" onClick={() => navigate('/login')}>Log In</button>
    )
  );
};

export default AuthButton;