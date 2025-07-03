import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {AuthStackParamList} from '../navigation/AuthNavigator';
import Loader from '../components/Loader';
import {getAuth, signInWithPhoneNumber} from '@react-native-firebase/auth';
import {useCommonToast} from '../common/CommonToast';
import {COLORS} from '../theme/theme';
import {Images} from '../theme/Images';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from 'react-native-size-matters';
import Fonts from '../theme/fonts';
import PrimaryButton from '../components/PrimaryButton';
import PrimaryButtonLabeled from '../components/PrimaryButtonLabeled';
import PrimaryButtonOutlined from '../components/PrimaryButtonOutlined';

type OTPVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;

type OTPVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({navigation, route}) => {
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const {showErrorToast, showSuccessToast} = useCommonToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const {phoneNumber, confirmation} = route.params;

  const [otpConfirmation, setOtpConfirmation] = useState(confirmation);
  const [isLoading, setLoading] = useState(false);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const confirmCode = async (code: string) => {
    try {
      setLoading(true);
      await otpConfirmation.confirm(code);
      setLoading(false);
      navigation.navigate('CompleteProfileScreen');
    } catch (error: any) {
      console.log('Invalid code.');
      setLoading(false);
      // Alert.alert('','Invalid code');
      showErrorToast(
        error?.message || 'Failed to Resend OTP. Please try again.',
      );
    }
  };
  const handleVerification = async () => {
    try {
      const otpValue = otp.join('');
      if (otpValue.length !== 6) {
        // Alert.alert('Error', 'Please enter a valid 6-digit OTP');
        showErrorToast('Please enter a valid 6-digit OTP');
        return;
      }

      // Here you would typically make an API call to verify the OTP
      // For now, we'll simulate a successful verification

      confirmCode(otpValue);
      // Navigate to registration screen after successful verification
    } catch (error) {
      console.error('Verification failed:', error);
      // Alert.alert('Error', 'OTP verification failed. Please try again.');
      showErrorToast('OTP verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    // Implement resend OTP logic here
    try {
      // const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      setLoading(true);
      const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
      setLoading(false);
      // Alert.alert('Success', 'New OTP has been sent to your phone number');
      showSuccessToast('New OTP has been sent to your phone number');
      setOtpConfirmation(confirmation);
    } catch (error: any) {
      console.log('---8');
      console.error(error);
      setLoading(false);
      // Alert.alert('Error', error?.message || 'Failed to Resend OTP. Please try again.');
      showErrorToast(
        error?.message || 'Failed to Resend OTP. Please try again.',
      );
    }
  };

  return (
    <ImageBackground
      source={Images.ic_splash_background}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <Loader loading={isLoading} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.content, {paddingTop: inset.top}]}>
            <View style={styles.containerHeader}>
              <Image
                source={Images.ic_app_logo}
                style={{width: '33%', resizeMode: 'contain'}}></Image>
              <Text style={styles.title}>{t('hi_welcome')}</Text>
            </View>
            <View style={[styles.containerBody, {paddingBottom: inset.bottom}]}>
              <Text style={styles.mainTitle}>{t('otp_verification')}</Text>
              <Text style={styles.subtitle}>
                {t('6_digit_code_has_been_sent')}
              </Text>
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => (inputRefs.current[index] = ref)}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    testID={`otp-input-${index}`}
                  />
                ))}
              </View>

              <PrimaryButton onPress={handleVerification} title={t('verify')} />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  {t('did_not_receive_code')}
                </Text>
                <PrimaryButtonLabeled
                  onPress={handleResendOTP}
                  title={t('resend_otp')}
                />
              </View>
              <PrimaryButtonOutlined
                onPress={() => navigation.goBack()}
                title={t('change_mobile_number')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#ffffff',
  },
  containerHeader: {
    height: moderateScale(220),
    alignItems: 'center',
    // justifyContent: 'center',
  },
  containerBody: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    flex: 1,
    padding: moderateScale(24),
    // justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(24),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(24),
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    fontSize: moderateScale(32),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
  },

  phoneNumber: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(24),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  otpInput: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderWidth: moderateScale(1),
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(5),
    textAlign: 'center',
    fontSize: moderateScale(20),
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Regular,
    backgroundColor: COLORS.lightGray,
  },
  verifyButton: {
    width: '100%',
    height: moderateScale(48),
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(16),
  },
  resendText: {
    fontSize: moderateScale(14),
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Regular,
  },
  resendButton: {
    fontSize: 14,
    color: COLORS.primaryBackgroundButton,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
