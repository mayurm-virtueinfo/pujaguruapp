import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { COLORS } from '../theme/theme';
import { navigate, navigationRef } from '../utils/NavigationService';
import { displayIncomingCall, endIncomingCall } from './callValidation';
import RNCallKeep from 'react-native-callkeep';
import { startForegroundService } from './foregroundService';
import PushNotification from 'react-native-push-notification';
import { Linking } from 'react-native';

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
  });

  // Ensure the calls channel exists for RNPN-created notifications
  PushNotification.createChannel(
    {
      channelId: 'calls',
      channelName: 'Call Notifications',
      channelDescription: 'Incoming call alerts with Accept/Decline',
      importance: 5, // Importance.HIGH
      vibrate: true,
      soundName: 'default',
    },
    (created: boolean) => console.log('PushNotification channel "calls" created:', created),
  );

  // Configure action handlers once
  PushNotification.configure({
    onNotification: function (notification: any) {
      try {
        console.log('[RNPN] onNotification', JSON.stringify(notification));
        // Handle taps on the notification itself (not action buttons)
        if (notification?.data) {
          handleNotificationNavigation(notification.data);
        }
      } catch (e) {
        console.warn('onNotification error', e);
      }
    },
    onAction: function (notification: any) {
      try {
        const action = notification?.action;
        // RNPN delivers payload under either data or userInfo
        const data = (notification?.data || notification?.userInfo || {}) as any;
        console.log('[RNPN] onAction', action, JSON.stringify(data));

        if (action === 'Accept') {
          // Navigate to video call screen with payload
          Linking.openURL('pujaguru://video').catch((err) => console.log("Depplink error::", err));
          console.log("-----------------pujaguru://video-------------------")
          const nestedParams = {
            screen: 'UserAppBottomTabNavigator',
            params: {
              screen: 'UserHomeNavigator',
              params: {
                screen: 'UserChatScreen',
                params: {
                  booking_id: data?.booking_id,
                  user_id: data?.sender_id,
                  other_user_name: data?.callerName || 'Call',
                  videocall: true,
                  incomingMeetingUrl: data?.meeting_url,
                  currentCallUUID: data?.callUUID || data?.callId,
                },
              },
            },
          } as any;

          // Close notifications first to avoid interference
          try { PushNotification.cancelAllLocalNotifications(); } catch { }

          const attemptNavigate = (retries = 10) => {
            if (navigationRef.isReady()) {
              try { navigate('Main', nestedParams); } catch (e) { console.warn('navigate error', e); }
            } else if (retries > 0) {
              setTimeout(() => attemptNavigate(retries - 1), 200);
            } else {
              console.warn('Navigation not ready after retries');
            }
          };
          attemptNavigate();
        }

        if (action === 'Decline') {
          const callUUID = (data?.callUUID || data?.callId) as string | undefined;
          if (callUUID) {
            endIncomingCall(callUUID);
          }
          PushNotification.cancelAllLocalNotifications();
        }
      } catch (e) {
        console.warn('onAction error', e);
      }
    },
    permissions: { alert: true, badge: true, sound: true },
    requestPermissions: true,
    popInitialNotification: true,
  });

  // Foreground message handler (displays notification)
  messaging().onMessage(async (remoteMessage: any) => {
    console.log('📩 Foreground FCM message:', remoteMessage);

    if (remoteMessage.data?.type === 'video_call_invite') {
      const callUUID = remoteMessage.data.callId || `uuid-${Date.now()}`;
      RNCallKeep.displayIncomingCall(
        callUUID,
        remoteMessage.data.callerName || 'Unknown',
        'Video',
        'number',
        true
      );

      // Also show a local notification with Accept/Decline actions
      showCallInviteNotification({
        id: remoteMessage.messageId,
        title: remoteMessage.notification?.title || 'Incoming Call',
        body: remoteMessage.notification?.body || 'Tap to answer',
        data: { ...remoteMessage.data, callUUID: callUUID },
      });
      return;
    }

    if (remoteMessage.data?.type === 'end_call') {
      const callUUID = remoteMessage.data.callUUID;
      if (callUUID) {
        endIncomingCall(callUUID);
      }
      return;
    }

    const { title, body } = remoteMessage.notification || {};
    await notifee.displayNotification({
      id: remoteMessage.messageId,
      title: title || 'New Notification',
      body: body || 'You have a new message!',
      data: remoteMessage.data,
      android: {
        channelId,
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        color: COLORS.primary,
      },
      ios: {},
    });
  });

  // Handle notification press in foreground
  foregroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Notification pressed in foreground', detail);
      const data = detail.notification?.data || {};
      handleNotificationNavigation(data);
    }
  });

  // App opened from background
  messaging().onNotificationOpenedApp((remoteMessage: any) => {
    if (remoteMessage) {
      console.log('🔁 Opened from background:', remoteMessage);
      handleNotificationNavigation(remoteMessage.data);
    }
  });

  // Background handler
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('Received background message:', remoteMessage.data);
    if (remoteMessage.data?.type === 'video_call_invite') {
      const callUUID = remoteMessage.data.callId || `uuid-${Date.now()}`;
      await startForegroundService({ ...remoteMessage.data, callUUID });
    }
  });
}

