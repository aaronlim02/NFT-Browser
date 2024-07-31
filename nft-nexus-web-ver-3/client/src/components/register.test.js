import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Register from './register';

// mock axios
jest.mock('axios');

describe('Register Component', () => {
  beforeEach(() => {
    // Mock the alert function before each test
    window.alert = jest.fn();
  });

  afterEach(() => {
    // Restore the original alert function after each test
    jest.restoreAllMocks();
  });

  it('renders the Register form', () => {
    render(<Register />);
    expect(screen.getByRole('heading', { level: 1, name: 'Register' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('allows user to type in input fields', () => {
    render(<Register />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });
    expect(screen.getByPlaceholderText('Username').value).toBe('testuser');
    expect(screen.getByPlaceholderText('Password').value).toBe('password');
  });

  it('registers a user successfully', async () => {
    axios.post.mockResolvedValue({ status: 201 });

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration successful, please proceed to login');
    });
  });

  it('handles 409 conflict error', async () => {
    axios.post.mockRejectedValue({ response: { status: 409 } });

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('User already exists! Please try a different username.');
    });
  });

  it('handles 500 server error', async () => {
    axios.post.mockRejectedValue({ response: { status: 500 } });

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration failed, please try again later.');
    });
  });

  it('handles backend server not responding', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    render(<Register />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('The backend server is not running. Please ensure it is running.');
    });
  });
});