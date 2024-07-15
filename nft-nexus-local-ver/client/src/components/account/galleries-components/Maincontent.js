import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../../utils/auth';

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
        setGalleryItems(response.data);
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
        {galleryItems.map(item => (
          <li key={item.id}>
            <p>Collection: {item.collection_name}</p>
            <p>Contract Address: {item.contract_addr}</p>
            <p>Token ID: {item.token_id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MainContent;