import axios from 'axios';
import { API_BASE_URL } from './config';
import api from './axiosInstance';

export const iotLogin = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/user_login.php`, {
    username,
    password
  });
  return response.data;
};

export const iotLogout = async () => {
  try {
    // Call backend to invalidate token
    await api.post('/user_logout.php');
  } catch (error) {
    // Even if backend call fails, clear local storage
    console.warn('Logout API call failed:', error);
  }
  // Always clear local storage
  clearIotUser();
};

export const getStoredIotUser = () => {
  const user = localStorage.getItem('orca_iot_user');
  return user ? JSON.parse(user) : null;
};

export const storeIotUser = (user, token, expiresAt = null) => {
  localStorage.setItem('orca_iot_user', JSON.stringify(user));
  localStorage.setItem('orca_iot_token', token);
  if (expiresAt) {
    localStorage.setItem('orca_iot_token_expires', expiresAt);
  }
};

export const clearIotUser = () => {
  localStorage.removeItem('orca_iot_user');
  localStorage.removeItem('orca_iot_token');
  localStorage.removeItem('orca_iot_token_expires');
};

export const getIotToken = () => {
  return localStorage.getItem('orca_iot_token');
};

export const getTokenExpiry = () => {
  return localStorage.getItem('orca_iot_token_expires');
};

export const isTokenExpired = () => {
  const expiresAt = getTokenExpiry();
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
};
