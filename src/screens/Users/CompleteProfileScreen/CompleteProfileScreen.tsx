import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {moderateScale} from 'react-native-size-matters';
import {AuthStackParamList} from '../../../navigation/AuthNavigator';
import PrimaryButton from '../../../components/PrimaryButton';
import ThemedInput from '../../../components/ThemedInput';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomeLoader from '../../../components/CustomeLoader';
import {useRoute} from '@react-navigation/native';
import PrimaryButtonOutlined from '../../../components/PrimaryButtonOutlined';
import {getCurrentLocation, LocationData} from '../../../utils/locationUtils';
import {Text} from 'react-native-gesture-handler';

interface FormData {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  address: string;
}

interface FormErrors {
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
}

interface ScreenDimensions {
  width: number;
  height: number;
}

type CompleteProfileScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'UserProfileScreen'
>;

interface Props {
  navigation: CompleteProfileScreenNavigationProp;
}

const CompleteProfileScreen: React.FC<Props> = ({navigation}) => {
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();

  const route = useRoute();
  const {phoneNumber} = route.params as {phoneNumber: string};

  // Use a ref to always have the latest UID value
  const uidRef = useRef<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: phoneNumber || '',
    firstName: '',
    lastName: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [screenData, setScreenData] = useState<ScreenDimensions>(
    Dimensions.get('window'),
  );
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Helper to fetch UID, with retry logic if not found
  const fetchUID = async (retryCount = 0) => {
    try {
      let fetchedUid = await AsyncStorage.getItem(AppConstant.FIREBASE_UID);
      if (!fetchedUid && retryCount < 5) {
        // Wait a bit and try again (in case async storage is not ready yet)
        await new Promise(res => setTimeout(res, 300));
        return fetchUID(retryCount + 1);
      }
      setUid(fetchedUid);
      uidRef.current = fetchedUid;
    } catch (error) {
      console.error('Error fetching UID:', error);
    }
  };

  // On mount, fetch UID and GPS, and listen for screen size changes
  useEffect(() => {
    fetchUID();
    handleFetchGPS();
    const onChange = (result: {window: ScreenDimensions}) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // If UID is still not available, try to fetch again when user presses Next
  const ensureUID = async () => {
    if (!uidRef.current) {
      await fetchUID();
    }
    return uidRef.current;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const nameRegex = /^[a-zA-Z\s]{2,30}$/;

    if (!formData.phoneNumber) {
      errors.phoneNumber = t('invalid_phone_number');
    }

    if (!formData.firstName || !nameRegex.test(formData.firstName)) {
      errors.firstName = t('invalid_first_name');
    }

    if (!formData.lastName || !nameRegex.test(formData.lastName)) {
      errors.lastName = t('invalid_last_name');
    }

    if (!formData.address || formData.address.length < 2) {
      errors.address = t('invalid_address');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleFetchGPS = async () => {
    setIsLoading(true);
    try {
      console.log('🎯 Fetching current location...');

      const locationData = await getCurrentLocation();
      setLocation(locationData);

      console.log('📍 Location fetched successfully:', {
        lat: locationData.latitude.toFixed(4),
        lng: locationData.longitude.toFixed(4),
      });
    } catch (error: any) {
      console.warn('❌ Error getting location:', error.message);
      setFormErrors(prev => ({
        ...prev,
        address: t('location_fetch_failed'),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Modified handleNext to ensure UID is available before navigating
  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    let currentUid = uidRef.current;
    if (!currentUid) {
      // Try to fetch again if not available
      await fetchUID();
      currentUid = uidRef.current;
    }

    if (!currentUid) {
      setIsLoading(false);
      setFormErrors(prev => ({
        ...prev,
        phoneNumber: t('uid_not_found_try_again'),
      }));
      return;
    }

    if (!location) {
      setIsLoading(false);
      setFormErrors(prev => ({
        ...prev,
        address: t('location_required'),
      }));
      return;
    }

    navigation.navigate('UserProfileScreen', {
      phoneNumber: formData.phoneNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      uid: currentUid,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setIsLoading(false);
  };

  const themedInputLabelStyle = {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.inputLabelText,
    marginBottom: 4,
  };

  const renderMainContent = () => (
    <View style={[styles.container]}>
      <View style={styles.inputField}>
        <ThemedInput
          label={t('First name')}
          placeholder={t('enter_first_name')}
          value={formData.firstName}
          onChangeText={text => handleInputChange('firstName', text)}
          autoComplete="name"
          textContentType="givenName"
          maxLength={30}
          labelStyle={themedInputLabelStyle}
          error={formErrors.firstName}
        />
      </View>

      <View style={styles.inputField}>
        <ThemedInput
          label={t('Last name')}
          placeholder={t('enter_last_name')}
          value={formData.lastName}
          onChangeText={text => handleInputChange('lastName', text)}
          autoComplete="name"
          textContentType="familyName"
          maxLength={30}
          labelStyle={themedInputLabelStyle}
          error={formErrors.lastName}
        />
      </View>
      <View style={styles.inputField}>
        <ThemedInput
          label={t('Phone number')}
          placeholder={t('enter_phone_number')}
          value={formData.phoneNumber}
          onChangeText={text => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={15}
          labelStyle={themedInputLabelStyle}
          error={formErrors.phoneNumber}
        />
      </View>

      <View style={styles.inputField}>
        <ThemedInput
          label={t('Address')}
          placeholder={t('enter_address')}
          value={formData.address}
          onChangeText={text => handleInputChange('address', text)}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          maxLength={100}
          labelStyle={themedInputLabelStyle}
          error={formErrors.address}
        />
      </View>

      <Text>
        lat : {location?.latitude.toFixed(4)} long :{' '}
        {location?.longitude.toFixed(4)}
      </Text>

      <PrimaryButtonOutlined
        title={t('fetch_gps_location')}
        onPress={handleFetchGPS}
        disabled={isLoading}
      />

      <PrimaryButton
        title={t('next')}
        onPress={handleNext}
        style={styles.nextButton}
        textStyle={styles.nextButtonText}
        disabled={isLoading}
      />
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.primaryBackground,
        paddingTop: inset.top,
      }}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        translucent
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <SafeAreaView style={{backgroundColor: COLORS.primaryBackground}}>
        <UserCustomHeader
          title={t('complete_your_profile')}
          showBackButton={true}
          showSkipButton={true}
        />
      </SafeAreaView>
      <View style={styles.flexGrow}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={{flex: 1}}>{renderMainContent()}</View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    padding: moderateScale(24),
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  scrollContent: {
    flexGrow: 1,
  },
  inputField: {
    marginBottom: moderateScale(16),
  },
  gpsButton: {
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    backgroundColor: 'transparent',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(8),
    marginBottom: moderateScale(16),
    minHeight: moderateScale(46),
  },
  gpsButtonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(15),
    fontWeight: '400',
    lineHeight: moderateScale(21),
    letterSpacing: -0.15,
    textTransform: 'uppercase',
  },
  gpsButtonLoading: {
    opacity: 0.7,
  },
  nextButton: {
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.primaryBackgroundButton,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(24),
    minHeight: moderateScale(46),
  },
  nextButtonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(15),
    fontWeight: '400',
    lineHeight: moderateScale(21),
    letterSpacing: -0.15,
    textTransform: 'uppercase',
  },
});

export default CompleteProfileScreen;
