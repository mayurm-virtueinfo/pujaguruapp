import { DeviceEventEmitter } from 'react-native';

export const WEBSOCKET_UPDATE_EVENT = 'WEBSOCKET_UPDATE_EVENT';
let ws: WebSocket | null = null;

const getSocketURL = (token: string) => {
  if (__DEV__) {
    return `wss://dev.puja-guru.com/ws/user/updates/?token=${token}`;
  }
  return `wss://puja-guru.com/ws/user/updates/?token=${token}`;
};

export const initUserWebSocket = (token: string) => {
  if (ws) return;

  const socketURL = getSocketURL(token);
  ws = new WebSocket(socketURL);

  ws.onopen = () => console.log('✅ Puja data update WebSocket connected');
  ws.onerror = e => console.warn('⚠️ WebSocket error:', e.message);
  ws.onclose = e => console.log('❌ WebSocket closed:', e.reason);

  ws.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message:', data);

      // Future-proof: handle all booking update actions (accepted, completed, cancelled, etc.)
      if (data.type === 'booking_update') {
        DeviceEventEmitter.emit(WEBSOCKET_UPDATE_EVENT, data);
      }
    } catch (err) {
      console.warn('WebSocket parse error:', err);
    }
  };
};

export const closeUserWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};
