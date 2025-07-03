import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {AuthStackParamList} from '../../../navigation/AuthNavigator';
import {
  getCurrentLocation,
  requestLocationPermission,
  LocationData,
} from '../../../utils/locationUtils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PrimaryButton from '../../../components/PrimaryButton';
import ThemedInput from '../../../components/ThemedInput';
import {MainAppStackParamList} from '../../../navigation/RootNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface FormData {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  address: string;
}

interface ScreenDimensions {
  width: number;
  height: number;
}

type CompleteProfileScreenNavigationProp = StackNavigationProp<
  MainAppStackParamList,
  'CompleteProfileScreen' | 'UserProfileScreen'
>;

type CompleteProfileScreenRouteProp = RouteProp<
  MainAppStackParamList,
  'CompleteProfileScreen' | 'UserProfileScreen'
>;

interface Props {
  navigation: CompleteProfileScreenNavigationProp;
  route: CompleteProfileScreenRouteProp;
}

const CompleteProfileScreen: React.FC<Props> = ({navigation}) => {
  const inset = useSafeAreaInsets();

  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    address: '1234 Elm Street, Springfield',
  });

  const [screenData, setScreenData] = useState<ScreenDimensions>(
    Dimensions.get('window'),
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const onChange = (result: {window: ScreenDimensions}) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
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
      console.log('GPS location fetched:', location);
    } catch (error) {
      console.error('Error fetching GPS location:', error);
      // Handle error appropriately in production
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNext = () => {
    console.log('Proceeding to next screen...', formData);
    // Navigate to PanditRegistration or next screen in the flow
    navigation.navigate('UserProfileScreen');
  };

  const handleSkip = () => {
    console.log('Skip pressed');
    // Navigate to next screen, skipping profile completion
    navigation.navigate('UserProfileScreen');
  };

  const handleBack = () => {
    console.log('Back pressed');
    // Navigate back to previous screen
    navigation.goBack();
  };

  const isTablet = screenData.width >= 768;
  const isLandscape = screenData.width > screenData.height;

  const getResponsiveStyle = () => ({
    maxWidth: isTablet ? moderateScale(600) : screenData.width,
    alignSelf: 'center' as const,
  });

  // Custom label style to pass to ThemedInput
  const themedInputLabelStyle = {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.inputLabelText,
    marginBottom: 4,
  };

  const renderMainContent = () => (
    <View style={[styles.mainContent]}>
      <View style={styles.inputField}>
        <ThemedInput
          label="Phone Number"
          placeholder="Enter phone number"
          value={formData.phoneNumber}
          onChangeText={text => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={15}
          labelStyle={themedInputLabelStyle}
        />
      </View>

      <View style={styles.inputField}>
        <ThemedInput
          label="First Name"
          placeholder="Enter first name"
          value={formData.firstName}
          onChangeText={text => handleInputChange('firstName', text)}
          autoComplete="name"
          textContentType="givenName"
          maxLength={30}
          labelStyle={themedInputLabelStyle}
        />
      </View>

      <View style={styles.inputField}>
        <ThemedInput
          label="Last Name"
          placeholder="Enter last name"
          value={formData.lastName}
          onChangeText={text => handleInputChange('lastName', text)}
          autoComplete="name"
          textContentType="familyName"
          maxLength={30}
          labelStyle={themedInputLabelStyle}
        />
      </View>

      <View style={styles.inputField}>
        <ThemedInput
          label="Address"
          placeholder="1234 Elm Street, Springfield"
          value={formData.address}
          onChangeText={text => handleInputChange('address', text)}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          maxLength={100}
          labelStyle={themedInputLabelStyle}
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
          {isLoadingLocation ? 'FETCHING LOCATION...' : 'FETCH GPS LOCATION'}
        </Text>
      </TouchableOpacity>

      <PrimaryButton
        title="NEXT"
        onPress={handleNext}
        style={styles.nextButton}
        textStyle={styles.nextButtonText}
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
      <StatusBar
        translucent
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <SafeAreaView style={{backgroundColor: COLORS.primaryBackground}}>
        <UserCustomHeader
          title="Complete Your Profile"
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
    // backgroundColor: COLORS.primaryBackground, // No longer needed here
  },
  keyboardAvoidingView: {
    flex: 1,
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
  landscapeContent: {
    paddingBottom: moderateScale(40),
  },
});

export default CompleteProfileScreen;
