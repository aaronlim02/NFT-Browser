import io from 'socket.io-client';
import { toast } from 'react-toastify';

const socket = io('http://localhost:5000');  // Ensure the port matches your Flask server

socket.on('floor-price-notification', (notification) => {
  toast.info(`New Notification: ${notification.collection_name} floor price dropped to ${notification.floor_price}`);
});

export default socket;