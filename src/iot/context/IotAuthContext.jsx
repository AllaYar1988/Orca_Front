import { createContext, useContext, useState, useEffect } from 'react';
import { getStoredIotUser, storeIotUser, clearIotUser, iotLogout as apiLogout, isTokenExpired } from '../api/auth';

const IotAuthContext = createContext(null);

export const IotAuthProvider = ({ children }) => {
  const [iotUser, setIotUser] = useState(null);
  const [iotLoading, setIotLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredIotUser();
    if (storedUser) {
      // Check if token is expired
      if (isTokenExpired()) {
        clearIotUser();
      } else {
        setIotUser(storedUser);
      }
    }
    setIotLoading(false);
  }, []);

  // Listen for auth:logout events from axios interceptor
  useEffect(() => {
    const handleAuthLogout = (event) => {
      console.log('Auth logout event:', event.detail);
      setIotUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const iotLogin = (userData, token, expiresAt = null) => {
    setIotUser(userData);
    storeIotUser(userData, token, expiresAt);
  };

  const iotLogout = async () => {
    await apiLogout(); // Calls backend and clears localStorage
    setIotUser(null);
  };

  return (
    <IotAuthContext.Provider value={{ iotUser, iotLogin, iotLogout, iotLoading }}>
      {children}
    </IotAuthContext.Provider>
  );
};

export const useIotAuth = () => {
  const context = useContext(IotAuthContext);
  if (!context) {
    throw new Error('useIotAuth must be used within an IotAuthProvider');
  }
  return context;
};
