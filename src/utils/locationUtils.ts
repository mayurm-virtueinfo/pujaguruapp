import {Platform, PermissionsAndroid, Linking, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}
let isAlertVisible = false; // module-level flag
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

      if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
        if (isAlertVisible) return false; // Prevent multiple alerts
        isAlertVisible = true;
        Alert.alert(
          '',
          'This feature uses your location to show nearby Pandits. You can enable Location Services anytime from Settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                const url = 'app-settings:';
                Linking.canOpenURL(url)
                  .then(supported => {
                    if (supported) {
                      Linking.openURL(url);
                    } else if (Linking.openSettings) {
                      Linking.openSettings();
                    }
                  })
                  .catch(() => {
                    if (Linking.openSettings) Linking.openSettings();
                  });
              },
            },
            {text: 'Cancel', style: 'cancel'},
          ],
        );
        return false;
      }

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
    // Prefer using react-native-permissions to check Location Services
    const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }
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
  
  // 3️⃣ Get current location
  return new Promise<LocationData>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        console.log('hasPermission ::', pos)
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      },
      err => {
        console.log('err ::', err)
        reject(err);
      },
      {
        enableHighAccuracy: true,   // ✅ Try GPS first
        timeout: 15000,             // ✅ Give 15 seconds
        maximumAge: 10000,          // ✅ Allow a recent cached fix
      },
    );
  });
};
