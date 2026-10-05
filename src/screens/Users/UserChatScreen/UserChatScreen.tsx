import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
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
import { getWebSocketBaseUrl } from '../../../api/apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomeLoader from '../../../components/CustomeLoader';
import { handleIncomingMessage } from '../../../helper/helper';
import { requestCallPermissions } from '../../../configuration/firebaseMessaging';

export interface Message {
  id: string;
  text: string;
  time: string;
  date?: string;
  isOwn: boolean;
}

const formatDate = (dateObj: Date): string => {
  const y = dateObj.getFullYear();
  const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const d = dateObj.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const SUGGESTED_MESSAGES = [
  '🙏 Namaste Panditji',
  '📋 What samagri do I need?',
  '⏰ Please confirm the puja time',
];

const UserChatScreen: React.FC = () => {
  const route = useRoute() as any;
  const navigation = useNavigation();
  const {
    booking_id,
    pandit_name,
    profile_img_url,
    pandit_id,
    user_id,
    video_call,
  } = route.params || {};

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const isUserAtBottom = useRef(true);
  const jitsiMeeting = useRef<any>(null);
  const autoCallInitiated = useRef(false);

  let JitsiMeeting: any = null;
  try {
    JitsiMeeting = require('@jitsi/react-native-sdk').JitsiMeeting;
  } catch (e) {
    JitsiMeeting = null;
  }

  // Hide bottom tab bar while in chat screen; restore on blur
  useFocusEffect(
    useCallback(() => {
      const parent = (navigation as any)?.getParent?.();
      if (parent && typeof parent.setOptions === 'function') {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
      }
      return () => {
        if (parent && typeof parent.setOptions === 'function') {
          parent.setOptions({ tabBarStyle: undefined });
        }
      };
    }, [navigation]),
  );

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
      const uid = await AsyncStorage.getItem(AppConstant.USER_ID);
      const current_user = await AsyncStorage.getItem(AppConstant.CURRENT_USER);

      setAccessToken(token);
      setMyUserId(uid);
      try {
        setCurrentUser(current_user ? JSON.parse(current_user) : null);
      } catch (_e) {
        setCurrentUser(null);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (accessToken && booking_id) {
      const wsBaseUrl = getWebSocketBaseUrl();
      const socketURL = `${wsBaseUrl}/ws/chat/by-booking/${booking_id}/?token=${accessToken}`;
      console.log('socketURL :: ', socketURL);

      ws.current = new WebSocket(socketURL);
      ws.current.onopen = () => console.log('Connected to WebSocket');
      ws.current.onmessage = e => {
        const data = JSON.parse(e.data);
        console.log('Chat Data ::', data);

        setMessages(prev => {
          const normalized = handleIncomingMessage(prev, data, myUserId);

          if (normalized.length > 0) {
            const lastIdx = normalized.length - 1;
            const rawTimestamp = data.timestamp;
            let dateStr = '';
            if (rawTimestamp) {
              try {
                const dateObj = new Date(rawTimestamp);
                dateStr = formatDate(dateObj);
              } catch {
                dateStr = '';
              }
            }
            if (!normalized[lastIdx].date) {
              normalized[lastIdx] = {
                ...normalized[lastIdx],
                date: dateStr,
              };
            }
          }
          return normalized;
        });

        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      };
      ws.current.onerror = e => console.error('WebSocket error:', e.message);
      ws.current.onclose = e =>
        console.log('WebSocket closed:', e.code, e.reason);
      return () => ws.current?.close();
    }
  }, [accessToken, myUserId, booking_id]);

  useEffect(() => {
    const isVideoCall =
      video_call === true ||
      video_call === 'true' ||
      video_call === 1 ||
      video_call === '1';
    if (!autoCallInitiated.current && isVideoCall && booking_id) {
      autoCallInitiated.current = true;
      handleVideoCall();
    }
  }, [video_call, booking_id]);

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
        const normalized = response.map((msg: any) => {
          const dateObj = msg.timestamp ? new Date(msg.timestamp) : new Date();
          return {
            id: msg.uuid,
            text: msg.content || msg.message,
            time: dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            date: formatDate(dateObj),
            isOwn: msg.sender == myUserId,
          };
        });
        setMessages(normalized);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 150);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = useCallback((animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated });
    }
  }, []);

  // Listen to keyboard show/hide to smoothly maintain chat position
  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToBottom]);

  const handleSendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const tempId = `temp-${Date.now()}`;
      const now = new Date();

      const messageData = {
        message: text,
        sender_id: myUserId,
        receiver_id: pandit_id,
      };

      const newMsg: Message = {
        id: tempId,
        text,
        time: now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        date: formatDate(now),
        isOwn: true,
      };

      setMessages(prev => [...prev, newMsg]);
      try {
        ws.current.send(JSON.stringify(messageData));
        setTimeout(() => {
          scrollToBottom(true);
        }, 80);
      } catch (err) {
        console.log('Send failed:', err);
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y >= contentSize.height - layoutMeasurement.height - 20;
    isUserAtBottom.current = isAtBottom;
  };

  const handleVideoCall = async () => {
    const hasPermission = await requestCallPermissions();
    if (!hasPermission) return;
    if (!booking_id) {
      Alert.alert('Error', 'No booking ID available for video call.');
      return;
    }
    setLoading(true);
    postCreateMeeting(booking_id)
      .then(response => {
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
  }, []);

  const onEndpointMessageReceived = useCallback(() => {}, []);

  const eventListeners = {
    onReadyToClose,
    onEndpointMessageReceived,
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
        translucent={inCall}
        hidden={inCall}
      />

      {/* Red Header Section */}
      {!inCall && (
        <View
          style={[
            styles.headerWrapper,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={moderateScale(24)}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerName} numberOfLines={1}>
                {pandit_name || 'Chat'}
              </Text>
              {booking_id && (
                <View style={styles.headerSubtitleRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.headerSubtitle}>
                    Booking #{booking_id}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {/* Video call commented out: functionality not complete yet
              <TouchableOpacity
                onPress={handleVideoCall}
                style={styles.videoCallButton}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="videocam"
                  size={moderateScale(20)}
                  color={COLORS.white}
                />
              </TouchableOpacity>
              */}
            </View>
          </View>
          {/* Subtle extension behind curved top corners */}
          <View style={styles.headerCurveExtension} />
        </View>
      )}

      {/* Chat Canvas */}
      <View
        style={[
          styles.chatCanvas,
          !inCall && styles.chatCanvasOffset,
          inCall && {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            backgroundColor: '#000000',
          },
        ]}
      >
        {!inCall ? (
          <View style={styles.chatBody}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[
                styles.messagesContent,
                messages.length === 0 && styles.messagesContentEmpty,
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconBadge}>
                    <Ionicons
                      name="chatbubbles"
                      size={moderateScale(38)}
                      color={COLORS.primaryBackground}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    Direct Chat with {pandit_name || 'Panditji'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Have any questions regarding puja preparation, samagri, or
                    timings? Send a message to get started.
                  </Text>

                  <View style={styles.suggestionsWrapper}>
                    <Text style={styles.suggestionsHeader}>Quick Prompts</Text>
                    <View style={styles.suggestionChipsList}>
                      {SUGGESTED_MESSAGES.map((msg, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => handleSendMessage(msg)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.suggestionChipText}>{msg}</Text>
                          <Ionicons
                            name="arrow-up-circle"
                            size={moderateScale(18)}
                            color={COLORS.primaryBackground}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                <ChatMessages
                  messages={messages}
                  panditName={pandit_name}
                  panditAvatar={profile_img_url}
                />
              )}
            </ScrollView>

            <ChatInput
              onSendMessage={handleSendMessage}
              isKeyboardOpen={isKeyboardOpen}
            />
          </View>
        ) : JitsiMeeting ? (
          <JitsiMeeting
            ref={jitsiMeeting}
            room={roomName || 'defaultRoom'}
            serverURL={serverUrl}
            token={meetingToken || undefined}
            disableScreenSharing={true}
            disableInviteFunctions={true}
            userInfo={{
              displayName: currentUser?.first_name || 'User',
              email: currentUser?.email || '',
              avatarUrl: profile_img_url || currentUser?.profile_img_url,
            }}
            config={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              hideConferenceTimer: true,
              prejoinPageEnabled: false,
              requireDisplayName: false,
              toolbarButtons: [
                'microphone',
                'camera',
                'hangup',
                'tileview',
                'fullscreen',
              ],
            }}
            flags={{
              'audio-mute.enabled': true,
              'audio-unmute.enabled': true,
              'video-mute.enabled': true,
              'video-unmute.enabled': true,
              'fullscreen.enabled': true,
              'toolbox.enabled': true,
              'microphone.enabled': true,
              'camera.enabled': true,
              'chat.enabled': false,
              'pip.enabled': true,
              'tile-view.enabled': true,
              'ios.screensharing.enabled': true,
              'android.screensharing.enabled': true,
            }}
            eventListeners={eventListeners}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.jitsiFallbackView}>
            <Text style={styles.jitsiFallbackText}>
              Video call is not available. Please check your app installation.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background under keyboard prevents red bleed
  },
  headerWrapper: {
    backgroundColor: COLORS.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
  },
  headerCurveExtension: {
    height: moderateScale(20),
    backgroundColor: COLORS.primaryBackground,
  },
  backButton: {
    padding: moderateScale(4),
    width: moderateScale(36),
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  onlineDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#86EFAC',
    marginRight: moderateScale(5),
  },
  headerSubtitle: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerRight: {
    width: moderateScale(36),
    alignItems: 'flex-end',
  },
  videoCallButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },

  chatCanvas: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
  },
  chatCanvasOffset: {
    marginTop: -moderateScale(20),
  },
  chatBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingVertical: moderateScale(12),
  },
  messagesContentEmpty: {
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(28),
    paddingVertical: moderateScale(32),
  },
  emptyIconBadge: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#FFEAEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FFD4D8',
  },
  emptyTitle: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  suggestionsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  suggestionsHeader: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: moderateScale(10),
  },
  suggestionChipsList: {
    width: '100%',
    gap: moderateScale(8),
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionChipText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#334155',
  },

  jitsiFallbackView: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(20),
  },
  jitsiFallbackText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Regular,
  },
});

export default UserChatScreen;
