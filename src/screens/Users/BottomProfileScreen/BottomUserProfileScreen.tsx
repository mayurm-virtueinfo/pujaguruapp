import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Fonts from '../../../theme/fonts';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {UserProfileParamList} from '../../../navigation/User/userProfileNavigator';
import {useAuth} from '../../../provider/AuthProvider';
import LanguageSwitcher from '../../../components/LanguageSwitcher';
import {getEditProfile, postLogout} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomModal from '../../../components/CustomModal';
import CustomeLoader from '../../../components/CustomeLoader';

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({label, value}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

type ProfileNavigationProp = StackNavigationProp<UserProfileParamList>;

const BottomUserProfileScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavigationProp>();
  const {t} = useTranslation();

  const {signOutApp} = useAuth();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const fetchCurrentUser = async () => {
    try {
      const response: any = await getEditProfile();
      if (response) {
        console.log('response in profile screen :: ', response);
        setCurrentUser(response);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCurrentUser();
    }, []),
  );

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const refreshToken =
        (await AsyncStorage.getItem(AppConstant.REFRESH_TOKEN)) || '';
      const params = {
        refresh_token: refreshToken,
      };
      const response: any = await postLogout(params);
      if (response.data.success) {
        setLogoutModalVisible(false);
        signOutApp();
      }
    } catch (error: any) {
      setLogoutModalVisible(false);
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleWalletNavigation = () => {
    navigation.navigate('WalletScreen');
  };
  const handleNotificationNavigation = () => {
    navigation.navigate('NotificationScreen');
  };
  const handleEditNavigation = () => {
    navigation.navigate('EditProfile');
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

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={logoutLoading} />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.headerGradient]}
      />
      <UserCustomHeader title={t('profile')} showBackButton={true} />

      {currentUser && (
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                currentUser?.profile_img ||
                'https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2220431045.jpg',
            }}
            style={styles.profileImage}
          />
        </View>
      )}
      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          {currentUser && (
            <View style={[styles.infoSection, THEMESHADOW.shadow]}>
              <ProfileField
                label={t('name')}
                value={currentUser?.first_name || ''}
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

          <View style={[styles.editSection, THEMESHADOW.shadow]}>
            <TouchableOpacity
              style={styles.editFieldContainer}
              onPress={handleEditNavigation}
              activeOpacity={0.7}>
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
              style={styles.editFieldContainer}>
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
              style={styles.editFieldContainer}>
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
              activeOpacity={0.7}>
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
              activeOpacity={0.7}>
              <Text style={styles.editFieldLabel}>{t('Saved Address')}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.editFieldContainer}
              onPress={handleNotificationNavigation}
              activeOpacity={0.7}>
              <Text style={styles.editFieldLabel}>{t('notifications')} </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </TouchableOpacity>
          </View>

          <LanguageSwitcher />
          <TouchableOpacity
            style={[styles.editSection, THEMESHADOW.shadow]}
            onPress={() => setLogoutModalVisible(true)}>
            <View style={styles.editFieldContainer}>
              <Text style={styles.logoutLabel}>{t('logout')}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
          </TouchableOpacity>
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
    </SafeAreaView>
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
    backgroundColor: COLORS.separatorColor,
  },
  contentContainer: {
    position: 'absolute',
    top: 153,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundPrimary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 64,
    paddingBottom: 24,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoSection: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    marginTop: 10,
  },
  editSection: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.white,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    color: COLORS.inputLabelText,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    flex: 1,
    paddingVertical: 5,
  },
  fieldValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'right',
    flex: 2,
  },
  editFieldContainer: {
    minHeight: 34,
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editFieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    paddingVertical: 5,
  },
  logoutLabel: {
    color: COLORS.gradientEnd,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: 8,
  },
});

export default BottomUserProfileScreen;
