import axios from 'axios';
const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:5000/api`;
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||defaultApiBase,headers:{'Content-Type':'application/json'}});
api.interceptors.request.use(config=>{const token=localStorage.getItem('jagriti_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401&&localStorage.getItem('jagriti_token')){localStorage.removeItem('jagriti_token');localStorage.removeItem('jagriti_user');window.dispatchEvent(new Event('jagriti:unauthorized'));}return Promise.reject(err);});
export default api;
