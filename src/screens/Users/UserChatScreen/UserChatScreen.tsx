import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Text,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from 'react-native-size-matters';
import {COLORS} from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import ChatMessages from '../../../components/ChatMessages';
import ChatInput from '../../../components/ChatInput';
import {
  useFocusEffect,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import {
  getChatHistory as getMessageHistory,
  postCreateMeeting,
} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomeLoader from '../../../components/CustomeLoader';

export interface Message {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const UserChatScreen: React.FC = () => {
  const route = useRoute() as any;
  const navigation = useNavigation();
  const {booking_id, pandit_name, profile_img_url, pandit_id, user_id} =
    route.params || {};

  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [meetingToken, setMeetingToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>(
    'https://meet.puja-guru.com/',
  );

  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const isUserAtBottom = useRef(true);
  const jitsiMeeting = useRef<any>(null);

  let JitsiMeeting: any = null;
  try {
    // @ts-ignore
    JitsiMeeting = require('@jitsi/react-native-sdk').JitsiMeeting;
  } catch (e) {
    // If not available, JitsiMeeting remains null
    JitsiMeeting = null;
  }

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
      const uid = await AsyncStorage.getItem(AppConstant.USER_ID);
      setAccessToken(token);
      setMyUserId(uid);
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (accessToken && booking_id) {
      let socketURL = `ws://puja-guru.com:9000/ws/chat/by-booking/${booking_id}/?token=${accessToken}`;
      ws.current = new WebSocket(socketURL);
      ws.current.onopen = () => console.log('✅ Connected to WebSocket');
      ws.current.onmessage = e => {
        const data = JSON.parse(e.data);
        const newMsg: Message = {
          id: data.uuid,
          text: data.message,
          time: new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: data.sender_id == myUserId,
        };
        setMessages(prev => [...prev, newMsg]);
      };
      ws.current.onerror = e => console.error('WebSocket error:', e.message);
      ws.current.onclose = e =>
        console.log('WebSocket closed:', e.code, e.reason);
      return () => ws.current?.close();
    }
  }, [accessToken, myUserId, booking_id]);

  useFocusEffect(
    useCallback(() => {
      fetchChatHistory();
    }, [myUserId, booking_id]),
  );

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response: any = await getMessageHistory(booking_id);
      if (response) {
        const normalized = response.map((msg: any) => ({
          id: msg.uuid,
          text: msg.content || msg.message,
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: msg.sender == myUserId,
        }));
        setMessages(normalized);
        isUserAtBottom.current = true;
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = useCallback((animated = true) => {
    if (scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({animated}), 100);
    }
  }, []);

  const handleSendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        message: text,
        sender_id: myUserId,
        receiver_id: pandit_id,
      };
      ws.current.send(JSON.stringify(messageData));
      isUserAtBottom.current = true;
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const handleScroll = (event: any) => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const isAtBottom =
      contentOffset.y >= contentSize.height - layoutMeasurement.height - 10;
    isUserAtBottom.current = isAtBottom;
  };

  useEffect(() => {
    if (isUserAtBottom.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // --- REWRITE handleVideoCall to always use room_name, token, server_url if present, and fallback to meeting_url only if those are missing ---
  const handleVideoCall = () => {
    if (!booking_id) {
      Alert.alert('Error', 'No booking ID available for video call.');
      return;
    }
    setLoading(true);
    postCreateMeeting(booking_id)
      .then(response => {
        // Accept both response.data and response at root
        const data = response?.data || response;
        if (data?.room_name && data?.token) {
          setRoomName(String(data.room_name));
          setMeetingToken(String(data.token));
          setServerUrl(
            data.server_url
              ? String(data.server_url)
              : 'https://meet.puja-guru.com/',
          );
          setInCall(true);
        } else if (data?.meeting_url) {
          // Fallback: parse room from meeting_url
          const meetingUrl = String(data.meeting_url);
          let url = meetingUrl.endsWith('/')
            ? meetingUrl.slice(0, -1)
            : meetingUrl;
          const lastSlashIdx = url.lastIndexOf('/');
          let room =
            lastSlashIdx === -1
              ? 'defaultRoom'
              : url.substring(lastSlashIdx + 1);
          const queryIdx = room.indexOf('?');
          room =
            queryIdx !== -1
              ? room.substring(0, queryIdx)
              : room || 'defaultRoom';
          setRoomName(String(room));
          setMeetingToken(null);
          setServerUrl('https://meet.puja-guru.com/');
          setInCall(true);
        } else {
          Alert.alert('Error', 'Meeting information not found.');
        }
      })
      .catch(error => {
        console.error('Failed to create meeting:', error);
        Alert.alert(
          'Error',
          'Failed to create video meeting. Please try again.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };
  // --- END REWRITE ---

  // JitsiMeeting event handlers
  const onReadyToClose = useCallback(() => {
    setInCall(false);
    setRoomName(null);
    setMeetingToken(null);
    if (
      jitsiMeeting.current &&
      typeof jitsiMeeting.current.close === 'function'
    ) {
      jitsiMeeting.current.close();
    }
  }, [navigation]);

  const onEndpointMessageReceived = useCallback(() => {
    console.log('You got a message!');
  }, []);

  const eventListeners = {
    onReadyToClose,
    onEndpointMessageReceived,
  };

  console.log('JitsiMeeting', JitsiMeeting);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.primaryBackground,
        paddingTop: insets.top,
      }}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
        translucent
      />
      <View style={styles.safeArea}>
        <UserCustomHeader
          title={pandit_name || 'Chat'}
          showBackButton={true}
          showVideoCallButton={true}
          onVideoButtonPress={handleVideoCall}
        />
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={
            Platform.OS === 'ios' ? moderateScale(90) : 0
          }>
          {!inCall ? (
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={{flexGrow: 1, justifyContent: 'flex-end'}}
              ref={scrollViewRef}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (isUserAtBottom.current) {
                  scrollToBottom();
                }
              }}
              keyboardShouldPersistTaps="handled">
              {messages.length === 0 ? (
                <View style={styles.noChatContainer}>
                  <Text style={styles.noChatText}>
                    No chat messages yet. Start the conversation!
                  </Text>
                </View>
              ) : (
                <ChatMessages messages={messages} />
              )}
            </ScrollView>
          ) : JitsiMeeting ? (
            <JitsiMeeting
              ref={jitsiMeeting}
              room={roomName ? String(roomName) : 'defaultRoom'}
              serverURL={
                serverUrl ? String(serverUrl) : 'https://meet.puja-guru.com/'
              }
              token={meetingToken ? String(meetingToken) : undefined}
              config={{
                hideConferenceTimer: true,
                whiteboard: {
                  enabled: true,
                  collabServerBaseUrl: serverUrl
                    ? String(serverUrl)
                    : 'https://meet.puja-guru.com/',
                },
                analytics: {
                  disabled: true,
                },
              }}
              eventListeners={eventListeners as any}
              flags={{
                'audioMute.enabled': true,
                'ios.screensharing.enabled': true,
                'fullscreen.enabled': false,
                'audioOnly.enabled': false,
                'android.screensharing.enabled': true,
                'pip.enabled': true,
                'pip-while-screen-sharing.enabled': true,
                'conference-timer.enabled': true,
                'close-captions.enabled': false,
                'toolbox.enabled': true,
              }}
              style={styles.jitsiView}
            />
          ) : (
            <View style={styles.jitsiView}>
              <Text style={{color: '#fff', textAlign: 'center', marginTop: 40}}>
                Video call is not available. Please check your app installation.
              </Text>
            </View>
          )}
          {!inCall && <ChatInput onSendMessage={handleSendMessage} />}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingTop: moderateScale(24),
  },
  messagesContainer: {
    flex: 1,
  },
  noChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(24),
  },
  noChatText: {
    color: COLORS.textSecondary || '#888',
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: moderateScale(20),
    fontWeight: '500',
  },
  jitsiView: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default UserChatScreen;
