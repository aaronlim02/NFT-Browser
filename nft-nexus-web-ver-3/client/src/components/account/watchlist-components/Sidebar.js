import React from 'react';

const Sidebar = ({ onSidebarClick }) => {
  return (
    <div className="sidebar">
      <h2>View:</h2>
      <div className='sidebar-buttons'>
        <button onClick={() => onSidebarClick('watchlist')}>Watchlist</button>
        <button onClick={() => onSidebarClick('notifications')}>Notifications</button>
      </div>
    </div>
  );
};

export default Sidebar;