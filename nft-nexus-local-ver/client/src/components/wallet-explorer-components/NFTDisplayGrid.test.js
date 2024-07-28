import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NFTDisplayGrid from './NFTDisplayGrid'; // Update the import path if needed

describe('NFTDisplayGrid Component', () => {
  test('renders "null" message when content is null', () => {
    render(<NFTDisplayGrid content={null} mode="default" onAddToGalleryClick={jest.fn()} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  test('renders "invalid input" message when content is "400"', () => {
    render(<NFTDisplayGrid content="400" mode="default" onAddToGalleryClick={jest.fn()} />);
    expect(screen.getByText('invalid input')).toBeInTheDocument();
  });

  test('renders "Internal server error" message when content is "500"', () => {
    render(<NFTDisplayGrid content="500" mode="default" onAddToGalleryClick={jest.fn()} />);
    expect(screen.getByText('Internal server error. Please try again later.')).toBeInTheDocument();
  });

  test('renders "No NFTs found" message when content is an empty array', () => {
    render(<NFTDisplayGrid content={[]} mode="default" onAddToGalleryClick={jest.fn()} />);
    expect(screen.getByText('No NFTs found')).toBeInTheDocument();
  });

  test('renders NFT items correctly when content is a non-empty array and mode is "default"', () => {
    const mockData = [
      ['NFT 1', 'Description 1', 'http://example.com/image1.png', 'collection 1', '0x1', null, 'http://example.com/1'],
      ['NFT 2', 'Description 2', 'http://example.com/image2.png', 'collection 2', '0x2', null, 'http://example.com/2']
    ];
    const mockOnAddToGalleryClick = jest.fn();

    render(<NFTDisplayGrid content={mockData} mode="default" onAddToGalleryClick={mockOnAddToGalleryClick} />);

    expect(screen.getByAltText('NFT 1')).toBeInTheDocument();
    expect(screen.getByText('NFT 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();

    expect(screen.getByAltText('NFT 2')).toBeInTheDocument();
    expect(screen.getByText('NFT 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();

    // Test button click
    fireEvent.click(screen.getAllByText('Add to Gallery')[0]);
    expect(mockOnAddToGalleryClick).toHaveBeenCalledWith(mockData[0]);
  });

  test('renders NFT items correctly when content is a non-empty array and mode is "listed"', () => {
    const mockData = [
      ['NFT 1', 'Description 1', 'http://example.com/image1.png', 'collection 1', '0x1', 0.05, 'http://example.com/1'],
      ['NFT 2', 'Description 2', 'http://example.com/image2.png', 'collection 2', '0x2', 0.1, 'http://example.com/2']
    ];
    const mockOnAddToGalleryClick = jest.fn();

    render(<NFTDisplayGrid content={mockData} mode="listed" onAddToGalleryClick={mockOnAddToGalleryClick} />);

    expect(screen.getByAltText('NFT 1')).toBeInTheDocument();
    expect(screen.getByText('NFT 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Current price: 0.05 ETH')).toBeInTheDocument();

    expect(screen.getByAltText('NFT 2')).toBeInTheDocument();
    expect(screen.getByText('NFT 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
    expect(screen.getByText('Current price: 0.1 ETH')).toBeInTheDocument();

    // Test button click
    fireEvent.click(screen.getAllByText('Add to Gallery')[0]);
    expect(mockOnAddToGalleryClick).toHaveBeenCalledWith(mockData[0]);
  });

  test('renders "Rendering error" message if an error occurs during rendering', () => {
    
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Force an error to occur in rendering
    const FaultyComponent = () => {
      throw new Error('Test error');
    };

    render(<NFTDisplayGrid content={<FaultyComponent />} mode="default" onAddToGalleryClick={jest.fn()} />);
    expect(screen.getByText('Rendering error')).toBeInTheDocument();

    console.error.mockRestore();
  });
});