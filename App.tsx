import './src/i18n';
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import 'react-native-gesture-handler';
import {AuthProvider} from './src/provider/AuthProvider';
import {ToastProvider} from 'react-native-toast-notifications';
import {moderateScale} from 'react-native-size-matters';
import {COLORS} from './src/theme/theme';
import {requestUserPermission} from './src/configuration/firebaseMessaging';
import {getAuth} from '@react-native-firebase/auth';
import i18n, {initializeI18n} from './src/i18n';
import {I18nextProvider} from 'react-i18next';
import {navigate, navigationRef} from './src/utils/NavigationService';
import {
  handleNotificationNavigation,
  setupNotifications,
} from './src/configuration/notificationSetup';
import {getMessaging} from '@react-native-firebase/messaging';
import {requestLocationPermission} from './src/utils/locationUtils';
import {CaptureProtection} from 'react-native-capture-protection';
import {Linking} from 'react-native';
import {
  initCallKeep,
  setOnAnswerListener,
  setOnEndListener,
} from './src/configuration/callValidation';
import {startForegroundService} from './src/configuration/foregroundService';
// import PushNotification from 'react-native-push-notification';

const auth = getAuth();
if (__DEV__) {
  // auth.useEmulator('http://127.0.0.1:9099');
  auth.useEmulator('http://192.168.1.39:9099');
}

setupNotifications();

// PushNotification.configure({
//   onNotification: function (notification: {
//     action: string;
//     data: any;
//     userInteraction: any;
//   }) {
//     console.log('NOTIFICATION:');
//     console.log('NOTIFICATION:', JSON.stringify(notification));
//     // Accept action - navigate to video call screen
//     if (notification.action === 'Accept') {
//       console.log('Call Accepted');
//       // You can extract more info from notification.data if available
//       navigate('Main', {
//         screen: 'UserAppBottomTabNavigator',
//         params: {
//           screen: 'UserHomeNavigator',
//           params: {
//             screen: 'UserChatScreen',
//             params: {
//               ...(notification.data || {}),
//               videocall: true,
//               notificationAction: 'accept',
//             },
//           },
//         },
//       });
//     }

//     // Decline action - just cancel all local notifications and optionally end call logic
//     if (notification.action === 'Decline') {
//       console.log('Call Declined');
//       PushNotification.cancelAllLocalNotifications();
//       // Optionally navigate or handle end call UI here
//     }

//     if (notification.userInteraction) {
//       // App opened by tapping the notification
//       // Optionally, handle navigation based on notification
//       // console.log('Notification tapped');
//     }
//   },
//   onAction: function (notification: {action: string}) {
//     console.log('ACTION:', notification.action);
//     console.log('NOTIFICATION:', notification);

//     // process the action
//   },
//   permissions: {
//     alert: true,
//     badge: true,
//     sound: true,
//   },

//   requestPermissions: true,
// });

const App = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 2500);
    // startForegroundService();
    initializeI18n();
    requestUserPermission();
    requestLocationPermission();
    initCallKeep();

    setOnAnswerListener(({callUUID, payload}) => {
      navigate('Main', {
        screen: 'UserAppBottomTabNavigator',
        params: {
          screen: 'UserHomeNavigator',
          params: {
            screen: 'UserChatScreen',
            params: {
              booking_id: payload?.booking_id,
              user_id: payload?.sender_id,
              other_user_name: payload?.callerName || 'Call',
              videocall: true,
              callUUID,
              incomingMeetingUrl: payload?.meeting_url,
              ...payload,
            },
          },
        },
      });
    });

    setOnEndListener(({callUUID}) => {
      navigate('Main', {
        screen: 'UserAppBottomTabNavigator',
        params: {
          screen: 'UserHomeNavigator',
          params: {
            screen: 'UserChatScreen',
            params: {
              endCall: true,
              callUUID,
            },
          },
        },
      });
    });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!CaptureProtection || typeof CaptureProtection.prevent !== 'function') {
      console.warn(
        '[capture-protection] module unavailable; skipping prevent()',
      );
      return;
    }

    CaptureProtection.prevent({
      screenshot: true,
      record: true,
      appSwitcher: true,
    });

    return () => {
      if (CaptureProtection && typeof CaptureProtection.allow === 'function') {
        CaptureProtection.allow();
      }
    };
  }, []);

  useEffect(() => {
    const handleDeepLinkUrl = (raw: string | {url: string} | null) => {
      console.log('New test 9 : handleDeepLinkUrl', raw);
      if (!raw) return;
      const url = typeof raw === 'string' ? raw : raw.url;
      if (!url) return;

      try {
        console.log('New test 10 : handleDeepLinkUrl', url);
        let uuid: string | null = null;
        let room: string | null = null;

        // Parse URL
        const u = new URL(url);
        if (u.protocol === 'pujaguru:' && u.hostname === 'video') {
          const params = new URLSearchParams(u.search);
          uuid = params.get('uuid');
          room = params.get('room');
        }

        if (uuid || room) {
          const params: any = {};
          if (uuid) params.callUUID = uuid;
          if (room) params.roomId = room;

          // Ensure navigationRef is ready
          const navigateWhenReady = () => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('UserChatScreen', params);
            } else {
              setTimeout(navigateWhenReady, 100); // Retry until ready
            }
          };
          navigateWhenReady();
        }
      } catch (err) {
        console.warn('New test 11 : Failed to handle deep link', err);
      }
    };

    // Handle cold start (kill mode)
    Linking.getInitialURL()
      .then(initialUrl => {
        console.log('New test 7 : getInitialURL', initialUrl);
        handleDeepLinkUrl('pujaguru://video');
      })
      .catch(err => {
        console.warn('New test 8 : getInitialURL error', err);
      });

    // Handle foreground/background deep links
    const sub = Linking.addEventListener('url', event =>
      handleDeepLinkUrl(event.url),
    );

    return () => {
      try {
        sub.remove();
      } catch (e) {
        console.warn('Error removing Linking listener', e);
      }
    };
  }, []);

  const handleInitialNotification = async () => {
    try {
      const remoteMessage = await getMessaging().getInitialNotification();
      if (remoteMessage) {
        console.log('🚀 Opened from quit state:', remoteMessage);
        handleNotificationNavigation(remoteMessage.data);
      }
    } catch (error) {
      console.error('Error handling initial notification:', error);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider
        style={{
          backgroundColor: COLORS.primary,
        }}
        textStyle={{
          fontSize: moderateScale(16),
          color: COLORS.textPrimary,
        }}>
        <AuthProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              handleInitialNotification();
            }}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ToastProvider>
    </I18nextProvider>
  );
};

export default App;
