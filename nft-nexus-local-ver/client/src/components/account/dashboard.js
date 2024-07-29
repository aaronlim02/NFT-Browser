import React, { useState, useEffect, useCallback, useRef } from 'react';
import { walletStats } from '../../utils/api';
import { isValidWalletAddress } from '../../utils/otherutils';

const Dashboard = ({ walletAddress }) => {
  const [output, setOutput] = useState({});
  const [error, setError] = useState(null);
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  const handleProcessData = useCallback(async () => {
    try {
      if (walletAddress && isValidWalletAddress(walletAddress)) {
        const response = await walletStats({ walletAddress });
        setOutput(response.output);
        setError(null); // Clear any previous errors
      } else {
        setOutput({});
        setError('Please input valid wallet address in settings!');
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
      setOutput({});
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
        <p>ETH Balance: {error}</p>
      ) : (
        <p>ETH Balance: {Number(output)} ETH</p>
      )}
    </div>
  );
}

export default Dashboard;