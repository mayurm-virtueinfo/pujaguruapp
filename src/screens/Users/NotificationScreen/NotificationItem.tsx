import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {moderateScale} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

interface NotificationItemProps {
  notification: NotificationData;
  isLast?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isLast = false,
}) => {
  const navigation = useNavigation();

  const handleNotificationPress = () => {
    // Navigate based on notification type
    const title = notification.title.toLowerCase();

    if (title.includes('cancelled') || title.includes('cancellation')) {
      // Navigate to wallet screen for cancellation notifications
      navigation.navigate('WalletScreen' as never);
    } else if (title.includes('puja') || title.includes('pooja')) {
      // Navigate to puja details or booking history
      navigation.navigate('BottomUserProfileScreen' as never);
    } else {
      // Default navigation
      navigation.navigate('BottomUserProfileScreen' as never);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleNotificationPress}
      activeOpacity={0.7}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.timestamp}>{notification.timestamp}</Text>
      </View>

      <Text style={styles.message}>{notification.message}</Text>

      {!isLast && <View style={styles.separator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(2),
    borderRadius: moderateScale(8),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(4),
    gap: moderateScale(20),
  },
  title: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'right',
  },
  message: {
    color: COLORS.textDark,
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    marginBottom: moderateScale(13),
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginBottom: moderateScale(14),
  },
});

export default NotificationItem;
