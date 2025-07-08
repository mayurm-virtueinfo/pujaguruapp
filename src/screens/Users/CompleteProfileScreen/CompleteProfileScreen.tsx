import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import {
  getCurrentLocation,
  requestLocationPermission,
  LocationData,
} from '../../../utils/locationUtils';
import PrimaryButton from '../../../components/PrimaryButton';
import ThemedInput from '../../../components/ThemedInput';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import CustomeLoader from '../../../components/CustomeLoader';

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

  const [uid, setUid] = useState<string | null>('');
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [screenData, setScreenData] = useState<ScreenDimensions>(
    Dimensions.get('window'),
  );

  useEffect(() => {
    fetchUID();
    const onChange = (result: {window: ScreenDimensions}) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  console.log('uid in complete profile screen :: ', uid);

  const fetchUID = async () => {
    try {
      const uid = await AsyncStorage.getItem(AppConstant.FIREBASE_UID);
      setUid(uid);
    } catch (error) {
      console.error('Error fetching UID:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    const nameRegex = /^[a-zA-Z\s]{2,30}$/;

    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber)) {
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
    setIsLoadingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return;
      }
      const location: LocationData = await getCurrentLocation();
      handleInputChange('address', location.address || 'Location found');
    } catch (error) {
      console.error('Error fetching GPS location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      setIsLoading(true);
      navigation.navigate('UserProfileScreen', {
        phoneNumber: formData.phoneNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        uid: uid || '',
      });
      setIsLoading(false);
    }
  };

  const isTablet = screenData.width >= 768;

  const getResponsiveStyle = () => ({
    maxWidth: isTablet ? moderateScale(600) : screenData.width,
    alignSelf: 'center' as const,
  });

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

      <TouchableOpacity
        style={[styles.gpsButton, isLoadingLocation && styles.gpsButtonLoading]}
        onPress={handleFetchGPS}
        disabled={isLoadingLocation}
        accessibilityLabel="Fetch GPS location button"
        accessibilityHint="Tap to get your current location automatically"
        accessibilityRole="button">
        <Text style={styles.gpsButtonText}>
          {isLoadingLocation ? t('fetching_location') : t('fetch_gps_location')}
        </Text>
      </TouchableOpacity>

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
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
