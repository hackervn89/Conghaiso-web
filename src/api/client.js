import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Địa chỉ của server backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
