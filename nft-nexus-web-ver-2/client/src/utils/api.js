// client/src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001', // Adjust based on your server setup
});

export const searchWallet = async (data) => {
  try {
    const response = await api.post('/search-wallet', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const searchCollection = async (data) => {
  try {
    const response = await api.post('/search-collection', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const walletStats = async (data) => {
  try {
    const response = await api.post('/wallet-stats', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const loadGalleryItems = async (data) => {
  try {
    const response = await api.post('/load-gallery-items', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const loadSalesGraph = async (data) => {
  try {
    const response = await api.post('/sales-graph/load', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const getCollectionName = async (data) => {
  try {
    const response = await api.post('/get-collection-name', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

export const getItemName = async (data) => {
  try {
    const response = await api.post('/get-item-name', (data));
    return response.data;
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};