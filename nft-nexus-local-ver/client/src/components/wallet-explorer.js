import React, { useState, useEffect, useCallback } from 'react';
import { searchWallet } from '../utils/api';
import NFTDisplayGrid from './wallet-explorer-components/NFTDisplayGrid'
import './wallet-explorer-components/NFTDisplayGrid.css';

const WalletExplorer = () => {
  const [output, setOutput] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [mode, setMode] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  const handleProcessData = useCallback(async (source) => {
    setIsLoading(true);
    if (source === 'search') {
      if (walletAddress.length !== 42) {
        setOutput("400");
        setIsLoading(false);
        return;
      }
      setOutput([]); // Clear the current output when initiating a new search
      setCursor(null); // Reset the cursor when initiating a new search
      setHasMore(false); // Reset hasMore when initiating a new search
    }
    try {
      const data = { walletAddress, cursor, mode };
      const response = await searchWallet(data);
      console.log('Processed data:', response);
      setCursor(response.next);
      setOutput((prevOutput) => [...prevOutput, ...response.output]);
      setHasMore(response.output.length >= 100);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, cursor, mode, hasMore]);

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
    handleProcessData('search');
  };

  return (
    <main>
      <p align="center">Enter wallet address to display NFTs in a wallet: (e.g. "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")</p>
      <form className="center" onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />

        <select 
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="default">View NFTs:</option>
          <option value="every">Everything</option>
          <option value="listed">Listed NFTs only</option>
        </select>

        <button type="submit">Search</button>
      </form>
      {isLoading ? <p>Loading...</p> : <NFTDisplayGrid content={output} mode={mode} />}
      {hasMore && (
        <div className="load-more">
          <p>Scroll to reveal more NFTs...</p>
        </div>
      )}
    </main>
  );
};

export default WalletExplorer;