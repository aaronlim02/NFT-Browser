import React from 'react';

const MainContent = ({ watchlistData, error, isLoading }) => {
  if (isLoading) {
    return <div className="watchlist-body">Loading...</div>;
  }

  if (error) {
    return <div className="watchlist-body">Error: {error}</div>;
  }

  return (
    <div className="watchlist-body">
      <h2>My Watchlist</h2>
      <p>{watchlistData.length} items</p>
      <table className="watchlist-table">
        <thead>
          <tr>
            <th>Collection Name</th>
            <th>Notification Criteria</th>
            <th>Commands</th>
          </tr>
        </thead>
        <tbody>
          {watchlistData.map((item, index) => (
            <tr key={index}>
              <td>{item.collection_name}</td>
              <td>{item.set_price ? `Collection Floor price is below ${item.set_price} ETH` : 'Not Set'}</td>
              <td>
                <button className="edit">Edit Notification Criteria</button>
                <button className="delete">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MainContent;