import React, { useEffect, useState } from 'react';
import { WebSocketProvider } from '../context/WebSocketContext';
import { useNetwork } from '../provider/NetworkProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';

interface WebSocketWrapperProps {
  children: React.ReactNode;
}

const WebSocketWrapper: React.FC<WebSocketWrapperProps> = ({ children }) => {
  const { isConnected } = useNetwork();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(
          AppConstant.ACCESS_TOKEN,
        );
        if (storedToken) {
          setToken(storedToken);
        } else {
          console.log('⚠️ No token found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading token:', error);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  // Wait for token fetch
  if (loading) {
    return null; // or a small loader if you want
  }

  // Always wrap with provider (even if token is null)
  return (
    <WebSocketProvider token={token || ''} isConnected={isConnected}>
      {children}
    </WebSocketProvider>
  );
};

export default WebSocketWrapper;
