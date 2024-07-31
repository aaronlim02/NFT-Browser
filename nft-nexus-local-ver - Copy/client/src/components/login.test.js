import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Login from './login';
import { login } from '../utils/auth';
import { MemoryRouter } from 'react-router-dom';

// Mock axios and auth functions
jest.mock('axios');
jest.mock('../utils/auth', () => ({
  login: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Mock the alert function before each test
    window.alert = jest.fn();
  });

  afterEach(() => {
    // Restore the original alert function and mocks after each test
    jest.restoreAllMocks();
  });

  it('renders the Login form', () => {
    render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('allows user to type in input fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });
    expect(screen.getByPlaceholderText('Username').value).toBe('testuser');
    expect(screen.getByPlaceholderText('Password').value).toBe('password');
  });

  it('logs in successfully', async () => {
    axios.post.mockResolvedValue({ data: { token: 'fakeToken' } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'qwerty' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'asdfgh' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Login successful');
      expect(login).toHaveBeenCalledWith('fakeToken');
    });
  });

  it('handles invalid password (401 error)', async () => {
    axios.post.mockRejectedValue({ response: { status: 401 } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'qwerty' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'asdfg' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid username or password');
    });
  });

  it('handles invalid username (401 error)', async () => {
    axios.post.mockRejectedValue({ response: { status: 401 } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'qwert' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'asdfgh' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid username or password');
    });
  });

  it('handles server error (500 error)', async () => {
    axios.post.mockRejectedValue({ response: { status: 500 } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'qwerty' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'asdfgh' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Server error, please try again later (please report this error)');
    });
  });

  it('handles backend server not responding', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'qwerty' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'asdfgh' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('An unexpected error occurred (with no response) (please report this error)');
    });
  });

  it('shows an alert if username or password is missing', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please enter both username and password');
    });
  });
});