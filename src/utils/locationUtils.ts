import {
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

let isAlertVisible = false;

const showSettingsAlert = () => {
  Alert.alert(
    '',
    'This feature uses your location to show nearby Pandits. You can enable Location Services anytime from Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
};

// Fix for: first time on click GPS location it not work on second time it's work
// Root cause: On Android, must ensure permission *AND* ensure GPS mode BEFORE requesting location.
// If Geolocation.getCurrentPosition is called BEFORE user enables permissions or turns on GPS, Android may cache/lock, and only after the 2nd attempt things work.
// Also: get location *after* both checks/flows are done + use callback pattern for Geolocation to prevent races.

const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Check first
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

      // Fallback to request coarse
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
      if (isAlertVisible) return false;
      isAlertVisible = true;
      showSettingsAlert();
      return false;
    }

    return false;
  } catch (e) {
    console.warn('Permission error:', e);
    return false;
  }
};

const ensureLocationServicesEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      // show dialog to enable GPS if needed
      const result = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: false,
      });
      return result === 'enabled' || result === 'already-enabled';
    } catch {
      return false;
    }
  }
  return true; // on iOS, assume permission implies services are on
};

const getLocationWithFallback = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    let resolved = false;

    // 20 seconds: overall timeout
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Location timeout'));
      }
    }, 20000);

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
          // If highAccuracy failed, fallback
          if (highAccuracy) {
            // Try with low accuracy
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
                maximumAge: 300000,
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

    tryGetLocation(true);
  });
};

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // Step 1: Always check permission first (must grant before doing next step)
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    // Step 2: Always check GPS enabled if Android (do this *after* permission)
    const gpsEnabled = await ensureLocationServicesEnabled();
    if (!gpsEnabled && Platform.OS === 'android') {
      console.log('GPS not enabled');
      return null;
    }

    // Step 3: Safe to get location
    const location = await getLocationWithFallback();
    console.log('Location fetched:', location);
    return location;
  } catch (error) {
    console.warn('getCurrentLocation failed:', error);
    return null;
  }
};