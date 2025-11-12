import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

interface WebSocketProviderProps {
  token: string;
  isConnected: boolean;
  children: ReactNode;
}

interface WebSocketContextType {
  messages: any[];
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({
  token,
  isConnected,
  children,
}: WebSocketProviderProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current) return;

    const socketURL = __DEV__
      ? `wss://dev.puja-guru.com/ws/user/updates/?token=${token}`
      : `wss://puja-guru.com/ws/user/updates/?token=${token}`;

    console.log('🔌 Connecting WebSocket:', socketURL);
    wsRef.current = new WebSocket(socketURL);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    };

    wsRef.current.onclose = e => {
      console.log('❌ WebSocket closed:', e.reason);
      setConnected(false);
      wsRef.current = null;
    };

    wsRef.current.onerror = e => {
      console.warn('⚠️ WebSocket error:', e.message);
    };

    wsRef.current.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);
        setMessages(prev => [...prev, data]);
      } catch (err) {
        console.warn('WebSocket parse error:', err);
      }
    };
  };

  useEffect(() => {
    if (isConnected) {
      console.log('🌐 Internet available, trying to connect WebSocket...');
      connect();
    } else {
      console.log('📴 Internet offline, closing WebSocket...');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setConnected(false);
      }
    }
  }, [isConnected]);

  return (
    <WebSocketContext.Provider value={{ messages, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used inside a WebSocketProvider');
  }
  return context;
};
