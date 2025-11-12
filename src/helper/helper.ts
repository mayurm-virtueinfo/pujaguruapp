import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';
import { getCurrentLocation } from '../utils/locationUtils';
import { Message } from '../screens/Users/UserChatScreen/UserChatScreen';
import { DeviceEventEmitter } from 'react-native';

const SIXTY_MINUTES = 30 * 60 * 1000;

export const LOCATION_UPDATED_EVENT = 'LOCATION_UPDATED';

export const getLocationForAPI = async () => {
  try {
    const storedLocation = await AsyncStorage.getItem(AppConstant.LOCATION);

    if (storedLocation) {
      const location = JSON.parse(storedLocation);
      const locationTime = new Date(location.timestamp).getTime();
      const now = Date.now();

      // ✅ If cache is still valid — return immediately
      if (now - locationTime < SIXTY_MINUTES) {
        console.log('📱 Using cached location');
        return {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }

      // ⚙️ Cache expired → use old coordinates immediately (fast)
      console.log(
        '⚡ Using expired cached location (will update in background)',
      );
      updateLocationInBackground();
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    // 🆕 No stored location → must fetch now
    console.log('🎯 Getting fresh GPS location (no cache found)');
    const freshLocation = await getCurrentLocation();

    if (freshLocation) {
      await AsyncStorage.setItem(
        AppConstant.LOCATION,
        JSON.stringify({
          ...freshLocation,
          timestamp: new Date().toISOString(),
        }),
      );
      // 🔔 Notify listeners
      DeviceEventEmitter.emit(LOCATION_UPDATED_EVENT, freshLocation);

      return {
        latitude: freshLocation.latitude,
        longitude: freshLocation.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

// 🧩 Fetches new GPS coordinates in background (non-blocking)
const updateLocationInBackground = async () => {
  try {
    const freshLocation = await getCurrentLocation();
    if (freshLocation) {
      await AsyncStorage.setItem(
        AppConstant.LOCATION,
        JSON.stringify({
          ...freshLocation,
          timestamp: new Date().toISOString(),
        }),
      );
      console.log('📍 Background location updated successfully');
      // 🔔 Notify any listener (like Home screen)
      DeviceEventEmitter.emit(LOCATION_UPDATED_EVENT, freshLocation);
    }
  } catch (error) {
    console.warn('⚠️ Background location update failed:', error);
  }
};

export const handleIncomingMessage = (
  prevMessages: Message[],
  data: any,
  myUserId: any,
) => {
  // 1️⃣ Find the temporary message
  const tempMsg = prevMessages.find(msg => String(msg.id).startsWith('temp-'));

  if (tempMsg) {
    // 2️⃣ Replace the temp message with the real one from server
    return prevMessages.map(msg =>
      msg.id === tempMsg.id
        ? {
            id: data.uuid,
            text: data.message,
            time: new Date(data.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isOwn: data.sender_id == myUserId,
          }
        : msg,
    );
  }

  // 3️⃣ If no temp found, just append the new message
  const newMsg = {
    id: data.uuid,
    text: data.message,
    time: new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isOwn: data.sender_id == myUserId,
  };

  return [...prevMessages, newMsg];
};
