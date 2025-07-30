import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, StatusBar, Platform, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
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
  const {uuid, pandit_name, profile_img_url} = route.params as any;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const ws = useRef<WebSocket | null>(null);

  console.log('messages :: ', messages);

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
    if (accessToken && uuid) {
      const socketURL = `ws://192.168.1.10:8001/ws/chat/${uuid}/?token=${accessToken}`;
      ws.current = new WebSocket(socketURL);

      ws.current.onopen = () => {
        console.log('✅ Connected to WebSocket');
      };

      ws.current.onmessage = e => {
        const data = JSON.parse(e.data);
        console.log('e :: ', JSON.parse(e.data));
        const newMsg: Message = {
          id: data.uuid,
          text: data.message,
          time: new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: data.sender_id === userId,
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
  }, [accessToken, uuid, userId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchChatHistory();
    }, [userId]),
  );

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response = await getChatHistory(uuid);
      if (response) {
        const normalized = response.map((msg: any) => ({
          id: msg.uuid,
          text: msg.content || msg.message,
          time: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isOwn: msg.sender === userId || msg.sender_id === userId,
        }));
        setMessages(normalized);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({message: text}));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  return (
    <View style={{flex: 1}}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        <UserCustomHeader
          title={pandit_name}
          showBackButton={true}
          showCallButton={true}
        />
        <View style={styles.chatContainer}>
          <View style={styles.messagesContainer}>
            <ChatMessages messages={messages} />
          </View>
          <ChatInput onSendMessage={handleSendMessage} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primaryBackground,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingTop: moderateScale(24),
    minHeight: '100%',
    paddingBottom: Platform.OS === 'ios' ? 90 : 100,
  },
  messagesContainer: {
    flex: 1,
  },
});

export default UserChatScreen;
