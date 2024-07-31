import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainContent from './MainContent';
import axios from 'axios';
import { getToken } from '../../../utils/auth';
import { getCollectionName } from '../../../utils/api';
import Modal from 'react-modal';

// Mocking the dependencies
jest.mock('axios');
jest.mock('../../../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token')
}));
jest.mock('../../../utils/api', () => ({
  getCollectionName: jest.fn(() => Promise.resolve('Fake Collection'))
}));

// Mock the Modal component
jest.mock('react-modal', () => {
  const Modal = ({ isOpen, onRequestClose, children }) => (
    isOpen ? (
      <div className="mockModal">
        <button onClick={onRequestClose}>Close</button>
        {children}
      </div>
    ) : null
  );
  Modal.setAppElement = () => null;
  return Modal;
});

describe('MainContent Component', () => {
  let setWatchlistData;

  beforeEach(() => {
    setWatchlistData = jest.fn();
  });

  test('renders watchlist data correctly', () => {
    const watchlistData = [
      { id: 1, collection_name: 'Collection 1', set_price: '0.5' },
      { id: 2, collection_name: 'Collection 2' }
    ];

    render(<MainContent watchlistData={watchlistData} error={null} isLoading={false} setWatchlistData={setWatchlistData} />);

    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('Collection 1')).toBeInTheDocument();
    expect(screen.getByText('Collection Floor price is below 0.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('Collection 2')).toBeInTheDocument();
    expect(screen.getByText('Not Set')).toBeInTheDocument();
  });

  test('shows loading state correctly', () => {
    render(<MainContent watchlistData={[]} error={null} isLoading={true} setWatchlistData={setWatchlistData} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows error state correctly', () => {
    render(<MainContent watchlistData={[]} error="An error occurred" isLoading={false} setWatchlistData={setWatchlistData} />);
    expect(screen.getByText('Error: An error occurred')).toBeInTheDocument();
  });

  test('handles adding a new item', async () => {

    axios.post.mockResolvedValueOnce({ data: { id: 3, collection_name: 'New Collection', slug: 'new-collection' } });
    const newLink = 'http://example.com/collection/new-collection';

    render(<MainContent watchlistData={[]} error={null} isLoading={false} setWatchlistData={setWatchlistData} />);

    fireEvent.change(screen.getByPlaceholderText('Enter Opensea link of the collection to add to watchlist or alternatively add from \'Browse NFTs\'.'), {
      target: { value: newLink }
    });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/watchlist/add_from_nft_browser', {
        name: 'Fake Collection',
        slug: 'new-collection'
      }, { headers: { Authorization: 'Bearer fake-token' } });
      expect(setWatchlistData).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ collection_name: 'New Collection' })
      ]));
    });
  });

  test('handles editing an item', async () => {
    axios.put.mockResolvedValueOnce({ data: { id: 1, collection_name: 'Updated Collection', set_price: '1.0' } });
    const watchlistData = [
      { id: 1, collection_name: 'Collection 1', set_price: '0.5' }
    ];

    render(<MainContent watchlistData={watchlistData} error={null} isLoading={false} setWatchlistData={setWatchlistData} />);

    fireEvent.click(screen.getByText('Edit Notification Criteria'));

    fireEvent.change(screen.getByLabelText('New Price (ETH):'), {
      target: { value: '1.0' }
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('http://localhost:5000/watchlist/edit', {
        id: 1,
        set_price: '1.0'
      }, { headers: { Authorization: 'Bearer fake-token' } });
      expect(setWatchlistData).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ set_price: '1.0' })
      ]));
    });
  });

  test('handles deleting an item', async () => {
    axios.delete.mockResolvedValueOnce({});
    const watchlistData = [
      { id: 1, collection_name: 'Collection 1' }
    ];

    render(<MainContent watchlistData={watchlistData} error={null} isLoading={false} setWatchlistData={setWatchlistData} />);

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/watchlist/delete', {
        data: { id: 1 },
        headers: { Authorization: 'Bearer fake-token' }
      });
      expect(setWatchlistData).toHaveBeenCalledWith([]);
    });
  });

  test('handles invalid URL in handleAddLink', async () => {
    global.alert = jest.fn();
    const invalidLink = 'invalid-url';

    render(<MainContent watchlistData={[]} error={null} isLoading={false} setWatchlistData={setWatchlistData} />);

    fireEvent.change(screen.getByPlaceholderText('Enter Opensea link of the collection to add to watchlist or alternatively add from \'Browse NFTs\'.'), {
      target: { value: invalidLink }
    });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Invalid URL!');
    });
  });
});