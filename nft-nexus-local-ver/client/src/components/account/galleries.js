import React, { useState, useEffect, useCallback, useRef } from 'react';
import { viewWatchlist } from '../../utils/api';

const Galleries = () => {
  const [output, setOutput] = useState({});
  const fetchDataCalledRef = useRef(false); // Ref to prevent duplicate fetching

  return (
    <div>
      <h2>Galleries</h2>
      <p>This is the Galleries content.</p>
    </div>
  );
  
};

export default Galleries;