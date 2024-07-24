import React, { useState, useEffect, useCallback, useRef } from 'react';
import CollectionDisplay from './browse-nfts/CollectionDisplay'
import { searchCollection } from '../utils/api';

const Browse = () => {
  const [output, setOutput] = useState([]);
  const [collection, setCollection] = useState('');
  const cursorRef = useRef(null); // Ref to keep track of the cursor
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState('');
  const [interval, setInterval] = useState('1');
  const [resultsType, setResultsType] = useState('load');
  const [status, setStatus] = useState(null);
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  const handleProcessData = useCallback(async (source) => {
    if (source === 'search' || source === 'load') {
      setResultsType(source);
      setOutput([]); // Clear the current output when initiating a new search
      cursorRef.current = null; // Reset the cursor when initiating a new search
      setHasMore(false); // Reset hasMore when initiating a new search
      setStatus('loading');
    } else {
      setStatus('loading-more');
    }
    try {
      const data = { collection, cursor: cursorRef.current, sort, count: 20 };
      const response = await searchCollection(data);
      console.log('Processed data:', response);
      if (source === 'search' || source === 'load') {
        setOutput((prevOutput) => [...prevOutput, ...response.output]);
      } else {
        setOutput((prevOutput) => [...prevOutput, ...response.output.slice(1)]);
      }
      cursorRef.current = response.next; // Update the cursor reference
      console.log(response.next);
      setHasMore(response.next !== null);
      setStatus('200');
    } catch (error) {
      setStatus('500');
      console.error('Error fetching collections:', error);
    }
  }, [collection, sort, hasMore, resultsType, status]);

  useEffect(() => {
    // Function to fetch data from the API
    const fetchData = async () => {
      if (!fetchDataCalledRef.current) {
        fetchDataCalledRef.current = true;
        try {
          handleProcessData('load');
        } catch (err) {
          setOutput(["error"]);
        }
      };
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      // Check if the user has scrolled to the bottom of the page
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || !hasMore) return;
      
      // If the user has scrolled to the bottom and there are more NFTs to load, load more NFTs
      if (status === '200') {
        await handleProcessData('scroll');
      }
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
      <div class="header">
        <form className="center" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Type to search collections or leave empty to search all..."
            value={collection}
            onChange={(e) => {
                setCollection(e.target.value);
                setHasMore(false);
              }
            }
          />
          <select 
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setHasMore(false);
            }
          }
        >
          <option value="">Select sort... (only works with search-all)</option>
          <option value="market_cap">Market Cap</option>
          <option value="num_owners">Number of Owners</option>
          <option value="one_day_change">1-Day Change</option>
          <option value="seven_day_change">7-Day Change</option>
          <option value="seven_day_volume">7-Day Volume</option>
        </select>
          <button type="submit" 
          disabled={status === "loading" || status === "loading-more"}>
            Search
          </button>
        </form>
        <div class="interval">
          <p>Select interval:</p>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="1">1 day</option>
            <option value="7">7 day</option>
            <option value="30">30 day</option>
          </select>
        </div>
      </div>
      
      <CollectionDisplay content={output} interval={interval} resultsType={resultsType} status={status}/>
      {hasMore && (
      <div className="load-more">
        {status === "loading-more" ? <p>Loading...</p> : <p>Scroll to reveal more collections...</p>}
      </div>
      )}
    </main>
  );
};

export default Browse;