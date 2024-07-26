import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { getToken } from '../../../utils/auth';
import { loadGalleryItems, getItemName } from '../../../utils/api';

const MainContent = ({ selectedGallery }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [newLink, setNewLink] = useState('');

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
        } else {
          setGalleryItems([]);  // Clear gallery items if the response is empty
        }
      } catch (error) {
        console.error('Error fetching gallery items:', error);
      }
    };

    fetchGalleryItems();
  }, [selectedGallery]);

  const openDeleteModal = (item) => {
    setDeleteItem(item);
    setDeleteModalIsOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false);
    setDeleteItem(null);
  };

  const handleAddLink = async () => {

    // try to parse url and get slug
    let contract_addr = "";
    let token_id = "";
    try {
      const url = newLink;
      const parts = url.split('/');
      console.log(parts);
      const index = parts.indexOf('ethereum');
      contract_addr = parts[index + 1];
      token_id = parts[index + 2];
    } catch {
      alert("Invalid URL!");
      return;
    }

    let collection_name = "";
    try {
      collection_name = await getItemName({contract: contract_addr, item_id: token_id});
    } catch (error) {
      console.error('Error getting item name:', error);
      alert(`${error}`);
    }      

    const token = getToken();
    try {
      const gallery_id = selectedGallery.id;
      const response = await axios.post('http://localhost:5000/gallery-items/add', 
        { gallery_id, contract_addr, token_id, collection_name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Added to gallery:', response.data);

      // Load new item details
      const newItem = await loadGalleryItems([response.data]);
      setGalleryItems((prevData) => [...prevData, newItem.output[0]]);

      alert(`Added ${collection_name} to gallery`);
    } catch (error) {
      console.error('Error adding to gallery:', error);
      alert(`${error.response.data.error}`);
    }
  };

  const handleDeleteItem = async () => {
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/gallery-items/delete?itemId=${deleteItem[0]}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGalleryItems(galleryItems.filter(item => item[0] !== deleteItem[0]));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
    }
  };

  if (!selectedGallery) {
    return <div className="galleries-body">Select a gallery to view its content</div>;
  }

  return (
    <div className="galleries-body">
      <h2>{selectedGallery.name}</h2>
      <p>{selectedGallery.description}</p>
      <p>{galleryItems.length} Items</p>
      <input className="add-to-watchlist-gallery-input"
        type="text" 
        value={newLink} 
        onChange={(e) => setNewLink(e.target.value)} 
        placeholder="Enter Opensea link of the NFT to add to gallery or alternatively add from 'Wallet Explorer' or 'Owned NFTs'."
      />
      <button onClick={handleAddLink}>Add</button>
      <div className="gallery-grid-container">
        {galleryItems.map((item, index) => (
          <div className="gallery-grid-item" key={index}>
            <div id="image-container">
              <img src={item[3]} alt={item[1]} />
            </div>
            <h3>{item[1] ? item[1] : "<no-name>"}</h3>
            <p>{item[2]}</p>
            <a href={item[6]} target="_blank" rel="noopener noreferrer">View On Opensea</a>
            <button onClick={() => openDeleteModal(item)}>Delete</button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Confirm Delete"
        className="gallery-modal"
        overlayClassName="gallery-modal-overlay"
      >
        <h2>Confirm Delete</h2>
        {deleteItem && <p>Are you sure you want to delete the item "{deleteItem[1]}"?</p>}
        <button onClick={handleDeleteItem} className="gallery-modal-form-button">Yes</button>
        <button onClick={closeDeleteModal} className="gallery-modal-form-button">No</button>
      </Modal>
    </div>
  );
};

export default MainContent;