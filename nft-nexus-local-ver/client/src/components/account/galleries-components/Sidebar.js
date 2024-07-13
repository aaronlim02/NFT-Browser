import React from 'react';

const Sidebar = ({ onSidebarClick }) => {
  return (
    <div className="sidebar">
      <h2>Galleries</h2>
      <div className='sidebar-buttons'>
        <button>Gallery</button>
      </div>
    </div>
  );
};

export default Sidebar;