export function handleNotificationNavigation(data: any) {
  if (data?.type === 'video_call_invite') {
    const nestedParams = {
      screen: 'UserAppBottomTabNavigator',
      params: {
        screen: 'UserHomeNavigator',
        params: {
          screen: 'UserChatScreen',
          params: {
            booking_id: data?.booking_id,
            user_id: data?.sender_id,
            other_user_name: data?.callerName || 'Call',
            videocall: true,
            incomingMeetingUrl: data?.meeting_url,
            currentCallUUID: data?.callUUID,
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
  } else if (data?.screen === 'WaitingApprovalPujaScreen') {
    const targetScreen = data?.screen;
    const booking_id = data?.booking_id;
    const offer_id = data?.offer_id;

    const nestedParams = {
      screen: 'UserAppBottomTabNavigator',
      params: {
        screen: 'UserHomeNavigator',
        params: {
          screen: targetScreen,
          params: {
            booking_id,
            offer_id,
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
    const videocall = data?.video_call;

    const nestedParams = {
      screen: 'UserAppBottomTabNavigator',
      params: {
        screen: 'UserHomeNavigator',
        params: {
          screen: targetScreen,
          params: {
            booking_id,
            pandit_id,
            videocall,
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
  }
}

export function cleanupNotifications() {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }
  isSetup = false;
}

// Helpers
function showCallInviteNotification(args: {
  id?: string;
  title: string;
  body: string;
  data: any;
}) {
  try {
    PushNotification.localNotification({
      channelId: 'calls',
      id: args.id,
      title: args.title,
      message: args.body,
      userInfo: args.data, // iOS
      data: args.data, // Android
      playSound: true,
      soundName: 'default',
      importance: 5,
      priority: 'high',
      vibrate: true,
      ongoing: true,
      category: 'call',
      actions: ['Accept', 'Decline'],
      // Use invokeApp true so actions open the app; we'll handle action via onNotification
      invokeApp: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      color: COLORS.primary,
      // Ensure heads-up presentation on Android
      visibility: 'public',
      allowWhileIdle: true,
      autoCancel: false,
    } as any);
  } catch (e) {
    console.warn('showCallInviteNotification error', e);
  }
}

// Exported handlers for PushNotification.configure in index.js
export function handlePushNotification(notification: any) {
  try {
    const action = notification?.data?.video_call;
    const data = (notification?.data || notification?.userInfo || {}) as any;
    console.log('[RNPN] onNotification', JSON.stringify(data));
    console.log("action", action)
    if (action === 'true') {
      // route to Accept path
      handlePushAction({ action: 'Accept', data });
      Linking.openURL('pujaguru://video').catch((err) => console.log("Depplink error::", err));
      console.log("Call accepted -------------------========+>")
      return;
    }
    if (action === 'Decline') {
      handlePushAction({ action: 'Decline', data });
      return;
    }

    if (data) handleNotificationNavigation(data);
  } catch (e) {
    console.warn('handlePushNotification error', e);
  }
}

export function handlePushAction(notification: any) {
  try {
    const action = notification?.action;
    const data = (notification?.data || notification?.userInfo || {}) as any;
    console.log('[RNPN] onAction', action, JSON.stringify(data));

    if (action === 'Accept') {
      // Bring app to foreground explicitly
      try { (PushNotification as any).invokeApp?.(notification); } catch { }

      // Fallback: deep link to ensure activity resumes
      Linking.openURL(`pujaguru://video`).catch((err) => console.log("Depplink error::", err));

      const nestedParams = {
        screen: 'UserAppBottomTabNavigator',
        params: {
          screen: 'UserHomeNavigator',
          params: {
            screen: 'UserChatScreen',
            params: {
              booking_id: data?.booking_id,
              user_id: data?.sender_id,
              other_user_name: data?.callerName || 'Call',
              videocall: true,
              incomingMeetingUrl: data?.meeting_url,
              currentCallUUID: data?.callUUID || data?.callId,
            },
          },
        },
      } as any;

      const attemptNavigate = (retries = 15) => {
        if (navigationRef.isReady()) {
          try { navigate('Main', nestedParams); } catch (e) { console.warn('navigate error', e); }
        } else if (retries > 0) {
          setTimeout(() => attemptNavigate(retries - 1), 200);
        } else {
          console.warn('Navigation not ready after retries');
        }
      };
      attemptNavigate();
    }

    if (action === 'Decline') {
      const callUUID = (data?.callUUID || data?.callId) as string | undefined;
      if (callUUID) {
        endIncomingCall(callUUID);
      }
      try { PushNotification.cancelAllLocalNotifications(); } catch { }
    }
  } catch (e) {
    console.warn('handlePushAction error', e);
  }
}
