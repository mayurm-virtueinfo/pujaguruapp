import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Fonts from '../../../theme/fonts';
import {
  COLORS,
  THEMESHADOW,
  COMMON_LIST_STYLE,
  COMMON_CARD_STYLE,
} from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../../i18n';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { useAuth } from '../../../provider/AuthProvider';
import {
  deleteAccount,
  getEditProfile,
  postLogout,
} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomModal from '../../../components/CustomModal';
import CustomeLoader from '../../../components/CustomeLoader';
import { getFcmToken } from '../../../configuration/firebaseMessaging';
import { translateData, translateText } from '../../../utils/TranslateData';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import { moderateScale } from 'react-native-size-matters';

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

type ProfileNavigationProp = StackNavigationProp<
  UserProfileParamList & AuthStackParamList
>;

const BottomUserProfileScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const { signOutApp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] =
    useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  interface Address {
    address_line1: string;
    address_line2: string;
    address_type: number;
    address_type_name: string;
    city: number;
    city_name: string;
    latitude: string;
    longitude: string;
    phone_number: string;
  }

  interface CurrentUser {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
    profile_img?: string;
    address?: Address;
    id: number;
    role: number;
    uuid: string;
  }

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const translationCacheRef = useRef<Map<string, any>>(new Map());

  console.log('currentUser :: ', currentUser);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);

      const cachedTranslation =
        translationCacheRef.current.get(currentLanguage);
      if (cachedTranslation) {
        setCurrentUser(cachedTranslation);
        return;
      }

      const response: any = await getEditProfile();
      if (response) {
        const translated: any = await translateData(response, currentLanguage, [
          'first_name',
          'last_name',
          'city_name',
        ]);
        if (translated.address && translated.address.city_name) {
          translated.address.city_name = await translateText(
            translated.address.city_name,
            currentLanguage,
          );
        }
        translationCacheRef.current.set(currentLanguage, translated);
        setCurrentUser(translated);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      if (translationCacheRef.current.has(currentLanguage)) {
        translationCacheRef.current.delete(currentLanguage);
      }
      fetchCurrentUser();
    }, [fetchCurrentUser]),
  );

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await notifee.cancelAllNotifications();
      const refreshToken =
        (await AsyncStorage.getItem(AppConstant.REFRESH_TOKEN)) || '';
      const fcmToken = (await getFcmToken()) || '';
      try {
        await messaging().deleteToken();
      } catch (messagingError) {
        console.warn(
          'Unable to delete FCM token during logout, proceeding anyway',
          messagingError,
        );
      }

      const params = {
        refresh_token: refreshToken,
        device_token: fcmToken,
      };

      // Attempt server-side logout, but don't block local logout on failure
      try {
        await postLogout(params);
      } catch (apiError) {
        console.warn(
          'Server logout failed, proceeding with local logout',
          apiError,
        );
      }

      try {
        await changeLanguage('en');
      } catch (e) {
        console.warn('Language reset failed', e);
      }

      // Always perform local sign out
      signOutApp();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Ensure we still try to sign out locally if major errors occur
      signOutApp();
    } finally {
      setLogoutModalVisible(false);
      setLogoutLoading(false);
    }
  };

  const handleWalletNavigation = () => {
    navigation.navigate('WalletScreen');
  };
  const handleEditNavigation = () => {
    navigation.navigate('EditProfile', { edit: true });
  };
  const handleUpcomingPuja = () => {
    navigation.navigate('UpcomingPuja');
  };
  const handlePastPuja = () => {
    navigation.navigate('PastPujaScreen');
  };
  const handleSavedAddressNavigation = () => {
    navigation.navigate('AddressesScreen');
  };

  const handleDeleteAccount = async () => {
    try {
      const response: any = await deleteAccount({
        user_id: Number(currentUser?.id) || 0,
      });
      if (response.data.success) {
        setDeleteAccountModalVisible(false);
        signOutApp();
        await notifee.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error deleting account', error);
    } finally {
      setDeleteAccountModalVisible(false);
    }
  };

  const handleDailyHoroscopeNavigation = () => {
    navigation.navigate('KundliListScreen');
  };

  const handleHoroscopeNavigation = () => {
    navigation.navigate('HoroscopeScreen');
  };

  const handleMcpServerNavigation = () => {
    navigation.navigate('McpServer');
  };

  const getLanguageLabel = (langCode: string) => {
    switch (langCode) {
      case 'en':
        return 'English';
      case 'hi':
        return 'हिन्दी';
      case 'gu':
        return 'ગુજરાતી';
      case 'mr':
        return 'मराठी';
      default:
        return 'English';
    }
  };

  const changeAppLanguage = async (lang: string) => {
    try {
      await changeLanguage(lang);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={logoutLoading || loading} />
      <UserCustomHeader title={t('profile')} />
      {currentUser && (
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                currentUser?.profile_img ||
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
            }}
            style={styles.profileImage}
          />
        </View>
      )}
      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: inset.bottom + 20 }}
        >
          <View style={styles.groupsContainer}>
            {/* Group 1: Profile Information */}
            {!loading && currentUser && (
              <View style={styles.infoSection}>
                <ProfileField
                  label={t('name')}
                  value={
                    `${currentUser?.first_name} ${currentUser?.last_name}` || ''
                  }
                />
                <View style={styles.divider} />
                <ProfileField
                  label={t('email')}
                  value={currentUser?.email || ''}
                />
                <View style={styles.divider} />
                <ProfileField
                  label={t('phone')}
                  value={currentUser?.mobile || ''}
                />
                <View style={styles.divider} />
                <ProfileField
                  label={t('location')}
                  value={currentUser?.address?.city_name || ''}
                />
              </View>
            )}

            {/* Group 2: Menu Actions */}
            <View style={styles.editSection}>
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleEditNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>{t('edit_profile')} </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={handleUpcomingPuja}
                style={styles.editFieldContainer}
              >
                <Text style={styles.editFieldLabel}>{t('upcoming_puja')} </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={handlePastPuja}
                style={styles.editFieldContainer}
              >
                <Text style={styles.editFieldLabel}>{t('past_puja')} </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleWalletNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>{t('wallet')}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleSavedAddressNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>
                  {t('saved_addresses')}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleDailyHoroscopeNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>{t('rashi_ful')} </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleHoroscopeNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>
                  {t('daily_horoscope')}{' '}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.editFieldContainer}
                onPress={handleMcpServerNavigation}
                activeOpacity={0.7}
              >
                <Text style={styles.editFieldLabel}>{t('mcp_server')}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
            </View>

            {/* Group 3: Language */}
            <TouchableOpacity
              style={styles.editSection}
              onPress={() => setLanguageModalVisible(true)}
            >
              <View style={styles.editFieldContainer}>
                <Text style={styles.editFieldLabel}>{t('language')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      marginRight: 10,
                      color: COLORS.textSecondary,
                      fontFamily: Fonts.Sen_Regular,
                      fontSize: 14,
                    }}
                  >
                    {getLanguageLabel(currentLanguage)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.primaryTextDark}
                  />
                </View>
              </View>
            </TouchableOpacity>

            {/* Group 4: Logout */}
            <TouchableOpacity
              style={styles.editSection}
              onPress={() => setLogoutModalVisible(true)}
            >
              <View style={styles.editFieldContainer}>
                <Text style={styles.logoutLabel}>{t('logout')}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </View>
            </TouchableOpacity>

            {/* Group 5: Delete Account */}
            <TouchableOpacity
              style={styles.editSection}
              onPress={() => setDeleteAccountModalVisible(true)}
            >
              <View style={styles.editFieldContainer}>
                <Text style={styles.logoutLabel}>{t('delete_account')}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.primaryTextDark}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <CustomModal
        visible={logoutModalVisible}
        title={t('logout')}
        message={t('are_you_sure_logout')}
        confirmText={logoutLoading ? t('logging_out') : t('logout')}
        cancelText={t('cancel')}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
      <CustomModal
        visible={deleteAccountModalVisible}
        title={t('delete_account')}
        message={t('are_you_sure_delete_account')}
        confirmText={logoutLoading ? t('deleting') : t('delete')}
        cancelText={t('cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteAccountModalVisible(false)}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.languageModalContent}>
            <Text style={styles.modalTitle}>{t('select_language')}</Text>
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'gu', label: 'ગુજરાતી' },
              { code: 'mr', label: 'मराठी' },
            ].map(item => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.languageOption,
                  currentLanguage === item.code &&
                    styles.selectedLanguageOption,
                ]}
                onPress={() => changeAppLanguage(item.code)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    currentLanguage === item.code &&
                      styles.selectedLanguageText,
                  ]}
                >
                  {item.label}
                </Text>
                {currentLanguage === item.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 184,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 105,
    alignSelf: 'center',
    zIndex: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.textGray,
  },
  contentContainer: {
    position: 'absolute',
    top: 153,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingTop: moderateScale(64),
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  groupsContainer: {
    gap: moderateScale(24),
  },
  infoSection: {
    marginHorizontal: moderateScale(24),
    backgroundColor: COLORS.white,
    ...(COMMON_LIST_STYLE as ViewStyle),
  },
  editSection: {
    marginHorizontal: moderateScale(24),
    backgroundColor: COLORS.white,
    ...(COMMON_LIST_STYLE as ViewStyle),
  },
  fieldContainer: {
    ...(COMMON_CARD_STYLE as ViewStyle),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: COLORS.inputLabelText,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    flex: 1,
  },
  fieldValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'right',
    flex: 2,
  },
  editFieldContainer: {
    ...(COMMON_CARD_STYLE as ViewStyle),
    justifyContent: 'space-between',
  },
  editFieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  logoutLabel: {
    color: COLORS.gradientEnd,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
  },
  selectedLangText: {
    marginHorizontal: moderateScale(24),
    color: COLORS.inputLabelText,
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_Bold,
    marginBottom: 20,
    color: COLORS.textPrimary,
  },
  languageOption: {
    width: '100%',
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  selectedLanguageOption: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  languageOptionText: {
    fontSize: 16,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textPrimary,
  },
  selectedLanguageText: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
});

export default BottomUserProfileScreen;
