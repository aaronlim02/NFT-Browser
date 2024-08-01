import React, { useState } from 'react';
import Modal from 'react-modal';
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { getCollectionName } from '../../../utils/api';

Modal.setAppElement('#root'); // Set the app root for accessibility

const MainContent = ({ watchlistData, error, isLoading, setWatchlistData }) => {
  const [editItem, setEditItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [modalIsOpen, setIsOpen] = useState(false);
  const [newLink, setNewLink] = useState('');

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
      await axios.delete('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/watchlist/delete', {
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
        'https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/watchlist/edit',
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

  const handleAddLink = async () => {

    // try to parse url and get slug
    let slug = "";
    try {
      const url = newLink;
      const parts = url.split('/');
      console.log(parts);
      const index = parts.indexOf('collection');
      slug = parts[index + 1];
    } catch {
      alert("Invalid URL!");
      return;
    }

    const name = await getCollectionName({slug: slug})

    const token = getToken();
    try {
      const response = await axios.post('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/watchlist/add_from_nft_browser', 
        { name, slug },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Added to watchlist:', response.data);
      alert(`Added ${name} to watchlist`);
      setWatchlistData((prevData) => [...prevData, response.data]);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert(`${error.response.data.error}`);
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
      <input className="add-to-watchlist-gallery-input"
        type="text" 
        value={newLink} 
        onChange={(e) => setNewLink(e.target.value)} 
        placeholder="Enter Opensea link of the collection to add to watchlist or alternatively add from 'Browse NFTs'."
      />
      <button onClick={handleAddLink}>Add</button>
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
              <td>{item.set_price ? `Collection Floor price is below ${item.set_price} ETH` : 'Not Set'}</td>
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
        overlayClassName="modal-overlay"
      >
        <h2>Edit Notification Criteria</h2>
        <p>Input a value below. If collection floor price falls below this value, you will be notified.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleEdit();
        }}>
          <label>
            New Price (ETH):
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