import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCollection } from '../utils/api';

const Home = () => {
  const [output, setOutput] = useState([]);
  const [status, setStatus] = useState(null);
  const [isPythonInstalled, setIsPythonInstalled] = useState('true');
  const fetchDataCalledRef = useRef(false);

  const loadFeaturedNFT = useCallback(async () => {
    try {
      const data = { collection: '', cursor: null, sort: '', count: 1 };
      const response = await searchCollection(data);
      setOutput(response.output);
      console.log('Processed data:', response);
    } catch (error) {
      setIsPythonInstalled(false);
      console.error('Error fetching collections:', error.response);
      if (error.response) {
        setStatus('500');
        alert("An error occured while trying to load Python.")
      } else {
        setStatus('501');
      }
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

  if (isPythonInstalled) {

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

  } else {

    return (
      <main>
        <h1 align="center">NFT Nexus</h1>
        <p align="center">Find NFTs easily using this intuitive website</p>
        <div class="python-screen-of-death">
          <div class="psod-message">
            <h2>PYTHON SCREEN OF DEATH :(</h2>
            <p>If you are seeing this screen, it means that the Python server could not run properly. Python is required for most of the features in this application to function.</p>
            <h3>Issue:</h3>
            {status === "501" ? <p>Missing/Invalid Python installation / Can't connect to server</p> : <p>Internal error while trying to run Python program</p>}
            <h3>What to do:</h3>
            {status === "501" ? 
            <p>Please try again later.</p>
            : <p>It seems that you have already installed Python, however an internal server error has occured. Please try again later. If issues persist, you might want to try <a class="psod-a" href="https://www.python.org/downloads/">reinstalling Python</a> and this application.</p>}
          </div>
        </div>
        
      </main>
    );

  }

  
};

export default Home;
