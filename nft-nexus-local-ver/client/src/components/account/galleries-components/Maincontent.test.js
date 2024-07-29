import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Maincontent from './Maincontent';
import axios from 'axios';
import { getToken } from '../../../utils/auth';
import { loadGalleryItems, getItemName } from '../../../utils/api';
import Modal from 'react-modal';

// Mocking dependencies
jest.mock('axios');
jest.mock('../../../utils/auth', () => ({
  getToken: jest.fn(() => 'fake-token')
}));
jest.mock('../../../utils/api', () => ({
  loadGalleryItems: jest.fn((data) => Promise.resolve({ output: data })),
  getItemName: jest.fn(() => 'Fake Collection Name')
}));

// Mocking Modal
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
    let selectedGallery;
  
    beforeEach(() => {
      selectedGallery = { id: 1, name: 'Gallery 1', description: 'A test gallery' };
    });
  
    test('renders gallery items correctly', async () => {
      const galleryItems = [
        [1, 'Item 1', 'Description 1', 'http://example.com/image1.jpg', '0x123', 'Token 1', 'http://example.com/item1'],
        [2, 'Item 2', 'Description 2', 'http://example.com/image2.jpg', '0x456', 'Token 2', 'http://example.com/item2']
      ];
  
      axios.get.mockResolvedValueOnce({ data: galleryItems });
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      await waitFor(() => {
        expect(screen.getByText('Gallery 1')).toBeInTheDocument();
        expect(screen.getByText('A test gallery')).toBeInTheDocument();
        expect(screen.getByText('2 Items')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });
  
    test('handles loading state correctly', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      await waitFor(() => {
        expect(screen.getByText('Gallery 1')).toBeInTheDocument();
        expect(screen.getByText('A test gallery')).toBeInTheDocument();
        expect(screen.getByText('0 Items')).toBeInTheDocument();
      });
    });
  
    test('handles error during fetching gallery items', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      await waitFor(() => {
        expect(screen.getByText('Gallery 1')).toBeInTheDocument();
        expect(screen.getByText('A test gallery')).toBeInTheDocument();
      });
    });
  
    test('handles adding a new gallery item', async () => {
      axios.post.mockResolvedValueOnce({ data: [3, 'New Item', 'New Description', 'http://example.com/image3.jpg', '0x789', 'Token 3', 'http://example.com/item3'] });
      const newLink = 'http://example.com/ethereum/0x789/Token3';
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      fireEvent.change(screen.getByPlaceholderText('Enter Opensea link of the NFT to add to gallery or alternatively add from \'Wallet Explorer\' or \'Owned NFTs\'.'), {
        target: { value: newLink }
      });
  
      fireEvent.click(screen.getByText('Add'));
  
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/gallery-items/add', {
          gallery_id: 1,
          contract_addr: '0x789',
          token_id: 'Token3',
          collection_name: 'Fake Collection Name'
        }, { headers: { Authorization: 'Bearer fake-token' } });
        expect(screen.getByText('New Item')).toBeInTheDocument();
      });
    });
  
    test('handles deleting a gallery item', async () => {
      const galleryItems = [
        [1, 'Item 1', 'Description 1', 'http://example.com/image1.jpg', '0x123', 'Token 1', 'http://example.com/item1']
      ];
  
      axios.get.mockResolvedValueOnce({ data: galleryItems });
      axios.delete.mockResolvedValueOnce({});
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
  
      fireEvent.click(screen.getByText('Delete'));
  
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/gallery-items/delete?itemId=1', {
          headers: { Authorization: 'Bearer fake-token' }
        });
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      });
    });
  
    test('handles invalid URL in handleAddLink', async () => {
      global.alert = jest.fn();
      const invalidLink = 'invalid-url';
  
      render(<Maincontent selectedGallery={selectedGallery} />);
  
      fireEvent.change(screen.getByPlaceholderText('Enter Opensea link of the NFT to add to gallery or alternatively add from \'Wallet Explorer\' or \'Owned NFTs\'.'), {
        target: { value: invalidLink }
      });
  
      fireEvent.click(screen.getByText('Add'));
  
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Invalid URL!');
      });
    });
  });

