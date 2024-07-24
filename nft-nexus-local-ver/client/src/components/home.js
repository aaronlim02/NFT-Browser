import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCollection } from '../utils/api';

const Home = () => {
  const [output, setOutput] = useState([]);
  const [status, setStatus] = useState(null);
  const fetchDataCalledRef = useRef(false);

  const loadFeaturedNFT = useCallback(async () => {
    try {
      const data = { collection: '', cursor: null, sort: '', count: 1 };
      const response = await searchCollection(data);
      setOutput(response.output);
      console.log('Processed data:', response);
    } catch (error) {
      setStatus('500');
      console.error('Error fetching collections:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!fetchDataCalledRef.current) {
        fetchDataCalledRef.current = true;
        await loadFeaturedNFT();
      }
    };
    fetchData();
  }, [loadFeaturedNFT]);

  const scaleImgUrl = (url, width) => {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width);
    return urlObj.toString();
  }

  return (
    <main>
      <h1 align="center">NFT Nexus</h1>
      <p align="center">Find NFTs easily using this intuitive website</p>
      <div class="homepage-featured">
      {output.length > 0 && output[0].length > 5 && (
        <div className="image-container">
          <img src={scaleImgUrl(output[0][5], 1920)} alt="Collection Image" />
          <div className="overlay">
            <p class="collection-title">{output[0][0]}</p>
            <p>#1 NFT in volume</p>
            <p>({Math.round(output[0][7][1].volume)} ETH within the past 7 days)</p>
            <p>Price: {output[0][6].floor_price} ETH onwards</p>
            <a href={output[0][4]}>Get it on Opensea</a>
          </div>
        </div>
      )}
      </div>
      
    </main>
  );
};

export default Home;
