import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {promptForEnableLocationIfNeeded} from 'react-native-android-location-enabler';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
  accuracy?: number;
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
          if (error.code === 2) {
            Alert.alert(
              'Location Services Disabled',
              'Please enable Location Services in Settings.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Settings',
                  onPress: () =>
                    Linking.openURL('App-Prefs:Privacy&path=LOCATION'),
                },
              ],
            );
          }
          resolve(false);
        },
      );
    });
  }
  return false;
};

// 🔹 Get current location
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise(async (resolve, reject) => {
    //check location permission
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      reject(new Error('Location permission denied'));
      return;
    }

    //check GPS service enable or not
    const gpsEnabled = await ensureLocationEnabled();
    if (!gpsEnabled) {
      reject(new Error('Location services are turned off'));
      return;
    }

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
          if (
            Platform.OS === 'android' &&
            highAccuracy &&
            (error?.code === 2 || error?.code === 3)
          ) {
            tryGetPosition(false);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 25000,
          maximumAge: 0,
        },
      );
    };

    tryGetPosition(true);
  });
};

// 🔹 Direct GPS check and prompt function
export const checkAndPromptGPS = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Directly prompt for GPS if disabled
      const status = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: true,
      });
      return status === 'enabled' || status === 'already-enabled';
    } else if (Platform.OS === 'ios') {
      // For iOS, we need to check if location services are enabled
      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true), // Location services are enabled
          error => {
            if (error.code === 2) {
              // Location services disabled - show alert
              // Alert.alert(
              //   'Location Services Disabled',
              //   'Please enable Location Services in Settings to use this feature.',
              //   [
              //     {
              //       text: 'Cancel',
              //       style: 'cancel',
              //       onPress: () => resolve(false),
              //     },
              //     {
              //       text: 'Open Settings',
              //       onPress: () => {
              //         Linking.openURL('App-Prefs:Privacy&path=LOCATION');
              //         resolve(false);
              //       },
              //     },
              //   ],
              // );
              console.error(
                '-------- Location services are disabled on iOS --------',
              );
              resolve(false);
            } else {
              resolve(false);
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0,
          },
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
          position => {
            resolve(true);
          },
          error => {
            if (error.code === 2 || error.code === 3) {
              resolve(false);
            } else {
              resolve(false);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 2000,
            maximumAge: 0,
          },
        );
      });
    } else {
      // For iOS
      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          position => {
            console.log('iOS GPS check success');
            resolve(true);
          },
          error => {
            console.log('iOS GPS check failed:', error.code, error.message);
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 3000,
            maximumAge: 0,
          },
        );
      });
    }
  } catch (err) {
    console.log('GPS check exception:', err);
    return false;
  }
};
