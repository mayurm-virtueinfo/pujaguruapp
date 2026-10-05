import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  placeholder?: string;
  isKeyboardOpen?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder,
  isKeyboardOpen = false,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleSend = () => {
    if (message.trim()) {
      const messageToSend = message.trim();
      setMessage('');
      onSendMessage(messageToSend);
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const hasText = message.trim().length > 0;

  // When keyboard is open, don't double-pad for bottom home indicator
  const bottomPadding = isKeyboardOpen
    ? moderateScale(8)
    : Math.max(insets.bottom, moderateScale(10));

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View
        style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
      >
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => handleQuickEmoji('🙏 ')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="happy-outline"
            size={moderateScale(22)}
            color={isFocused ? COLORS.primaryBackground : '#94A3B8'}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={
            placeholder ||
            t('type_your_message', { defaultValue: 'Type your message...' })
          }
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          returnKeyType="default"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            hasText ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!hasText}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="send"
            size={moderateScale(16)}
            color={hasText ? '#FFFFFF' : '#94A3B8'}
            style={{ marginLeft: moderateScale(2) }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(8),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F8',
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    borderColor: '#E8ECF2',
    paddingHorizontal: moderateScale(8),
    paddingVertical:
      Platform.OS === 'ios' ? moderateScale(4) : moderateScale(2),
  },
  inputWrapperFocused: {
    borderColor: COLORS.primaryBackground,
    backgroundColor: '#FFFFFF',
  },
  emojiButton: {
    padding: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#1E293B',
    maxHeight: moderateScale(100),
    minHeight: moderateScale(38),
    paddingHorizontal: moderateScale(8),
    paddingVertical:
      Platform.OS === 'ios' ? moderateScale(8) : moderateScale(6),
    textAlignVertical: 'center',
  },
  sendButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primaryBackground,
    shadowColor: COLORS.primaryBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
});

export default ChatInput;
