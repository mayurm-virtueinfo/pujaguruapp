// src/configuration/callValidation.ts
import { Linking } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { navigate, navigationRef } from '../utils/NavigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const callUuidToPayload = new Map<string, any>();
let onAnswerCallback: ((args: { callUUID: string; payload?: any }) => void) | null = null;
let onEndCallback: ((args: { callUUID: string }) => void) | null = null;

export const setOnAnswerListener = (cb: (args: { callUUID: string; payload?: any }) => void) => {
    onAnswerCallback = cb;
};

export const setOnEndListener = (cb: (args: { callUUID: string }) => void) => {
    onEndCallback = cb;
};

const options = { /* keep your existing options */ };

let setupDone = false;
export async function initCallKeep(): Promise<void> {
    if (setupDone) return;
    try {
        await RNCallKeep.setup(options as any);
        (RNCallKeep as any).setAvailable?.(true);

        RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
            console.log('RNCallKeep answerCall', callUUID);
            let payload = callUuidToPayload.get(callUUID);
            if (!payload) {
                const storedPayload = await AsyncStorage.getItem(`callPayload_${callUUID}`);
                if (storedPayload) payload = JSON.parse(storedPayload);
            }

            if (onAnswerCallback) onAnswerCallback({ callUUID, payload });

            // keep deep-link navigation as fallback (app may get launched)
            if (payload?.meeting_url) {
                const room = encodeURIComponent(payload.meeting_url.split('/').pop() || 'defaultRoom');
                Linking.openURL(`pujaguru://video?room=${room}&uuid=${encodeURIComponent(callUUID)}`)
                    .catch(e => console.warn('openURL failed', e));
            }
        });

        RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
            console.log('RNCallKeep endCall', callUUID);
            callUuidToPayload.delete(callUUID);
            AsyncStorage.removeItem(`callPayload_${callUUID}`);
            if (onEndCallback) onEndCallback({ callUUID });
        });

        setupDone = true;
    } catch (e) {
        console.warn('initCallKeep error', e);
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
        AsyncStorage.setItem(`callPayload_${callUUID}`, JSON.stringify(payload));
        // auto-end after 30s
        setTimeout(() => {
            if (callUuidToPayload.has(callUUID)) {
                endIncomingCall(callUUID);
            }
        }, 30000);
    }

    // single invocation of RNCallKeep
    try {
        (RNCallKeep as any).displayIncomingCall(
            callUUID,
            handle,
            localizedCallerName,
            'generic',
            hasVideo,
        );
    } catch (err) {
        // older signature fallback
        (RNCallKeep as any).displayIncomingCall(callUUID, handle, localizedCallerName, hasVideo, 'generic');
    }
}

export function endIncomingCall(callUUID: string) {
    RNCallKeep.endCall(callUUID);
    callUuidToPayload.delete(callUUID);
    AsyncStorage.removeItem(`callPayload_${callUUID}`);
}
