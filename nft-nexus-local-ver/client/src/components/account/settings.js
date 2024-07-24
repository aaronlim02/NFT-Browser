import React, { useState } from 'react';
import Sidebar from './settings-components/Sidebar';
import MainContent from './settings-components/MainContent';

const Settings = () => {

  const [selectedContent, setSelectedContent] = useState('pd');

  const handleSidebarClick = (content) => {
    setSelectedContent(content);
  }

  return (
    <main>
      <div class="main-container">
        <Sidebar onSidebarClick={handleSidebarClick} />
        <MainContent content={selectedContent} />
      </div>
    </main>
  )
  
};

export default Settings;