import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../../utils/auth';
import { loadGalleryItems } from '../../../utils/api';

const MainContent = ({ selectedGallery }) => {
  const [galleryItems, setGalleryItems] = useState([]);

  useEffect(() => {
    if (!selectedGallery) return;
    
    const fetchGalleryItems = async () => {
      try {
        const token = getToken();
        const id = selectedGallery.id;
        const response = await axios.get(`http://localhost:5000/gallery-items/view?galleryId=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);
        if (response.data.length > 0) {
          const processedResponse = await loadGalleryItems(response.data);
          setGalleryItems(processedResponse.output);
        }
        console.log(galleryItems);
      } catch (error) {
        console.error('Error fetching gallery items:', error);
      }
    };

    fetchGalleryItems();
  }, [selectedGallery]);

  if (!selectedGallery) {
    return <div className="galleries-body">Select a gallery to view its content</div>;
  }

  return (
    <div className="galleries-body">
      <h2>{selectedGallery.name}</h2>
      <p>{selectedGallery.description}</p>
      <p>{galleryItems.length} Items</p>
      <ul>
        {galleryItems.map((item, index) => (
          <li key={index}>
            <p>Name: {item[0]}</p>
            <p>Collection: {item[1]}</p>
            <p>
              Image: <img src={item[2]} alt={item[0]} style={{ maxWidth: '100px', maxHeight: '100px' }} />
            </p>
            <p>Contract Address: {item[3]}</p>
            <p>Token ID: {item[4]}</p>
            <p>
              <a href={item[5]} target="_blank" rel="noopener noreferrer">
                View on OpenSea
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MainContent;