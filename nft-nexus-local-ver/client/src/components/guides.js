import React, { useState } from 'react';
import Sidebar from './guide-components/Sidebar';
import MainContent from './guide-components/MainContent';

const Guides = () => {
  const [selectedContent, setSelectedContent] = useState('Homepage');

  const handleSidebarClick = (content) => {
    setSelectedContent(content);
  };

  return (
    <main>
      <div class="main-container">
        <Sidebar onSidebarClick={handleSidebarClick} />
        <MainContent content={selectedContent} />
      </div>
    </main>
  );
};

export default Guides;