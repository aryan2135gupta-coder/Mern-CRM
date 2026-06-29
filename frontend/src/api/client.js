import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mern_crm_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mern_crm_token');
      window.dispatchEvent(
        new CustomEvent('crm:session-expired', {
          detail: error.response?.data?.message || 'Session expired. Please login again.'
        })
      );
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error) => {
  return error.response?.data?.message || error.message || 'Something went wrong';
};

export default api;
