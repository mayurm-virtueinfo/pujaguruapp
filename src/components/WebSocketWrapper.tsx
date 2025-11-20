import React, { useEffect, useState, useRef } from 'react';
import { WebSocketProvider } from '../context/WebSocketContext';
import { useNetwork } from '../provider/NetworkProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';
import CustomeLoader from './CustomeLoader';
import { ActivityIndicator, View } from 'react-native';

interface WebSocketWrapperProps {
  children: React.ReactNode;
}

const WebSocketWrapper: React.FC<WebSocketWrapperProps> = ({ children }) => {
  const { isConnected } = useNetwork();
  const [token, setToken] = useState<string>('');
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const prevTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        console.log('🔄 [Puja WS] Loading token from storage...');
        const storedToken = await AsyncStorage.getItem(
          AppConstant.ACCESS_TOKEN,
        );
        if (storedToken) {
          console.log('✅ [Puja WS] Token found');
          setToken(storedToken);
          prevTokenRef.current = storedToken;
        } else {
          console.log('⚠️ [Puja WS] No token found in storage');
          setToken('');
          prevTokenRef.current = null;
        }
      } catch (error) {
        console.error('❌ [Puja WS] Error loading token:', error);
      } finally {
        setCredentialsLoaded(true);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const storedToken = await AsyncStorage.getItem(
          AppConstant.ACCESS_TOKEN,
        );
        if (storedToken !== prevTokenRef.current) {
          if (storedToken) {
            console.log(
              '🔄 [Puja WS] Token updated in storage — updating state',
            );
            setToken(storedToken);
            prevTokenRef.current = storedToken;
          } else {
            console.log(
              '🔄 [Puja WS] Token removed from storage — clearing state',
            );
            setToken('');
            prevTokenRef.current = null;
          }
        }
      } catch (error) {
        console.error('❌ [Puja WS] Error polling token:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!credentialsLoaded) {
    return (
      // <CustomeLoader loading={!credentialsLoaded} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <WebSocketProvider token={token}>{children}</WebSocketProvider>;
};

export default WebSocketWrapper;
