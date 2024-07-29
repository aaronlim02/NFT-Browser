import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Results from './CollectionDisplay';
import axios from 'axios';
import { getToken, isAuthenticated } from '../../utils/auth';
import { loadSalesGraph } from '../../utils/api';
import SalesGraphModal from './SalesGraphModal';

// Mocking dependencies
jest.mock('axios');
jest.mock('../../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token'),
  isAuthenticated: jest.fn(() => true),
}));
jest.mock('../../utils/api', () => ({
  loadSalesGraph: jest.fn(() => Promise.resolve({
    heatmap: 'fake-heatmap',
    scatter: 'fake-scatter',
    volume: 'fake-volume',
    heatmap_no_outlier: 'fake-heatmap-no-outlier',
    scatter_no_outlier: 'fake-scatter-no-outlier',
    volume_no_outlier: 'fake-volume-no-outlier'
  })),
}));

// Mocking Modal
jest.mock('./SalesGraphModal', () => (props) => (
  <div>
    <h1>Mocked Modal</h1>
    {props.isOpen && <div>Modal Content</div>}
  </div>
));

describe('Settings Component', () => {

  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(axios, 'post').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state', () => {
    render(<Results content={[]} interval="1" resultsType="load" status="loading" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders error messages based on status', () => {
    const statuses = {
      '400': 'invalid input',
      '500': 'Internal server error. Please try again later.',
    };

    Object.entries(statuses).forEach(([status, message]) => {
      render(<Results content={[]} interval="1" resultsType="load" status={status} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  test('fetches and displays sales graph on button click', async () => {
    render(
      <Results
        content={[
          ['Item 1', 'slug1', 'image1', 'link1', 'collection1', 'type1', { floor_price: 1, market_cap: 1 }, [{ sales: 10, volume: 20, volume_change: 0.5 }]],
        ]}
        interval="1"
        resultsType="load"
        status="success"
      />
    );

    fireEvent.click(screen.getByText('View'));

    await waitFor(() => {
      expect(screen.getByText('Mocked Modal')).toBeInTheDocument();
    });
  });

  test('adds item to watchlist', async () => {
    render(
      <Results
        content={[
          ['Item 1', 'slug1', 'image1', 'link1', 'collection1', 'type1', { floor_price: 1, market_cap: 1 }, [{ sales: 10, volume: 20, volume_change: 0.5 }]],
        ]}
        interval="1"
        resultsType="load"
        status="success"
      />
    );

    fireEvent.click(screen.getAllByText('Add')[0]);

    await waitFor(() => {
      // Check if isAuthenticated was called
      expect(isAuthenticated).toHaveBeenCalled();
      // Check if getToken was called
      expect(getToken).toHaveBeenCalled();
      // Check if axios.post was called with the correct arguments
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/watchlist/add_from_nft_browser',
        { name: 'Item 1', slug: 'slug1' },
        { headers: { Authorization: 'Bearer fake-token' } }
      );
      // Check if the alert was called with the correct message
      expect(window.alert).toHaveBeenCalledWith('Added Item 1 to watchlist');
    });
  });

  test('handles error when adding to watchlist', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Error adding to watchlist' } }
    });

    render(
      <Results
        content={[
          ['Item 1', 'slug1', 'image1', 'link1', 'collection1', 'type1', { floor_price: 1, market_cap: 1 }, [{ sales: 10, volume: 20, volume_change: 0.5 }]],
        ]}
        interval="1"
        resultsType="load"
        status="success"
      />
    );

    fireEvent.click(screen.getAllByText('Add')[0]);

    await waitFor(() => {
      // Check if isAuthenticated was called
      expect(isAuthenticated).toHaveBeenCalled();
      // Check if getToken was called
      expect(getToken).toHaveBeenCalled();
      // Check if the alert was called with the correct error message
      expect(window.alert).toHaveBeenCalledWith('Error adding to watchlist');
    });
  });

});