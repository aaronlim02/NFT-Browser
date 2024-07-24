import React, { useState } from 'react';
import Sidebar from './galleries-components/Sidebar';
import MainContent from './galleries-components/Maincontent';

const Galleries = () => {
  const [selectedGallery, setSelectedGallery] = useState(null);

  const handleSidebarClick = (gallery) => {
    setSelectedGallery(gallery);
  };

  return (
    <main>
      <div className="main-container">
        <Sidebar onSidebarClick={handleSidebarClick} selectedGallery={selectedGallery} />
        <MainContent selectedGallery={selectedGallery} />
      </div>
    </main>
  );
};

export default Galleries;