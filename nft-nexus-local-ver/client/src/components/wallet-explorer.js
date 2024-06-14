import React, { useState, useEffect, useCallback } from 'react';
import { searchWallet } from '../utils/api';
import Results from './wallet-explorer-components/results';
import NFTDisplayGrid from './wallet-explorer-components/NFTDisplayGrid'
import './wallet-explorer-components/NFTDisplayGrid.css';

const WalletExplorer = () => {
  const [output, setOutput] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleProcessData = useCallback(async (source) => {
    if (source === 'search') {
      if (walletAddress.length !== 42) {
        setOutput("400");
        return;
      }
      setOutput([]); // Clear the current output when initiating a new search
      setCursor(null); // Reset the cursor when initiating a new search
    }
    try {
      const data = { walletAddress, cursor };
      const response = await searchWallet(data);
      console.log('Processed data:', response);
      setCursor(response.next);
      setOutput((prevOutput) => [...prevOutput, ...response.output]);
      setHasMore(response.output.length >= 200);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    }
  }, [walletAddress, cursor]);

  useEffect(() => {
    const handleScroll = async () => {
      // Check if the user has scrolled to the bottom of the page
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || !hasMore) return;
      
      // If the user has scrolled to the bottom and there are more NFTs to load, load more NFTs
      await handleProcessData('scroll');
    };

    // Add the scroll event listener to the window object
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup function to remove the event listener when the component is unmounted or dependencies change
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleProcessData, hasMore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    handleProcessData('search').then(() => setIsSearching(false));
  };

  return (
    <main>
      <p align="center">Enter wallet address to display NFTs in a wallet:</p>
      <form className="center" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <NFTDisplayGrid content={output} />
      {hasMore && (
        <div className="load-more">
          <p>Scroll to reveal more NFTs...</p>
        </div>
      )}
    </main>
  );
};

export default WalletExplorer;