import React, { useState, useEffect } from 'react';

const testImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const NFTDisplayGrid = ({ content, mode, onAddToGalleryClick }) => {
  const [images, setImages] = useState([]);

  if (content === null) {
    return (
      <p>null</p>
    )
  } else if (content === "400") {
    return (
      <p>invalid input</p>
    )
  } else if (content.length === 0) {
    return (
      <p>No NFTs found</p>
    )
  } else {
    try {
      const output = content;
      console.log(output);
      if (mode === "default" || mode === "every") {
        return (
          <div className="grid-container">
            {output.map((item, index) => (
              <div className="grid-item" key={index}>
                <div id="image-container">
                  <img src={item[2]} alt={item[0]} />
                </div>
                <h3>{item[0] ? item[0] : "<no-name>"}</h3>
                <p>{item[1]}</p>
                <a href={item[6]} target="_blank" rel="noopener noreferrer">View On Opensea</a>
                <button onClick={() => onAddToGalleryClick(item)}>Add to Gallery</button>
              </div>
            ))}
          </div>
        );
      } else if (mode === "listed") {
        return (
          <div className="grid-container">
            {output.map((item, index) => (
              <div className="grid-item" key={index}>
                <div id="image-container">
                  <img src={item[2]} alt={item[0]} />
                </div>
                <h3>{item[0] ? item[0] : "<no-name>"}</h3>
                <p>{item[1]}</p>
                <div>
                  <p>{"Current price: " + String(Math.round(item[5] * 10000) / 10000) + " ETH"}</p>
                  <a href={item[6]} target="_blank" rel="noopener noreferrer">View On Opensea</a>
                  <button onClick={() => onAddToGalleryClick(item)}>Add to Gallery</button>
                </div>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      return (
        <p>Unknown error</p>
      )
    }
  }
};

export default NFTDisplayGrid;