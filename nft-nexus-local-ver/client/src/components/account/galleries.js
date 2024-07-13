import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './galleries-components/Sidebar';
import MainContent from './galleries-components/Maincontent';
import './galleries.css';

const Galleries = () => {
  const [output, setOutput] = useState({});
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  return (
    <main>
      <div className="main-container">
        <Sidebar/>
        <MainContent/>
      </div>
    </main>
  );
  
};

export default Galleries;