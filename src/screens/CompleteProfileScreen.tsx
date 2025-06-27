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
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';
import {moderateScale} from 'react-native-size-matters';
import {AuthStackParamList} from '../navigation/AuthNavigator';
import {
  getCurrentLocation,
  requestLocationPermission,
  LocationData,
} from '../utils/locationUtils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PrimaryButton from '../components/PrimaryButton';
import ThemedInput from '../components/ThemedInput';

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
  AuthStackParamList,
  'CreateProfile'
>;

type CompleteProfileScreenRouteProp = RouteProp<
  AuthStackParamList,
  'CreateProfile'
>;

interface Props {
  navigation: CompleteProfileScreenNavigationProp;
  route: CompleteProfileScreenRouteProp;
}

const CompleteProfileScreen: React.FC<Props> = ({navigation}) => {
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
    navigation.navigate('PanditRegistration');
  };

  const handleSkip = () => {
    console.log('Skip pressed');
    // Navigate to next screen, skipping profile completion
    navigation.navigate('PanditRegistration');
  };

  const handleBack = () => {
    console.log('Back pressed');
    // Navigate back to previous screen
    navigation.goBack();
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons
            name="chevron-back"
            size={24}
            style={styles.backArrow}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Complete Your Profile</Text>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isTablet = screenData.width >= 768;
  const isLandscape = screenData.width > screenData.height;

  const getResponsiveStyle = () => ({
    maxWidth: isTablet ? moderateScale(600) : screenData.width,
    alignSelf: 'center' as const,
  });

  const renderMainContent = () => (
    <View style={[styles.mainContent]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={isLandscape && styles.landscapeContent}>
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
          />
        </View>

        <TouchableOpacity
          style={[
            styles.gpsButton,
            isLoadingLocation && styles.gpsButtonLoading,
          ]}
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
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {renderHeader()}
        {renderMainContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  statusBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(30),
    paddingVertical: moderateScale(12),
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  statusBarTime: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    fontWeight: '400',
    letterSpacing: -0.23,
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: moderateScale(2),
  },
  signalBar: {
    width: moderateScale(2),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(1),
  },
  batteryContainer: {
    marginLeft: moderateScale(8),
  },
  battery: {
    width: moderateScale(22),
    height: moderateScale(11),
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: moderateScale(2),
    padding: moderateScale(1),
    position: 'relative',
  },
  batteryFill: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(1),
  },
  headerContainer: {
    backgroundColor: COLORS.primaryBackground,
    shadowColor: COLORS.primaryBackground,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(25),
    height: moderateScale(50),
  },
  backButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrow: {
    color: COLORS.white,
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    transform: [{scaleX: 1.5}, {scaleY: 1.2}],
  },
  headerTitle: {
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(18),
    fontWeight: '700',
    lineHeight: moderateScale(22),
    flex: 1,
  },
  skipButton: {
    width: moderateScale(30),
    alignItems: 'flex-end',
  },
  skipText: {
    color: COLORS.white,
    textAlign: 'right',
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    marginTop: moderateScale(-30),
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
    fontFamily: Fonts.Sen_Regular,
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
    fontFamily: Fonts.Sen_Regular,
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
