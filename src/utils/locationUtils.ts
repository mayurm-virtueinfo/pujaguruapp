import {
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
  AppState,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

// Helper: Show alert to go to settings
const showSettingsAlert = () => {
  Alert.alert(
    'Location Permission Required',
    'Please enable location permissions in settings to get accurate pandit recommendations.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
};

// Request permission (Android + iOS)
const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

      // Fallback to coarse
      if (granted === PermissionsAndroid.RESULTS.DENIED) {
        const coarse = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        );
        return coarse === PermissionsAndroid.RESULTS.GRANTED;
      }

      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        showSettingsAlert();
        return false;
      }

      return false;
    }

    // iOS
    let status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) return true;

    if (status === RESULTS.DENIED) {
      status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    }

    if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
      showSettingsAlert();
      return false;
    }

    return false;
  } catch (err) {
    console.warn('Permission error:', err);
    return false;
  }
};

// Ensure location services are ON (Android GPS)
const ensureLocationServicesEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const result = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: false, // Don't block too long
      });
      return result === 'enabled' || result === 'already-enabled';
    } catch {
      return false;
    }
  }

  // iOS: assume permission implies services are on
  return true;
};

// Get location with retry + fallback
const getLocationWithFallback = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Location timeout'));
      }
    }, 20000); // Max 20s

    const tryGetLocation = (highAccuracy: boolean) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);

          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        },
        (err) => {
          if (resolved) return;

          if (highAccuracy) {
            // Try again with low accuracy
            Geolocation.getCurrentPosition(
              (pos) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeout);
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  timestamp: new Date(pos.timestamp).toISOString(),
                });
              },
              () => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timeout);
                  reject(new Error('Failed to get location'));
                }
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000, // 5 min cache
              },
            );
          } else {
            resolved = true;
            clearTimeout(timeout);
            reject(err);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 10000,
          maximumAge: highAccuracy ? 10000 : 300000,
        },
      );
    };

    tryGetLocation(true); // First try high accuracy
  });
};

// MAIN EXPORT: Get current location reliably
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // Step 1: Check permission
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    // Step 2: Ensure GPS is enabled (Android)
    const gpsEnabled = await ensureLocationServicesEnabled();
    if (!gpsEnabled && Platform.OS === 'android') {
      console.log('GPS not enabled');
      return null;
    }

    // Step 3: Get location with fallback
    const location = await getLocationWithFallback();
    console.log('Location fetched:', location);
    return location;
  } catch (error) {
    console.warn('getCurrentLocation failed:', error);
    return null;
  }
};