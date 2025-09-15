import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://conghaiso-backend.onrender.com/api', // Địa chỉ của server backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
