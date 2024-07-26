import React, { useState, useEffect, useCallback, useRef } from 'react';
import { walletStats } from '../../utils/api';
import { isValidWalletAddress } from '../../utils/otherutils';

const Dashboard = (walletAddress) => {

  const [output, setOutput] = useState({});
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  const handleProcessData = async () => {
    try {
      if (isValidWalletAddress(walletAddress.walletAddress)) {
        const response = await walletStats(walletAddress);
        setOutput(response.output);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  }

  useEffect(() => {
    // Function to fetch data from the API
    const fetchData = async () => {
      if (!fetchDataCalledRef.current) {
        fetchDataCalledRef.current = true;
        try {
          handleProcessData();
        } catch (err) {
          setOutput({error: 'true', msg: err});
        }
      };
    }
    fetchData();
  }, [handleProcessData]);

  return (
    <div className="dashboard">
    <h2>Overview </h2>
    {isValidWalletAddress(walletAddress.walletAddress) ? 
      <p>ETH Balance: {Number(output)} ETH </p> : 
      <p>ETH Balance: Please input valid wallet address in settings! </p>}
  </div>
  )
}

export default Dashboard;