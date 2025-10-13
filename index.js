/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import PushNotification from 'react-native-push-notification';
import {
  handlePushAction,
  handlePushNotification,
} from './src/configuration/notificationSetup';

// Must be outside of any component LifeCycle
PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },
  onNotification: function (notification) {
    try {
      handlePushNotification(notification);
      // iOS finish
      //   try {
      //     notification.finish(PushNotificationIOS.FetchResult.NoData);
      //   } catch {}
    } catch (e) {
      console.warn('onNotification error', e);
    }
  },
  onAction: function (notification) {
    try {
      handlePushAction(notification);
    } catch (e) {
      console.warn('onAction error', e);
    }
  },
  onRegistrationError: function (err) {
    console.error(err.message, err);
  },
  permissions: {alert: true, badge: true, sound: true},
  popInitialNotification: true,
  requestPermissions: true,
});

AppRegistry.registerComponent(appName, () => App);
