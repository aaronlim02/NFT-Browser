import React from 'react';

const Sidebar = ({ onSidebarClick }) => {
  return (
    <div className="sidebar">
      <h2>Watchlist toolkit:</h2>
      <div className='sidebar-buttons'>
        <button onClick={() => onSidebarClick('add')}>Add watchlist item</button>
      </div>
    </div>
  );
};

export default Sidebar;