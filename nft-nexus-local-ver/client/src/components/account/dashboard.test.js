import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './dashboard';
import { walletStats } from '../../utils/api';
import { isValidWalletAddress } from '../../utils/otherutils';

// Mock the API call and utility function
jest.mock('../../utils/api', () => ({
  walletStats: jest.fn()
}));
jest.mock('../../utils/otherutils', () => ({
  isValidWalletAddress: jest.fn()
}));

describe('Dashboard Component', () => {
  // Test when wallet address is valid and API returns data
  it('renders ETH balance when wallet address is valid', async () => {
    // Mock the isValidWalletAddress function
    isValidWalletAddress.mockReturnValue(true);

    // Mock the API call to return a specific response
    walletStats.mockResolvedValue({ output: 1.23 });

    // Render the Dashboard component with a valid wallet address
    render(<Dashboard walletAddress={{ walletAddress: 'valid-address' }} />);

    // Check if the ETH balance is rendered correctly
    await waitFor(() => {
      expect(screen.getByText('ETH Balance: 1.2300 ETH')).toBeInTheDocument();
    });
  });

  // Test when wallet address is invalid
  it('renders error message when wallet address is invalid', async () => {
    // Mock the isValidWalletAddress function
    isValidWalletAddress.mockReturnValue(false);

    // Render the Dashboard component with an invalid wallet address
    render(<Dashboard walletAddress={{ walletAddress: 'invalid-address' }} />);

    // Check if the error message is rendered
    await waitFor(() => {
      expect(screen.getByText('ETH Balance Fetching Error: Please input a valid wallet address in settings!')).toBeInTheDocument();
    });
  });

  // Test if API call is not made if wallet address is invalid
  it('does not call walletStats if wallet address is invalid', async () => {
    // Mock the isValidWalletAddress function
    isValidWalletAddress.mockReturnValue(false);

    // Render the Dashboard component with an invalid wallet address
    render(<Dashboard walletAddress={{ walletAddress: 'invalid-address' }} />);

    // Ensure walletStats was not called
    expect(walletStats).not.toHaveBeenCalled();
  });

  // Test if API call is made and handled correctly
  it('handles API call error gracefully', async () => {
    // Mock the isValidWalletAddress function
    isValidWalletAddress.mockReturnValue(true);

    // Mock the API call to reject with an error
    walletStats.mockRejectedValue(new Error('API Error'));

    // Render the Dashboard component with a valid wallet address
    render(<Dashboard walletAddress={{ walletAddress: 'valid-address' }} />);

    // Check if the error is logged to the console
    await waitFor(() => {
      expect(screen.getByText('ETH Balance Fetching Error: Failed to fetch data due to server error. Please try again later.')).toBeInTheDocument();
    });
  });
});