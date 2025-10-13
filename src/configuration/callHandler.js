import RNCallKeep from 'react-native-callkeep';
import {AppState, Linking} from 'react-native';

export const handleIncomingCall = data => {
  console.log('New test 3 : handleIncomingCall:', data);
  const callUUID = data.callId || `uuid-${Date.now()}`;
  Linking.openURL('pujaguru://video/' + callUUID);
  RNCallKeep.displayIncomingCall(
    callUUID,
    'PujaGuru',
    data.callerName || 'Unknown Caller',
    'Video',
    'number',
    true,
  );
};

export const handleAnswerCall = async callUUID => {
  console.log('New test 4 : handleAnswerCall:', callUUID);

  // If the app is killed or backgrounded, ensure it's brought to foreground
  try {
    console.log(
      'New test 5 : Opening app via deep link:',
      'pujaguru://video/' + callUUID,
    );
    Linking.openURL('pujaguru://video/' + callUUID);
  } catch (e) {
    console.log('New test 6 : Error opening app via deep link:', e);
  }
};
