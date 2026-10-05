import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
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

interface MenuItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
  showChevron?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconColor,
  iconBg,
  label,
  onPress,
  rightElement,
  isDestructive = false,
  showChevron = true,
}) => (
  <TouchableOpacity
    style={styles.menuRow}
    onPress={onPress}
    activeOpacity={0.65}
  >
    <View style={[styles.menuIconBadge, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text
      style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}
      numberOfLines={1}
    >
      {label}
    </Text>
    {rightElement ? (
      rightElement
    ) : showChevron ? (
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDestructive ? '#FCA5A5' : '#CBD5E1'}
      />
    ) : null}
  </TouchableOpacity>
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const translationCacheRef = useRef<Map<string, CurrentUser>>(new Map());

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);

      const cachedTranslation =
        translationCacheRef.current.get(currentLanguage);
      if (cachedTranslation) {
        setCurrentUser(cachedTranslation);
        return;
      }

      const response = (await getEditProfile()) as CurrentUser | undefined;
      if (response) {
        const translated = (await translateData(response, currentLanguage, [
          'first_name',
          'last_name',
          'city_name',
        ])) as CurrentUser;
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
    useCallback(() => {
      if (translationCacheRef.current.has(currentLanguage)) {
        translationCacheRef.current.delete(currentLanguage);
      }
      fetchCurrentUser();
    }, [currentLanguage, fetchCurrentUser]),
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

      signOutApp();
    } catch (error) {
      console.error('Logout error:', error);
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
      if (response?.data?.success) {
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

  const fullName =
    `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() ||
    t('profile');

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={logoutLoading || loading} />
      <UserCustomHeader title={t('profile')} />

      <View style={styles.sheetContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: moderateScale(20) },
          ]}
        >
          {/* Profile Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEditNavigation}
                style={styles.avatarWrapper}
              >
                <Image
                  source={{
                    uri:
                      currentUser?.profile_img ||
                      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="pencil" size={11} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              <View style={styles.heroInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {fullName}
                </Text>

                {!!currentUser?.address?.city_name && (
                  <View style={styles.cityChip}>
                    <Ionicons
                      name="location-sharp"
                      size={12}
                      color={COLORS.primary}
                    />
                    <Text style={styles.cityText} numberOfLines={1}>
                      {currentUser.address.city_name}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={handleEditNavigation}
                style={styles.quickEditBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={COLORS.primary}
                />
                <Text style={styles.quickEditText}>{t('edit')}</Text>
              </TouchableOpacity>
            </View>

            {/* Contact Pills */}
            {(currentUser?.mobile || currentUser?.email) && (
              <View style={styles.contactContainer}>
                {!!currentUser?.mobile && (
                  <View style={styles.contactChip}>
                    <View style={styles.contactIconBg}>
                      <Ionicons
                        name="call-outline"
                        size={12}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {currentUser.mobile}
                    </Text>
                  </View>
                )}
                {!!currentUser?.email && (
                  <View style={styles.contactChip}>
                    <View style={styles.contactIconBg}>
                      <Ionicons
                        name="mail-outline"
                        size={12}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {currentUser.email}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Section 1: Bookings & Activity */}
          <Text style={styles.sectionHeaderTitle}>
            {t('bookings_and_account')}
          </Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="calendar-outline"
              iconColor="#D97706"
              iconBg="#FEF3C7"
              label={t('upcoming_puja')}
              onPress={handleUpcomingPuja}
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="time-outline"
              iconColor="#2563EB"
              iconBg="#EFF6FF"
              label={t('past_puja')}
              onPress={handlePastPuja}
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="wallet-outline"
              iconColor="#059669"
              iconBg="#ECFDF5"
              label={t('wallet')}
              onPress={handleWalletNavigation}
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="location-outline"
              iconColor="#7C3AED"
              iconBg="#F5F3FF"
              label={t('saved_addresses')}
              onPress={handleSavedAddressNavigation}
            />
          </View>

          {/* Section 2: Astrology & Insights */}
          <Text style={styles.sectionHeaderTitle}>
            {t('astrology_services')}
          </Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="planet-outline"
              iconColor="#EA580C"
              iconBg="#FFF7ED"
              label={t('rashi_ful')}
              onPress={handleDailyHoroscopeNavigation}
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="sunny-outline"
              iconColor="#CA8A04"
              iconBg="#FEFCE8"
              label={t('daily_horoscope')}
              onPress={handleHoroscopeNavigation}
            />
          </View>

          {/* Section 3: Preferences */}
          <Text style={styles.sectionHeaderTitle}>{t('preferences')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="language-outline"
              iconColor="#4F46E5"
              iconBg="#EEF2FF"
              label={t('language')}
              onPress={() => setLanguageModalVisible(true)}
              rightElement={
                <View style={styles.languageRightPill}>
                  <Text style={styles.languageRightText}>
                    {getLanguageLabel(currentLanguage)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              }
            />
          </View>

          {/* Section 4: Account Settings */}
          <Text style={styles.sectionHeaderTitle}>{t('account_settings')}</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="person-outline"
              iconColor="#0284C7"
              iconBg="#E0F2FE"
              label={t('edit_profile')}
              onPress={handleEditNavigation}
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="log-out-outline"
              iconColor="#DC2626"
              iconBg="#FEF2F2"
              label={t('logout')}
              onPress={() => setLogoutModalVisible(true)}
              isDestructive
            />
            <View style={styles.rowDivider} />
            <MenuItem
              icon="trash-outline"
              iconColor="#DC2626"
              iconBg="#FEF2F2"
              label={t('delete_account')}
              onPress={() => setDeleteAccountModalVisible(true)}
              isDestructive
            />
          </View>
        </ScrollView>
      </View>

      {/* Confirmation Modals */}
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
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('select_language')}</Text>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { code: 'en', label: 'English', sub: 'English' },
              { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
              { code: 'mr', label: 'मराठी', sub: 'Marathi' },
            ].map(item => {
              const isSelected = currentLanguage === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.languageOption,
                    isSelected && styles.selectedLanguageOption,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => changeAppLanguage(item.code)}
                >
                  <View>
                    <Text
                      style={[
                        styles.languageOptionText,
                        isSelected && styles.selectedLanguageText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.languageSubText}>{item.sub}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  ) : (
                    <View style={styles.languageUnselectedRadio} />
                  )}
                </TouchableOpacity>
              );
            })}
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
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(18),
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: moderateScale(8),
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    borderWidth: 3,
    borderColor: '#FFE4E6',
    backgroundColor: '#F1F5F9',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  heroInfo: {
    flex: 1,
    marginLeft: moderateScale(14),
    justifyContent: 'center',
  },
  userName: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
    marginBottom: moderateScale(4),
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
    alignSelf: 'flex-start',
    gap: 4,
  },
  cityText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  quickEditText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },

  // Contact Chips
  contactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginTop: moderateScale(14),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactIconBg: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactValue: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#475569',
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
    marginLeft: moderateScale(6),
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: '#EDF2F7',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
  },
  menuIconBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(11),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  menuLabel: {
    flex: 1,
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textPrimary,
  },
  destructiveLabel: {
    color: '#DC2626',
    fontFamily: Fonts.Sen_Medium,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: moderateScale(62),
    marginRight: moderateScale(14),
  },

  // Language Right Pill
  languageRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageRightText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  languageModalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageOption: {
    width: '100%',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: moderateScale(8),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  selectedLanguageOption: {
    backgroundColor: '#FFF1F2',
    borderColor: COLORS.primary,
  },
  languageOptionText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
  },
  selectedLanguageText: {
    color: COLORS.primary,
  },
  languageSubText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: 2,
  },
  languageUnselectedRadio: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});

export default BottomUserProfileScreen;
