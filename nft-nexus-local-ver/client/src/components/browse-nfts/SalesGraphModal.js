import React from 'react';
import Modal from 'react-modal';

const SalesGraphModal = ({ isOpen, onRequestClose, imageSrc }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    contentLabel="Sales Graph"
    style={{
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
      },
    }}
  >
    <h2>Sales Graph</h2>
    {imageSrc ? <img src={imageSrc} alt="Sales Graph" /> : <p>Loading...</p>}
    <button onClick={onRequestClose}>Close</button>
  </Modal>
);

export default SalesGraphModal;