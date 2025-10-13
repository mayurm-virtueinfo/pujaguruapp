import PushNotification from 'react-native-push-notification';

export const startForegroundService = async (payload = {}) => {
  try {
    console.log('Starting foreground service...');

    // Reuse the same calls channel defined in notificationSetup for consistency
    PushNotification.createChannel(
      {
        channelId: 'calls',
        channelName: 'Call Notifications',
        channelDescription: 'Incoming call alerts with Accept/Decline',
        importance: 5,
        vibrate: true,
      },
      created => console.log(`createChannel returned '${created}'`),
    );

    PushNotification.localNotification({
      channelId: 'calls',
      autoCancel: false,
      ongoing: true,
      title: 'Incoming Call',
      message: 'Tap Accept to join, Decline to dismiss',
      color: 'red',
      playSound: false,
      soundName: 'default',
      allowWhileIdle: true,
      priority: 'high',
      visibility: 'public',
      importance: 'high',
      // Ensure action press launches the app even in kill mode
      invokeApp: false,
      actions: ['Accept', 'Decline'],
      data: payload,
      userInfo: payload,
    });
  } catch (e) {
    console.error('Foreground service start failed:', e);
  }
};
