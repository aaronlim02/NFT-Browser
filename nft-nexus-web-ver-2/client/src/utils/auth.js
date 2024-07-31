// client/src/utils/auth.js
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () => {
  const token = getToken();
  if (token) {
    const { exp } = jwtDecode(token);
    return exp * 1000 > Date.now();
  }
  return false;
};

export const login = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};