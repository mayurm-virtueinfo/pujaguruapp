import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';
import {getCurrentLocation} from '../utils/locationUtils';

export const getLocationForAPI = async () => {
  try {
    const storedLocation = await AsyncStorage.getItem(AppConstant.LOCATION);

    if (storedLocation) {
      const location = JSON.parse(storedLocation);

      if (location.timestamp) {
        const locationTime = new Date(location.timestamp).getTime();
        const now = new Date().getTime();
        // const thirtyMinutes = 30 * 60 * 1000;
        const thirtyMinutes = 10 * 1000;

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
