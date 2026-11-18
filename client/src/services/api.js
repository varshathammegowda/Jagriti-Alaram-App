import axios from 'axios';
const apiBase = import.meta.env.VITE_API_URL;

if (!apiBase) {
  throw new Error('VITE_API_URL is required. Set it to the backend API base URL ending in /api.');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' }
});
api.interceptors.request.use(config=>{const token=localStorage.getItem('jagriti_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401&&localStorage.getItem('jagriti_token')){localStorage.removeItem('jagriti_token');localStorage.removeItem('jagriti_user');window.dispatchEvent(new Event('jagriti:unauthorized'));}return Promise.reject(err);});
export default api;
