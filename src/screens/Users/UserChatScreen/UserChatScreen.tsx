import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, StyleSheet, StatusBar, ScrollView, Text} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from 'react-native-size-matters';
import {COLORS} from '../../../theme/theme';
import ChatMessages from '../../../components/ChatMessages';
import ChatInput from '../../../components/ChatInput';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {getChatHistory} from '../../../api/apiService';
import CustomeLoader from '../../../components/CustomeLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';

export interface Message {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const UserChatScreen: React.FC = () => {
  const route = useRoute();
  const {booking_id, pandit_name, profile_img_url, pandit_id} =
    route.params as any;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const inset = useSafeAreaInsets();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const access_token = await AsyncStorage.getItem(
          AppConstant.ACCESS_TOKEN,
        );
        const uid = await AsyncStorage.getItem(AppConstant.USER_ID);
        setAccessToken(access_token || '');
        setUserId(uid ? Number(uid) : null);
      } catch (error) {
        console.error('Error fetching auth data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (accessToken && booking_id) {
      const socketURL = `ws://192.168.1.10:8081/ws/chat/by-booking/${booking_id}/?token=${accessToken}`;
      ws.current = new WebSocket(socketURL);

      console.log('socketURL : ', socketURL);

      ws.current.onopen = () => {
        console.log('✅ Connected to WebSocket');
      };

      ws.current.onmessage = e => {
        const data = JSON.parse(e.data);
        const newMsg: Message = {
          id: data.uuid,
          text: data.message,
          time: new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: data.sender_id == userId,
        };
        setMessages(prev => [...prev, newMsg]);
      };

      ws.current.onerror = e => {
        console.error('WebSocket error:', e.message);
      };

      ws.current.onclose = e => {
        console.log('WebSocket closed:', e.code, e.reason);
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [accessToken, userId]);

  useFocusEffect(
    useCallback(() => {
      const fetchChatHistory = async () => {
        setLoading(true);
        try {
          const response = await getChatHistory(booking_id);
          if (response) {
            const normalized = response.map((msg: any) => ({
              id: msg.uuid,
              text: msg.content,
              time: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              isOwn: msg.sender == userId,
            }));
            setMessages(normalized);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchChatHistory();
    }, [userId, booking_id]),
  );

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        message: text,
        sender_id: userId,
        receiver_id: pandit_id,
      };
      ws.current.send(JSON.stringify(messageData));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.primaryBackground,
        paddingTop: inset.top,
      }}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
        translucent
      />
      <View style={[styles.safeArea]}>
        <UserCustomHeader
          title={pandit_name}
          showBackButton={true}
          showCallButton={true}
        />
        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {messages.length === 0 && !loading ? (
              <View style={styles.noMessagesContainer}>
                <Text style={styles.noMessagesText}>No messages</Text>
              </View>
            ) : (
              <ChatMessages messages={messages} />
            )}
          </ScrollView>
          <ChatInput onSendMessage={handleSendMessage} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primaryBackground,
    flex: 1,
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
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMessagesText: {
    fontSize: moderateScale(16),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default UserChatScreen;
