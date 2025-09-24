import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Địa chỉ của server backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
