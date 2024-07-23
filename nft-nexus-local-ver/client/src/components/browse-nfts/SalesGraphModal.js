import React, { useState } from 'react';
import Modal from 'react-modal';

const SalesGraphModal = ({ isOpen, onRequestClose, heatmapSrc, scatterSrc, volumeSrc, name }) => {
  const [view, setView] = useState('heatmap');
  const [showOutlier, setShowOutlier] = useState(true);

  const handleChange = (event) => {
    setView(event.target.value);
  };

  const handleToggleOutlier = () => {
    setShowOutlier(prevShowOutlier => !prevShowOutlier);
  };

  const getCurrentSrc = (srcObj) => {
    return showOutlier ? srcObj.outlier : srcObj.noOutlier;
  };

  return (
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
      <h2>{"Sales Graph for " + name}</h2>
      <div>
        <label>
          <input
            type="radio"
            value="heatmap"
            checked={view === 'heatmap'}
            onChange={handleChange}
          />
          Show Heatmap
        </label>
        <label>
          <input
            type="radio"
            value="scatter"
            checked={view === 'scatter'}
            onChange={handleChange}
          />
          Show Scatter Plot
        </label>
        <label>
          <input
            type="radio"
            value="volume"
            checked={view === 'volume'}
            onChange={handleChange}
          />
          Show Volume Graph
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={showOutlier}
            onChange={handleToggleOutlier}
          />
          Show Outliers
        </label>
      </div>
      {view === 'heatmap' && (getCurrentSrc(heatmapSrc) ? <img src={getCurrentSrc(heatmapSrc)} alt="Heatmap" /> : <p>Loading...</p>)}
      {view === 'scatter' && (getCurrentSrc(scatterSrc) ? <img src={getCurrentSrc(scatterSrc)} alt="Scatter Plot" /> : <p>Loading...</p>)}
      {view === 'volume' && (getCurrentSrc(volumeSrc) ? <img src={getCurrentSrc(volumeSrc)} alt="Volume Graph" /> : <p>Loading...</p>)}
      <button onClick={onRequestClose}>Close</button>
    </Modal>
  );
};

export default SalesGraphModal;