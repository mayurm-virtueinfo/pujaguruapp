import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import ChatBubble from './ChatBubble';
import { Message } from '../screens/Users/UserChatScreen/UserChatScreen';
import Fonts from '../theme/fonts';

interface ChatMessagesProps {
  messages: Message[];
  panditName?: string;
  panditAvatar?: string;
}

const formatSeparatorDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

  if (dateStr === todayStr) {
    return 'Today';
  }
  if (dateStr === yesterdayStr) {
    return 'Yesterday';
  }

  // Format as readable date e.g. "05 Oct 2026"
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10),
      );
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
  } catch (_e) {}

  return dateStr;
};

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  panditName,
  panditAvatar,
}) => {
  return (
    <View style={styles.container}>
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator =
          Boolean(message.date) &&
          (!prevMessage || prevMessage.date !== message.date);

        return (
          <React.Fragment key={message.id || index}>
            {showDateSeparator && message.date && (
              <View style={styles.dateSeparatorContainer}>
                <View style={styles.dateSeparatorPill}>
                  <Text style={styles.dateSeparatorText}>
                    {formatSeparatorDate(message.date)}
                  </Text>
                </View>
              </View>
            )}
            <ChatBubble
              text={message.text}
              time={message.time}
              isOwn={message.isOwn}
              date={message.date}
              panditAvatar={panditAvatar}
              panditName={panditName}
            />
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: moderateScale(12),
  },
  dateSeparatorPill: {
    backgroundColor: '#EDF1F7',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  dateSeparatorText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
});

export default ChatMessages;
