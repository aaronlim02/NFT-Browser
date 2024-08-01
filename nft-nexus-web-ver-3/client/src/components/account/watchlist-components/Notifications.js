import React from 'react';
import { getToken } from '../../../utils/auth';
import axios from 'axios';

const Notifications = ({ notificationData, error, isLoading, setNotificationData }) => {
  
  const handleDelete = async (id) => {
    try {
      const token = getToken();
      await axios.delete('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/notifications/delete', {
        data: { id: id },
        headers: { Authorization: `Bearer ${token}` },
      });;
      setNotificationData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting notification item:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const token = getToken();
      await axios.delete('https://us-central1-nft-nexus-5e707.cloudfunctions.net/api/notifications/delete-all', {
        headers: { Authorization: `Bearer ${token}` },
      });;
      setNotificationData([]);
    } catch (error) {
      console.error('Error deleting all notification items:', error);
    }
  };

  if (isLoading) {
    return <div className="notification-body">Loading...</div>;
  }

  if (error) {
    return <div className="notification-body">Error: {error}</div>;
  }

  return (
    <div className="notification-body">
      <h2>Notifications</h2>
      <div className="notification-sub-header">
        <p>{notificationData.length} items</p>
        <button className="delete" onClick={() => handleDeleteAll()}>Delete All</button>
      </div>
      
      <table className="notification-table">
        <thead>
          <tr>
            <th>Notification</th>
            <th>First Created</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notificationData.map((notification) => (
            <tr key={notification.id}>
              <td>{notification.collection_name} floor price dropped to {notification.floor_price} ETH</td>
              <td>{notification.createdAt}</td>
              <td>{notification.updatedAt}</td>
              <td>
                <button className="delete" onClick={() => handleDelete(notification.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Notifications;