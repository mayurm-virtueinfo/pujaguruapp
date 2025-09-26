import {PermissionsAndroid} from 'react-native';
import RNCallKeep from 'react-native-callkeep';

// Simple in-memory storage to correlate incoming calls with payload
const callUuidToPayload = new Map<string, any>();
let onAnswerCallback:
  | ((args: {callUUID: string; payload?: any}) => void)
  | null = null;

export const setOnAnswerListener = (
  cb: (args: {callUUID: string; payload?: any}) => void,
) => {
  onAnswerCallback = cb;
};

const options = {
  ios: {
    appName: 'PujaGuru',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription:
      'PujaGuru needs permission to manage calls and use microphone',
    cancelButton: 'Cancel',
    okButton: 'OK',
    imageName: 'ic_launcher',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
    // Required to get audio in background when using Android 11+
    foregroundService: {
      channelId: 'com.panditjiapp.pujaguru',
      channelName: 'PujaGuru Calls',
      notificationTitle: 'In-call service is running',
      notificationIcon: 'ic_launcher',
    },
  },
};

let setupDone = false;

export async function initCallKeep(): Promise<void> {
  if (setupDone) return;
  try {
    await RNCallKeep.setup(options as any);
    // Some versions expose setAvailable, others setReachable; guard call
    try {
      (RNCallKeep as any).setAvailable?.(true);
    } catch (_e) {}

    // Answer
    RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
      const payload = callUuidToPayload.get(callUUID);
      if (onAnswerCallback) {
        onAnswerCallback({callUUID, payload});
      }
    });

    // End
    RNCallKeep.addEventListener('endCall', ({callUUID}) => {
      callUuidToPayload.delete(callUUID);
    });

    // Did Display Incoming Call (Android)
    RNCallKeep.addEventListener('didDisplayIncomingCall', () => {
      // Keep mapping until answered/ended
    });

    setupDone = true;
  } catch (_e) {
    // setup may throw if permissions missing or module not ready
  }
}

export function displayIncomingCall(args: {
  callUUID: string;
  handle?: string;
  localizedCallerName?: string;
  hasVideo?: boolean;
  payload?: any;
}) {
  const {
    callUUID,
    handle = 'PujaGuru',
    localizedCallerName = 'Incoming call',
    hasVideo = true,
    payload,
  } = args;
  if (payload) {
    callUuidToPayload.set(callUUID, payload);
  }
  // Prefer signature: uuid, handle, localizedCallerName, handleType, hasVideo
  try {
    (RNCallKeep as any).displayIncomingCall(
      callUUID,
      handle,
      localizedCallerName,
      'generic',
      hasVideo,
    );
  } catch (_e) {
    // Fallback to older signature: uuid, handle, localizedCallerName, hasVideo, handleType
    (RNCallKeep as any).displayIncomingCall(
      callUUID,
      handle,
      localizedCallerName,
      hasVideo,
      'generic',
    );
  }
}

export function endIncomingCall(callUUID: string) {
  RNCallKeep.endCall(callUUID);
  callUuidToPayload.delete(callUUID);
}
