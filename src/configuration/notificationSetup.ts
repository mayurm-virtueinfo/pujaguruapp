import notifee, {EventType, AndroidImportance} from '@notifee/react-native';
import {getMessaging} from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';
import {navigate, navigationRef} from '../utils/NavigationService';
import {COLORS} from '../theme/theme';

const messaging = getMessaging(getApp());

let isSetup = false;
let foregroundUnsubscribe: (() => void) | null = null;

export async function setupNotifications() {
  if (isSetup) {
    console.log('Notifications already set up, skipping...');
    return;
  }

  isSetup = true;

  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'custom_notification_sound',
  });

  // Foreground message handler (displays notification)
  messaging.onMessage(async (remoteMessage: any) => {
    console.log('📩 Foreground FCM message:', remoteMessage);

    const {title, body} = remoteMessage.notification || {};
    await notifee.displayNotification({
      id: remoteMessage.messageId,
      title: title || 'New Notification',
      body: body || 'You have a new message!',
      data: remoteMessage.data,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        pressAction: {id: 'default'},
        color: COLORS.primary,
        sound: 'custom_notification_sound',
      },
      ios: {},
    });
  });

  // Handle notification press in foreground
  foregroundUnsubscribe = notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS) {
      console.log('Notification pressed in foreground', detail);
      const data = detail.notification?.data || {};
      handleNotificationNavigation(data);
    }
  });

  messaging.onNotificationOpenedApp((remoteMessage: any) => {
    if (remoteMessage) {
      console.log('🔁 Opened from background:', remoteMessage);
      handleNotificationNavigation(remoteMessage.data);
    }
  });

  // Background handler (must be top-level)
  messaging.setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('📨 Background FCM message:', remoteMessage);
  });
}

export function handleNotificationNavigation(data: any) {
  console.log('data of notification :: ', data);

  if (data?.screen === 'FilteredPanditListScreen') {
    const targetScreen = data?.screen;
    const booking_id = data?.booking_id;

    const nestedParams = {
      screen: 'UserAppBottomTabNavigator',
      params: {
        screen: 'UserHomeNavigator',
        params: {
          screen: targetScreen,
          params: {
            booking_id,
          },
        },
      },
    };

    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigate('Main', nestedParams);
      } else {
        console.warn('Navigation not ready yet');
      }
    }, 500);
  } else if (data?.screen === 'ChatScreen') {
    const targetScreen = data?.navigation || data?.pujaguru_app_screen;
    const booking_id = data?.booking_id;
    const pandit_id = data?.sender_id;
    const video_call = data?.video_call || false;

    console.log('-------------------------------');
    console.log('data :: ', data);
    console.log('targetScreen :: ', targetScreen);
    console.log('booking_id :: ', booking_id);
    console.log('video_call :: ', video_call);

    const nestedParams = {
      screen: 'UserAppBottomTabNavigator',
      params: {
        screen: 'UserHomeNavigator',
        params: targetScreen
          ? {
              screen: targetScreen,
              params: {
                booking_id,
                pandit_id,
                video_call,
              },
            }
          : {
              booking_id,
              pandit_id,
            },
      },
    };

    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigate('Main', nestedParams);
      } else {
        console.warn('Navigation not ready yet');
      }
    }, 500);
  }
}

export function cleanupNotifications() {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }
  isSetup = false;
}

function generateUuidV4(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const b = Array.from(bytes).map(toHex);
  return (
    b[0] +
    b[1] +
    b[2] +
    b[3] +
    '-' +
    b[4] +
    b[5] +
    '-' +
    b[6] +
    b[7] +
    '-' +
    b[8] +
    b[9] +
    '-' +
    b[10] +
    b[11] +
    b[12] +
    b[13] +
    b[14] +
    b[15]
  );
}
