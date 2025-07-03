import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {moderateScale} from 'react-native-size-matters';
import {COLORS, SCREEN_HEIGHT} from '../../../theme/theme';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import CustomHeader from '../../../components/CustomHeader';
import UserCustomHeader from '../../../components/UserCustomHeader';

export interface Message {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
}

const UserChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Are you coming?',
      time: '8:10 pm',
      isOwn: true,
    },
    {
      id: '2',
      text: "I'm Coming , just wait ...",
      time: '8:12 pm',
      isOwn: false,
    },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isOwn: true,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title="Ramesh Purohit"
        showBackButton={true}
        showCallButton={true}
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.chatContainer}>
          <View style={styles.messagesContainer}>
            <ChatMessages messages={messages} />
          </View>
          <ChatInput onSendMessage={handleSendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flex1: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingTop: moderateScale(24),
    minHeight: SCREEN_HEIGHT * 0.7,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
  },
});

export default UserChatScreen;
