import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Fonts from '../theme/fonts';
import { COLORS } from '../theme/theme';

export interface ChatBubbleProps {
  text: string;
  time: string;
  isOwn: boolean;
  date?: string;
  panditAvatar?: string;
  panditName?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  text,
  time,
  isOwn,
  panditAvatar,
  panditName,
}) => {
  if (isOwn) {
    return (
      <View style={styles.ownContainer}>
        <LinearGradient
          colors={['#FB3440', '#EA1B29']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ownBubble}
        >
          <Text style={styles.ownMessageText}>{text}</Text>
          <View style={styles.ownMetaRow}>
            <Text style={styles.ownTimeText}>{time}</Text>
            <Ionicons
              name="checkmark-done"
              size={moderateScale(13)}
              color="rgba(255, 255, 255, 0.9)"
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.otherContainer}>
      <View style={styles.otherAvatarWrapper}>
        {panditAvatar ? (
          <Image source={{ uri: panditAvatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <MaterialIcons
              name="person"
              size={moderateScale(15)}
              color={COLORS.primaryBackground}
            />
          </View>
        )}
      </View>

      <View style={styles.otherBubble}>
        <Text style={styles.otherMessageText}>{text}</Text>
        <View style={styles.otherMetaRow}>
          <Text style={styles.otherTimeText}>{time}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ownContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginVertical: moderateScale(4),
    maxWidth: '82%',
  },
  ownBubble: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(8),
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    borderBottomLeftRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(4),
    shadowColor: '#FB3440',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  ownMessageText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#FFFFFF',
    lineHeight: moderateScale(20),
  },
  ownMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: moderateScale(4),
    gap: moderateScale(4),
  },
  ownTimeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  otherContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    marginVertical: moderateScale(4),
    maxWidth: '84%',
  },
  otherAvatarWrapper: {
    marginRight: moderateScale(8),
    marginBottom: moderateScale(2),
  },
  avatarImage: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD4D8',
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(8),
    borderTopLeftRadius: moderateScale(18),
    borderTopRightRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(18),
    borderBottomLeftRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  otherMessageText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#1E293B',
    lineHeight: moderateScale(20),
  },
  otherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: moderateScale(4),
  },
  otherTimeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },
});

export default ChatBubble;
