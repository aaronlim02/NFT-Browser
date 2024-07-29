import React from 'react';

const Sidebar = ({ onSidebarClick }) => {
  return (
    <div className="sidebar">
      <h2>Contents</h2>
      <div className='sidebar-buttons'>
        <button onClick={() => onSidebarClick('Homepage')}>Homepage</button>
        <button onClick={() => onSidebarClick('IntroNFT')}>Intro to NFTs</button>
        <button onClick={() => onSidebarClick('BuySell')}>Buying and selling NFTs</button>
        <button onClick={() => onSidebarClick('Website')}>How to use this website</button>
      </div>
    </div>
  );
};

export default Sidebar;