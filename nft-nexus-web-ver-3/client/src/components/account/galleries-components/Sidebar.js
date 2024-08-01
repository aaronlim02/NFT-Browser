import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { getToken } from '../../../utils/auth';

const Sidebar = ({ onSidebarClick, selectedGallery }) => {
  const [galleries, setGalleries] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGalleryDescription, setNewGalleryDescription] = useState('');
  const [editGallery, setEditGallery] = useState(null);
  const [deleteGallery, setDeleteGallery] = useState(null);
  const [hoveredGallery, setHoveredGallery] = useState(null);

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const token = getToken();
        const response = await axios.get('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/galleries/retrieve_from_account', {
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

  const openEditModal = (gallery) => {
    setEditGallery(gallery);
    setNewGalleryName(gallery.name);
    setNewGalleryDescription(gallery.description);
    setEditModalIsOpen(true);
  };

  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setEditGallery(null);
    setNewGalleryName('');
    setNewGalleryDescription('');
  };

  const openDeleteModal = (gallery) => {
    setDeleteGallery(gallery);
    setDeleteModalIsOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false);
    setDeleteGallery(null);
  };

  const handleAddGallery = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const response = await axios.post('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/galleries/add', {
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

  const handleEditGallery = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      console.log({newGalleryName, newGalleryDescription})
      const response = await axios.put(`https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/galleries/edit?galleryId=${editGallery.id}`, {
        name: newGalleryName,
        description: newGalleryDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedGallery = response.data;
      setGalleries(galleries.map(gallery => gallery.id === editGallery.id ? updatedGallery : gallery));
      closeEditModal();
    } catch (error) {
      console.error('Error editing gallery:', error);
    }
  };

  const handleDeleteGallery = async () => {
    try {
      const token = getToken();
      await axios.delete(`https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/galleries/delete?galleryId=${deleteGallery.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGalleries(galleries.filter(gallery => gallery.id !== deleteGallery.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting gallery:', error);
    }
  };

  return (
    <div className="sidebar">
      <h2>Galleries</h2>
      <p>{galleries.length} galleries</p>
      <div className="sidebar-buttons">
        {galleries.map(gallery => (
          <div 
            key={gallery.id} 
            className={`sidebar-button-container ${selectedGallery && selectedGallery.id === gallery.id ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredGallery(gallery.id)}
            onMouseLeave={() => setHoveredGallery(null)}
          >
            <button 
              onClick={() => onSidebarClick(gallery)}
            >
              {gallery.name}
            </button>
            {hoveredGallery === gallery.id && (
              <div className="edit-delete-buttons">
                <button onClick={() => openEditModal(gallery)}>Edit</button>
                <button onClick={() => openDeleteModal(gallery)}>Delete</button>
              </div>
            )}
          </div>
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
              className="sidebar-modal-form-input"
              value={newGalleryName}
              onChange={(e) => setNewGalleryName(e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <input
              type="text"
              className="sidebar-modal-form-input"
              value={newGalleryDescription}
              onChange={(e) => setNewGalleryDescription(e.target.value)}
            />
          </label>
          <button type="submit" className="sidebar-modal-form-button">Add</button>
          <button type="button" className="sidebar-modal-form-button" onClick={closeModal}>Cancel</button>
        </form>
      </Modal>

      <Modal
        isOpen={editModalIsOpen}
        onRequestClose={closeEditModal}
        contentLabel="Edit Gallery"
        className="sidebar-modal"
        overlayClassName="sidebar-modal-overlay"
      >
        <h2>Edit Gallery</h2>
        <form onSubmit={handleEditGallery} className='sidebar-modal-form'>
          <label>
            Name:
            <input
              type="text"
              className="sidebar-modal-form-input"
              value={newGalleryName}
              onChange={(e) => setNewGalleryName(e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <input
              type="text"
              className="sidebar-modal-form-input"
              value={newGalleryDescription}
              onChange={(e) => setNewGalleryDescription(e.target.value)}
            />
          </label>
          <button type="submit" className="sidebar-modal-form-button">Save</button>
          <button type="button" className="sidebar-modal-form-button" onClick={closeEditModal}>Cancel</button>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Gallery"
        className="sidebar-modal"
        overlayClassName="sidebar-modal-overlay"
      >
        <h2>Confirm Delete</h2>
        {deleteGallery && <p>Are you sure you want to delete the gallery "{deleteGallery.name}"?</p>}
        <button onClick={handleDeleteGallery} className="sidebar-modal-form-button">Yes</button>
        <button onClick={closeDeleteModal} className="sidebar-modal-form-button">No</button>
      </Modal>
    </div>
  );
};

export default Sidebar;