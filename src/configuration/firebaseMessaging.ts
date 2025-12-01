import { Platform, Alert, PermissionsAndroid } from 'react-native';
import messaging, {
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { checkNotifications } from 'react-native-permissions';

// Helper variable to track first time permission check for notifications
let hasCheckedNotificationPermission = false;

/**
 * requestCallPermissions is unchanged
 */
export const requestCallPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const camera = granted['android.permission.CAMERA'] === 'granted';
      const mic = granted['android.permission.RECORD_AUDIO'] === 'granted';

      if (!camera || !mic) {
        Alert.alert('Permission Required', 'Camera and microphone are needed for video calls.');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

/**
 * On first time enabling notification permission, return -1.
 * On subsequent permission checks, return 1 for granted, 0 for denied.
 */
export async function requestUserPermission(): Promise<number> {
  console.log('Requesting permission...');

  let firstTime = false;
  // If it's the first call, tell the user this is FIRST time
  if (!hasCheckedNotificationPermission) {
    firstTime = true;
    hasCheckedNotificationPermission = true;
  }

  // Ask both system and firebase
  const settings = await checkNotifications();
  console.log('RN Permissions Status:', settings.status, settings.settings);

  const authStatus = await messaging().requestPermission();
  console.log('Authorization Status:', authStatus);

  const firebaseGranted =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  const rnpGranted = settings.status === 'granted';

  // Determine notification permission enabled status
  let enabled = false;
  if (Platform.OS === 'ios') {
    enabled = firebaseGranted && rnpGranted;
  } else {
    enabled = firebaseGranted;
  }

  // Handle result according to request: 
  // -1 first time, 1 granted, 0 denied
  if (firstTime) {
    // Show status -1 on *first ever* call
    console.log('First notification permission check: returning -1');
    return -1;
  }

  if (enabled) {
    console.log('✅ Notification permission granted');
    try {
      if (Platform.OS === 'ios') {
        const apnsToken = await messaging().getAPNSToken();
        console.log('📲 APNs Token:', apnsToken);
      }
      const fcmToken = await getFcmToken();
      console.log('🎯 FCM Token:', fcmToken);
    } catch (error) {
      console.error('🚫 Error during notification setup:', error);
    }
    return 1; // granted
  } else {
    console.log(
      '❌ Notification permission denied or not determined. Status:',
      authStatus,
      'RNP Status:',
      settings.status
    );

    Alert.alert(
      'Notifications Disabled',
      `Please enable push notifications in settings to receive alerts.\nStatus: ${authStatus}\nRNP Status: ${settings.status}`,
    );
    return 0; // denied
  }
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const fcmToken = await messaging().getToken();
    return fcmToken;
  } catch (error) {
    console.error('🚫 Failed to get FCM token:', error);
    return null;
  }
}