import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { getToken } from '../../utils/auth';

const AddToGalleryModal = ({ isOpen, onRequestClose, nft, galleries, onAdd }) => {
  const [selectedGallery, setSelectedGallery] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const response = await axios.post(`http://localhost:5000/gallery-items/add`, {
        gallery_id: selectedGallery,
        collection_name: nft[0],
        contract_addr: nft[3],
        token_id: nft[4]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onAdd(response.data);
      onRequestClose();
    } catch (error) {
      console.error('Error adding NFT to gallery:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Add NFT to Gallery"
      className="add-to-gallery-modal"
      overlayClassName="add-to-gallery-modal-overlay"
    >
      <h2>Add NFT to Gallery</h2>
      <form onSubmit={handleAdd}>
        <label>
          Select Gallery:
          <select value={selectedGallery} onChange={(e) => setSelectedGallery(e.target.value)} required>
            <option value="" disabled>Select a gallery</option>
            {galleries.map(gallery => (
              <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
            ))}
          </select>
        </label>
        <button type="submit">Add</button>
        <button type="button" onClick={onRequestClose}>Cancel</button>
      </form>
    </Modal>
  );
};

export default AddToGalleryModal;