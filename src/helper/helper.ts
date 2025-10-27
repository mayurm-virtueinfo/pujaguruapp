import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';
import {getCurrentLocation} from '../utils/locationUtils';
import { Message } from '../screens/Users/UserChatScreen/UserChatScreen';

export const getLocationForAPI = async () => {
  try {
    const storedLocation = await AsyncStorage.getItem(AppConstant.LOCATION);

    console.log('storedLocation :: ', storedLocation);

    if (storedLocation) {
      const location = JSON.parse(storedLocation);

      if (location.timestamp) {
        const locationTime = new Date(location.timestamp).getTime();
        const now = new Date().getTime();
        // 30 minutes cache by default
        const thirtyMinutes = 30 * 60 * 1000;

        if (now - locationTime < thirtyMinutes) {
          console.log('📱 Using stored location');
          return {
            latitude: location.latitude,
            longitude: location.longitude,
          };
        }
      }
    }

    console.log('🎯 Getting fresh GPS location');
    const freshLocation = await getCurrentLocation();

    await AsyncStorage.setItem(
      AppConstant.LOCATION,
      JSON.stringify({
        ...freshLocation,
        timestamp: new Date().toISOString(),
      }),
    );

    return {
      latitude: freshLocation.latitude,
      longitude: freshLocation.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};



// helpers/chatHelpers.ts
export const handleIncomingMessage = (prevMessages: Message[], data: any, myUserId: any) => {
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
        : msg
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
