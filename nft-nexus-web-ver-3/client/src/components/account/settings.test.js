import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './settings';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { MemoryRouter } from 'react-router-dom';

// Mocking dependencies
jest.mock('axios');
jest.mock('../../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token')
}));

describe('Settings Component', () => {
    beforeEach(() => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks(); // Restore original implementations
    });

    test('renders component correctly', () => {
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      expect(screen.getByText('Wallet Details')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  
    test('submits personal details form successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });
  
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('(unchanged)'), {
        target: { value: '0x1234567890abcdef' }
      });
  
      fireEvent.change(screen.getByLabelText('Choose Light/Dark Mode:'), {
        target: { value: 'dark' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[0]);
  
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/settings/personal-details', 
          { yourWalletAddress: '0x1234567890abcdef', lightDarkMode: 'dark' }, 
          { headers: { Authorization: 'Bearer undefined' } }
        );
        expect(window.alert).toHaveBeenCalledWith('Update successful');
      });
    });
  
    test('handles error during personal details submission', async () => {
      axios.post.mockRejectedValueOnce({
        response: { status: 400 }
      });
  
      global.alert = jest.fn();
      
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('(unchanged)'), {
        target: { value: '0x1234567890abcdef' }
      });
  
      fireEvent.change(screen.getByLabelText('Choose Light/Dark Mode:'), {
        target: { value: 'dark' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[0]);
  
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Invalid input');
      });
    });
  
    test('submits password change form successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { success: true } });
  
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[1]);
  
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/settings/change-password', 
          { newPassword: 'newpassword123' }, 
          { headers: { Authorization: 'Bearer undefined' } }
        );
        expect(window.alert).toHaveBeenCalledWith('Update successful');
      });
    });
  
    test('shows alert if passwords do not match', () => {
      global.alert = jest.fn();
  
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), {
        target: { value: 'differentpassword' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[1]);
  
      expect(global.alert).toHaveBeenCalledWith('Passwords do not match');
    });
  
    test('handles error during password change submission', async () => {
      axios.post.mockRejectedValueOnce({
        response: { status: 500 }
      });
  
      global.alert = jest.fn();
      
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[1]);
  
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Server error, please try again later (please report this error)');
      });
    });
  
    test('handles no response from server during password change submission', async () => {
      axios.post.mockRejectedValueOnce({
        request: {}
      });
  
      global.alert = jest.fn();
      
      render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
  
      fireEvent.change(screen.getByPlaceholderText('New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.change(screen.getByPlaceholderText('Confirm New Password'), {
        target: { value: 'newpassword123' }
      });
  
      fireEvent.click(screen.getAllByText('Submit')[1]);
  
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('No response from server, please try again later (please report this error)');
      });
    });
  });