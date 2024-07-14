import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { getToken } from '../../../utils/auth';

const Sidebar = ({ onSidebarClick, selectedGallery }) => {
  const [galleries, setGalleries] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGalleryDescription, setNewGalleryDescription] = useState('');

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const token = getToken();
        const response = await axios.get('http://localhost:5000/galleries/retrieve_from_account', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGalleries(response.data);
      } catch (error) {
        console.error('Error fetching galleries:', error);
      }
    };

    fetchGalleries();
  }, []);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setNewGalleryName('');
    setNewGalleryDescription('');
  };

  const handleAddGallery = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const response = await axios.post('http://localhost:5000/galleries/add', {
        name: newGalleryName,
        description: newGalleryDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGalleries([...galleries, response.data]);
      closeModal();
    } catch (error) {
      console.error('Error adding gallery:', error);
    }
  };

  return (
    <div className="sidebar">
      <h2>Galleries</h2>
      <p>{galleries.length} galleries</p>
      <div className="sidebar-buttons">
        {galleries.map(gallery => (
          <button 
            key={gallery.id} 
            onClick={() => onSidebarClick(gallery)}
            className={selectedGallery && selectedGallery.id === gallery.id ? 'selected' : ''}
          >
            {gallery.name}
          </button>
        ))}
        <button onClick={openModal}>+ Add Gallery</button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Add Gallery"
        className="sidebar-modal"
        overlayClassName="sidebar-modal-overlay"
      >
        <h2>Add Gallery</h2>
        <form onSubmit={handleAddGallery} className='sidebar-modal-form'>
          <label>
            Name:
            <input
              type="text"
              class="sidebar-modal-form-input"
              value={newGalleryName}
              onChange={(e) => setNewGalleryName(e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <input
              type="text"
              class="sidebar-modal-form-input"
              value={newGalleryDescription}
              onChange={(e) => setNewGalleryDescription(e.target.value)}
            />
          </label>
          <button type="submit" class="sidebar-modal-form-button">Add</button>
          <button type="button" class="sidebar-modal-form-button" onClick={closeModal}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
};

export default Sidebar;