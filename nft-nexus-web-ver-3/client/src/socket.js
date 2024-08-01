import io from 'socket.io-client';
import { toast } from 'react-toastify';

const socket = io('https://nft-nexus-python-zqkaisvtdq-uc.a.run.app', {
  transports: ['websocket', 'polling'], // Ensure both transports are allowed
});  // Ensure the port matches your Flask server

socket.on('floor-price-notification', (notification) => {
  toast.info(`New Notification: ${notification.collection_name} floor price dropped to ${notification.floor_price}`);
});

export default socket;