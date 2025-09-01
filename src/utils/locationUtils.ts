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
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to provide better services.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      reject(new Error('Location permission denied'));
      return;
    }

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
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  return `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
};
