import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchWallet } from '../../utils/api';
import NFTDisplayGrid from '../wallet-explorer-components/NFTDisplayGrid';
import AddToGalleryModal from '../wallet-explorer-components/AddToGalleryModal';
import axios from 'axios';
import { getToken } from '../../utils/auth';

const Owned_NFTs = ({ walletAddress }) => {
  const [output, setOutput] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [mode, setMode] = useState('default');
  const [status, setStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [galleries, setGalleries] = useState([]);
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const token = getToken();
        const response = await axios.get('http://localhost:5000/galleries/retrieve_from_account', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGalleries(response.data);
      } catch (error) {
        console.error('Error fetching galleries:', error);
      }
    };

    fetchGalleries();
  }, []);

  const handleProcessData = useCallback(async (source) => {
    if (source === 'search' || source === 'load') {
      setOutput([]); // Clear the current output when initiating a new search
      setCursor(null); // Reset the cursor when initiating a new search
      setHasMore(false); // Reset hasMore when initiating a new search
      setStatus("loading");
    } else {
      setStatus('loading-more');
    }
    try {
      const data = { walletAddress, cursor, mode };
      const response = await searchWallet(data);
      console.log('Processed data:', response);
      setOutput((prevOutput) => [...prevOutput, ...response.output]);
      setCursor(response.next);
      setHasMore(response.output.length >= 100);
      setStatus("200");
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setStatus("500");
    } finally {
      setStatus("not-loading");
    }
  }, [walletAddress, cursor, mode]);

  useEffect(() => {
    const handleScroll = async () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 5 && hasMore && status === "not-loading") {
        await handleProcessData('scroll');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleProcessData, hasMore, status]);

  useEffect(() => {
    const fetchData = async () => {
      if (!fetchDataCalledRef.current) {
        fetchDataCalledRef.current = true;
        try {
          await handleProcessData('load');
        } catch (err) {
          setOutput(["error"]);
        }
      }
    };
    fetchData();
  }, [handleProcessData]); //initial load

  const handleSubmit = (e) => {
    e.preventDefault();
    handleProcessData('search');
  };

  const handleAddToGalleryClick = (nft) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  const handleAdd = (newItem, error) => {
    if (error) {
      alert(`Error: ${error}`);
    } else {
      alert(`Item ${newItem.collection_name} added successfully!`);
    }
  };

  return (
    <main>
      <p align="center">Set parameters to view your wallet:</p>
      <form className="center" onSubmit={handleSubmit}>

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
      {status === "loading" ? <p>Loading...</p> : <NFTDisplayGrid content={output} mode={mode} onAddToGalleryClick={handleAddToGalleryClick} />}
      {hasMore && (
        <div className="load-more">
          {status === "loading-more" ? <p>Loading...</p> : <p>Scroll to reveal more NFTs...</p>}
        </div>
      )}
      {selectedNFT && (
        <AddToGalleryModal
          isOpen={isModalOpen}
          onRequestClose={handleModalClose}
          nft={selectedNFT}
          galleries={galleries}
          onAdd={handleAdd}
        />
      )}
    </main>
  );
};

export default Owned_NFTs;