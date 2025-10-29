import {Platform, PermissionsAndroid, Linking} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

// 🔹 Request location permission for Android & iOS
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED ||
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.LIMITED;

      const coarseGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return fineGranted || coarseGranted;
    } else if (Platform.OS === 'ios') {
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) return true;

      const newStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return newStatus === RESULTS.GRANTED || newStatus === RESULTS.LIMITED;
    }
    return false;
  } catch (err) {
    console.warn('requestLocationPermission error:', err);
    return false;
  }
};

// 🔹 Ensure GPS/Location Services are enabled
export const ensureLocationEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const status = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: true,
      });
      return status === 'enabled' || status === 'already-enabled';
    } catch (err) {
      console.warn('User did not enable location:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        error => {
          resolve(false);
        },
      );
    });
  }
  return false;
};

// 🔹 Get current location
export const getCurrentLocation = async (): Promise<LocationData> => {
  // 1️⃣ Ask for permission (Android + iOS)
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) throw new Error('Location permission denied');

  // 2️⃣ Ensure GPS/Location is enabled
  const gpsEnabled = await ensureLocationEnabled();
  if (!gpsEnabled) throw new Error('Location services are turned off');

  // 3️⃣ Get quick fused/cached location
  return new Promise<LocationData>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        console.log('Geolocation library response :: ', pos);

        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      },
      err => {
        console.warn('⚠️ Location fetch failed:', err.message);
        reject(err);
      },
      {
        enableHighAccuracy: false, // 🚀 use fast fused/cell-based location
        timeout: 5000, // wait max 5 sec
        maximumAge: 10 * 60 * 1000, // use cached up to 10 min old
      },
    );
  });
};

// 🔹 Direct GPS check and prompt function
export const checkAndPromptGPS = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const status = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: true,
      });
      return status === 'enabled' || status === 'already-enabled';
    } else if (Platform.OS === 'ios') {
      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          {enableHighAccuracy: false, timeout: 5000, maximumAge: 0},
        );
      });
    }
    return false;
  } catch (err) {
    console.warn('Error checking GPS status:', err);
    return false;
  }
};

// 🔹 Check if GPS is enabled without prompting
export const isGPSEnabled = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          {enableHighAccuracy: true, timeout: 2000, maximumAge: 0},
        );
      });
    } else {
      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          {enableHighAccuracy: true, timeout: 3000, maximumAge: 0},
        );
      });
    }
  } catch (err) {
    console.log('GPS check exception:', err);
    return false;
  }
};
