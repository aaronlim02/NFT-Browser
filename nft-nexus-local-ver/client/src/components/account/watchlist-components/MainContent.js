import React, { useState } from 'react';
import Modal from 'react-modal';
import { getToken } from '../../../utils/auth';
import axios from 'axios';

Modal.setAppElement('#root'); // Set the app root for accessibility

const MainContent = ({ watchlistData, error, isLoading, setWatchlistData }) => {
  const [editItem, setEditItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [modalIsOpen, setIsOpen] = useState(false);

  const openModal = (item) => {
    setEditItem(item);
    setNewPrice(item.set_price || '');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditItem(null);
    setNewPrice('');
  };

  const handleDelete = async (id) => {
    try {
      const token = getToken();
      await axios.delete('http://localhost:5000/watchlist/delete', {
        data: { id: id },
        headers: { Authorization: `Bearer ${token}` },
      });;
      setWatchlistData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting watchlist item:', error);
    }
  };

  const handleEdit = async () => {
    if (!editItem) return;
    try {
      const token = getToken();
      const response = await axios.put(
        'http://localhost:5000/watchlist/edit',
        { id: editItem.id, set_price: newPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWatchlistData((prevData) =>
        prevData.map((item) => (item.id === editItem.id ? response.data : item))
      );
      closeModal();
    } catch (error) {
      console.error('Error editing watchlist item:', error);
    }
  };

  if (isLoading) {
    return <div className="watchlist-body">Loading...</div>;
  }

  if (error) {
    return <div className="watchlist-body">Error: {error}</div>;
  }

  return (
    <div className="watchlist-body">
      <h2>My Watchlist</h2>
      <p>{watchlistData.length} items</p>
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Collection Name</th>
            <th>Notification Criteria</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {watchlistData.map((item) => (
            <tr key={item.id}>
              <td>{item.collection_name}</td>
              <td>{item.set_price ? `Collection Floor price is below ${item.set_price} ETH` : 'N/A'}</td>
              <td>
                <button className="delete" onClick={() => handleDelete(item.id)}>Delete</button>
                <button className="edit" onClick={() => openModal(item)}>Edit Notification Criteria</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Notification Criteria"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Edit Notification Criteria</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleEdit();
        }}>
          <label>
            New Price:
            <input
              type="text"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={closeModal}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
};

export default MainContent;