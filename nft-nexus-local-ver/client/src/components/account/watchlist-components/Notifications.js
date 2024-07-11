import React from 'react';

const Notifications = ({ notificationData, error, isLoading, setNotificationData }) => {
  if (isLoading) {
    return <div className="notification-body">Loading...</div>;
  }

  if (error) {
    return <div className="notification-body">Error: {error}</div>;
  }

  return (
    <div className="notification-body">
      <h2>Notifications</h2>
      <p>{notificationData.length} items</p>
      <table className="notification-table">
        <thead>
          <tr>
            <th>Notification</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {notificationData.map((notification) => (
            <tr key={notification.id}>
              <td>{notification.collection_name} floor price dropped to {notification.floor_price}</td>
              <td>{notification.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Notifications;