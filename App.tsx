import './src/i18n';
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import 'react-native-gesture-handler';
import {AuthProvider} from './src/provider/AuthProvider';
import {GPSProvider, useGPS} from './src/provider/GPSProvider';
import {ToastProvider} from 'react-native-toast-notifications';
import {moderateScale} from 'react-native-size-matters';
import {COLORS} from './src/theme/theme';
import {requestUserPermission} from './src/configuration/firebaseMessaging';
import {getAuth} from '@react-native-firebase/auth';
import i18n, {initializeI18n} from './src/i18n';
import {I18nextProvider} from 'react-i18next';
import {navigationRef} from './src/utils/NavigationService';
import {
  handleNotificationNavigation,
  setupNotifications,
} from './src/configuration/notificationSetup';
import {getMessaging} from '@react-native-firebase/messaging';
import {CaptureProtection} from 'react-native-capture-protection';
import GPSModal from './src/components/GPSModal';
import GPSCheckWrapper from './src/components/GPSCheckWrapper';

const auth = getAuth();
if (__DEV__) {
  auth.useEmulator('http://127.0.0.1:9099');
  // auth.useEmulator('http://192.168.1.9:9099');
}

setupNotifications();

const App = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 2500);

    initializeI18n();
    requestUserPermission();

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
        <GPSProvider>
          <AuthProvider>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                handleInitialNotification();
              }}>
              <RootNavigator />
              <GPSCheckWrapper />
              <GPSModal />
            </NavigationContainer>
          </AuthProvider>
        </GPSProvider>
      </ToastProvider>
    </I18nextProvider>
  );
};

export default App;
