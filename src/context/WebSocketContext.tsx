import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useNetwork } from '../provider/NetworkProvider';

interface WebSocketProviderProps {
  token: string;
  children: ReactNode;
}

interface WebSocketContextType {
  messages: any[];
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  messages: [],
  connected: false,
});

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  token,
  children,
}) => {
  const { isConnected } = useNetwork();
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manuallyClosed = useRef(false);

  /** ✅ Build WebSocket URL for PujaGuru */
  const getSocketURL = () =>
    __DEV__
      ? `wss://dev.puja-guru.com/ws/user/updates/?token=${token}`
      : `wss://puja-guru.com/ws/user/updates/?token=${token}`;

  /** ✅ Connect WebSocket */
  const connect = () => {
    if (!isConnected || !token) {
      console.log('⏸️ [Puja WS] Not connecting: missing network or token', {
        isConnected,
        hasToken: !!token,
      });
      return;
    }

    // Prevent multiple active sockets
    if (wsRef.current) {
      console.log('⚠️ [Puja WS] Already connected, skipping...');
      return;
    }

    manuallyClosed.current = false;
    try {
      const url = getSocketURL();
      console.log('🔌 [Puja WS] Connecting to', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 [Puja WS] Connected');
        setConnected(true);
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 [Puja WS] message:', data);
          setMessages(prev => [...prev, data]);
        } catch (err) {
          console.warn('⚠️ [Puja WS] parse error', err);
        }
      };

      ws.onerror = error => {
        console.log('⚠️ [Puja WS] error:', error);
      };

      ws.onclose = e => {
        console.log('🔌 [Puja WS] closed:', e.reason || e.code);
        setConnected(false);
        wsRef.current = null;

        // Reconnect if not manually closed
        if (!manuallyClosed.current) {
          reconnectRef.current = setTimeout(() => {
            console.log('♻️ [Puja WS] reconnecting...');
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.warn('🔥 [Puja WS] connect exception:', err);
      // schedule reconnect if needed
      if (!manuallyClosed.current && !reconnectRef.current) {
        reconnectRef.current = setTimeout(() => {
          reconnectRef.current = null;
          connect();
        }, 3000);
      }
    }
  };

  /** ✅ Clean Disconnect */
  const disconnect = () => {
    manuallyClosed.current = true;
    if (wsRef.current) {
      console.log('🔒 [Puja WS] Manually closing socket');
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    setConnected(false);
  };

  /** ✅ Manage connection based on internet & token */
  useEffect(() => {
    console.log('🔍 [Puja WS] useEffect triggered:', {
      isConnected,
      hasToken: !!token,
    });

    if (isConnected && token) {
      console.log('✅ [Puja WS] Conditions met — attempting to connect');
      connect();
    } else {
      console.log('⏸️ [Puja WS] Skipping connection / disconnecting', {
        reason: !isConnected
          ? 'network disconnected'
          : !token
          ? 'no token'
          : '',
      });
      disconnect();
    }

    return () => disconnect();
    // Intentionally depend on isConnected and token
  }, [isConnected, token]);

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
