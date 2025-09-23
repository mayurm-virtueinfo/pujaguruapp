import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
  accuracy?: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.LIMITED; // Android 12 approximate

      const coarseGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      // Accept either fine or coarse; we can still show approximate location
      return fineGranted || coarseGranted;
    } catch (err) {
      console.warn('requestLocationPermission error:', err);
      return false;
    }
  }
  // iOS handled separately by Info.plist and system prompt elsewhere
  return true;
};

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      reject(new Error('Location permission denied'));
      return;
    }

    // Try with high accuracy first, then fallback once to balanced power if it times out/position unavailable
    const tryGetPosition = (highAccuracy: boolean): void => {
      Geolocation.getCurrentPosition(
        position => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          resolve(locationData);
        },
        error => {
          console.warn('Location error:', error.message);
          // Fallback once with lower accuracy if initial attempt fails on Android
          if (
            Platform.OS === 'android' &&
            highAccuracy &&
            (error?.code === 2 /* POSITION_UNAVAILABLE */ ||
              error?.code === 3) /* TIMEOUT */
          ) {
            tryGetPosition(false);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 25000, // longer timeout helps release builds cold start
          maximumAge: 0, // avoid stale cached values on first boot
        },
      );
    };

    tryGetPosition(true);
  });
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  return `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
};
