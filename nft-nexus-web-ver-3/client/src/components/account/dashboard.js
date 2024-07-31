import React, { useState, useEffect, useCallback, useRef } from 'react';
import { walletStats } from '../../utils/api';
import { isValidWalletAddress } from '../../utils/otherutils';

const Dashboard = ({ walletAddress }) => {
  const [output, setOutput] = useState(null); // Use null for initial state
  const [error, setError] = useState(null);
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  const handleProcessData = useCallback(async () => {
    try {
      if (walletAddress && isValidWalletAddress(walletAddress)) {
        const response = await walletStats({ walletAddress });

        if (response.error) {
          setOutput(null);
          setError(response.error);
        } else {
          setOutput(response.output);
          setError(null); // Clear any previous errors
        }
      } else {
        setOutput(null);
        setError('Please input a valid wallet address in settings!');
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
      setOutput(null);
      setError('Failed to fetch data due to server error. Please try again later.');
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!fetchDataCalledRef.current) {
      fetchDataCalledRef.current = true;
      handleProcessData();
    }
  }, [handleProcessData]);

  return (
    <div className="dashboard">
      <h2>Overview</h2>
      {error ? (
        <p style={{ color: 'red' }}>ETH Balance Fetching Error: {error}</p> // Display errors in red
      ) : (
        <p>ETH Balance: {output !== null ? `${Number(output).toFixed(4)} ETH` : 'Fetching...'} </p> // Format number to 4 decimal places
      )}
    </div>
  );
}

export default Dashboard;