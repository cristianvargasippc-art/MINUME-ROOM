import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || '').trim();

export const getApiBaseUrl = () => API_URL;

const api = axios.create({
  // In development CRA proxy can handle relative /api requests.
  // In production, REACT_APP_API_URL can point to a dedicated backend if needed.
  baseURL: API_URL
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
