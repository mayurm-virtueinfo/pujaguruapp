import {Platform, PermissionsAndroid, Alert} from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'This app needs access to your location to fetch your address.',
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
  return true; // iOS handles permissions differently
};

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    // This is a mock implementation
    // In a real app, you would use a library like @react-native-community/geolocation
    // or react-native-location to get actual GPS coordinates

    setTimeout(() => {
      const mockLocation: LocationData = {
        latitude: 37.78825,
        longitude: -122.4324,
        address: '1234 Elm Street, Springfield, IL 62701',
      };
      resolve(mockLocation);
    }, 2000); // Simulate network delay
  });
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  // This is a mock implementation
  // In a real app, you would use Google Maps API or similar service
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)} - Mock Address`;
};
