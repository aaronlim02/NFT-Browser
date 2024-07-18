import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { getToken } from '../../../utils/auth';
import { loadGalleryItems } from '../../../utils/api';

const MainContent = ({ selectedGallery }) => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

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