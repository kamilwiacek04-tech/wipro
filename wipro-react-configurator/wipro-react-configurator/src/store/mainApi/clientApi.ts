import axios from 'axios';
import { clientStore } from '@/store/zustand/clientStore';

const clientApi = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL ?? 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

clientApi.interceptors.request.use((config) => {
  const token = clientStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default clientApi;
