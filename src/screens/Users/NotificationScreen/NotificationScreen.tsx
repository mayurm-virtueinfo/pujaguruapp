import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {useTranslation} from 'react-i18next';
import {moderateScale} from 'react-native-size-matters';
import NotificationItem from './NotificationItem';
import {apiService} from '../../../api/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Use NotificationData interface from apiService
import type {NotificationData} from '../../../api/apiService';

const NotificationScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getNotificationData();
        setNotifications(data);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />

      <UserCustomHeader
        title={t('notifications')}
        showBackButton={true}
        showSliderButton={true}
      />

      <View style={styles.outerContentWrapper}>
        <View style={styles.contentContainer}>
          {loading ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <View
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{
                  color: COLORS.error,
                  fontFamily: Fonts.Sen_Medium,
                  fontSize: 16,
                }}>
                {error}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}>
              <View style={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <Text
                    style={{
                      textAlign: 'center',
                      color: COLORS.textGray,
                      fontFamily: Fonts.Sen_Medium,
                    }}>
                    {t('no_notifications')}
                  </Text>
                ) : (
                  notifications.map((notification, index) => (
                    <NotificationItem
                      key={String(notification.id)}
                      notification={{
                        ...notification,
                        id: String(notification.id),
                      }}
                      isLast={index === notifications.length - 1}
                    />
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  outerContentWrapper: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    margin: 24,
    ...THEMESHADOW.shadow,
  },
  notificationsList: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    flex: 1,
  },
});

export default NotificationScreen;
