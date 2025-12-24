import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import auth, { getAuth } from '@react-native-firebase/auth';
import { useCommonToast } from '../common/CommonToast';
import { COLORS } from '../theme/theme';
import { Images } from '../theme/Images';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import Fonts from '../theme/fonts';
import PrimaryButton from '../components/PrimaryButton';
import PrimaryButtonLabeled from '../components/PrimaryButtonLabeled';
import PrimaryButtonOutlined from '../components/PrimaryButtonOutlined';
import { postRegisterFCMToken, postSignIn } from '../api/apiService';
import { useAuth } from '../provider/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';
import { getFcmToken } from '../configuration/firebaseMessaging';
import CustomeLoader from '../components/CustomeLoader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFirebaseAuthErrorMessage } from '../helper/firebaseErrorHandler';

// Get device window dimensions for responsive design
const { width: windowWidth } = Dimensions.get('window');

type AuthNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'OTPVerification' | 'CompleteProfileScreen' | 'UserAppBottomTabNavigator'
>;

type OTPVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;

type OTPVerificationScreenNavigationProp = AuthNavigationProp;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const RESEND_OTP_WAIT_TIME = 60;

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { showErrorToast, showSuccessToast } = useCommonToast();
  const { signIn } = useAuth();
  const inset = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setLoading] = useState(false);
  const [otpConfirmation, setOtpConfirmation] = useState(
    route.params.confirmation,
  );
  const { phoneNumber } = route.params;
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(RESEND_OTP_WAIT_TIME);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    // Handle paste: if user pastes multiple digits
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];

      // Fill from current index
      pastedData.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });

      setOtp(newOtp);

      // Focus on next empty field or last field
      const nextEmptyIndex = newOtp.findIndex(
        (digit, i) => i > index && !digit,
      );
      const focusIndex =
        nextEmptyIndex !== -1
          ? nextEmptyIndex
          : Math.min(index + pastedData.length, 5);

      // Use requestAnimationFrame for smoother focus transition
      requestAnimationFrame(() => {
        inputRefs.current[focusIndex]?.focus();
      });
      return;
    }

    // Handle single digit input
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next field if digit entered
      if (value && index < 5) {
        requestAnimationFrame(() => {
          inputRefs.current[index + 1]?.focus();
        });
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    const key = e.nativeEvent.key;

    // Handle backspace - smooth single-press deletion
    if (key === 'Backspace') {
      // e.preventDefault(); // Removed as it's not supported in RN and can cause issues
      const newOtp = [...otp];

      if (otp[index]) {
        // Current field has value: clear it and stay
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Current field is empty: clear previous field and move back
        newOtp[index - 1] = '';
        setOtp(newOtp);
        requestAnimationFrame(() => {
          inputRefs.current[index - 1]?.focus();
        });
      }
    }
  };

  const handleSignIn = async (phoneNumber: string, uid: string) => {
    setLoading(true);
    try {
      const params = {
        mobile: phoneNumber,
        firebase_uid: uid,
        role: 1,
      };
      const response = await postSignIn(params);
      if (response) {
        if (response?.is_register === false) {
          hasNavigatedRef.current = true;
          navigation.navigate('CompleteProfileScreen', { phoneNumber });
        } else {
          signIn(response.access_token, response.refresh_token);
          const userID = response.user?.id;
          await AsyncStorage.setItem(AppConstant.USER_ID, String(userID));
          await AsyncStorage.setItem(
            AppConstant.LOCATION,
            JSON.stringify({
              ...response.location,
              timestamp: new Date().toISOString(),
            }),
          );
          await AsyncStorage.setItem(
            AppConstant.CURRENT_USER,
            JSON.stringify(response.user),
          );
          const fcmToken = await getFcmToken();
          if (fcmToken) {
            postRegisterFCMToken(fcmToken, 'user');
          }
          hasNavigatedRef.current = true;
          navigation.navigate('UserAppBottomTabNavigator');
        }
      }
    } catch (error: any) {
      if (!hasNavigatedRef.current) {
        // Use firebase error handler
        const message = getFirebaseAuthErrorMessage(error);
        showErrorToast(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    try {
      setLoading(true);
      if (!otpConfirmation) {
        showErrorToast('Unable to verify OTP. Please request a new one.');
        return;
      }

      const userCredential = await otpConfirmation.confirm(code);
      if (userCredential?.user) {
        await handleSignIn(phoneNumber, userCredential.user.uid);
        await AsyncStorage.setItem(
          AppConstant.FIREBASE_UID,
          userCredential.user.uid,
        );
      }
    } catch (error: any) {
      if (!hasNavigatedRef.current) {
        const message = getFirebaseAuthErrorMessage(error);
        showErrorToast(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showErrorToast(t('invalid_otp_length'));
      return;
    }
    await verifyOtp(otpValue);
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber, true);
      setOtpConfirmation(confirmation);
      setOtp(['', '', '', '', '', '']);
      showSuccessToast(t('otp_resent'));
      setTimer(RESEND_OTP_WAIT_TIME);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (error: any) {
      let errorMessage = getFirebaseAuthErrorMessage(error);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Responsive header: scale spacings/logos based on screen size.
  const headerHeight = Math.max(moderateScale(140), windowWidth * 0.44); // minimum 140, else 44% of width (for e.g. 375 -> 165)
  const logoWidth = Math.min(windowWidth * 0.34, moderateScale(120));
  const logoStyle = {
    width: logoWidth,
    height: logoWidth * 0.9, // Maintain ic_app_logo aspect ratio (if 41:100 as example), fallback as proportional
    resizeMode: 'contain' as const,
    alignSelf: 'center' as const,
    marginTop: moderateScale(10),
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ImageBackground
        source={Images.ic_splash_background}
        style={styles.container}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* HEADER: maximally responsive */}
            <View
              style={[
                styles.header,
                {
                  height: headerHeight + inset.top,
                  paddingTop: inset.top + moderateScale(10),
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  backgroundColor: 'transparent',
                  marginBottom: moderateScale(-24), // slightly overlap body
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleBackPress}
                style={[
                  styles.backButton,
                  {
                    position: 'absolute',
                    top: inset.top,
                    left: moderateScale(12),
                    zIndex: 10,
                  },
                ]}
                hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={moderateScale(28)}
                  color={COLORS.white}
                />
              </TouchableOpacity>
              <Image source={Images.ic_app_logo} style={logoStyle} />
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: Math.max(moderateScale(25), windowWidth * 0.07),
                    // marginTop: moderateScale(10),
                    color: COLORS.white,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('hi_welcome')}
              </Text>
            </View>

            <View style={styles.body}>
              <Text style={styles.mainTitle}>{t('otp_verification')}</Text>
              <Text style={styles.subtitle}>
                {t('6_digit_code_has_been_sent')}
              </Text>
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={value => handleOtpChange(value, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textContentType={index === 0 ? 'oneTimeCode' : 'none'} // Only for first input to avoid iOS clearing issue
                    autoComplete={index === 0 ? 'sms-otp' : 'off'} // Only for first input
                    testID={`otp-input-${index}`}
                  />
                ))}
              </View>

              {timer > 0 ? (
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>
                    00: {timer < 10 ? `0${timer}` : timer}
                  </Text>
                </View>
              ) : (
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>
                    {t('did_not_receive_code')}
                  </Text>
                  <PrimaryButtonLabeled
                    title={t('resend_otp')}
                    onPress={handleResendOTP}
                  />
                </View>
              )}

              <PrimaryButton
                title={t('verify_otp')}
                onPress={handleVerification}
              />
              <PrimaryButtonOutlined
                onPress={async () => {
                  const auth = getAuth();
                  try {
                    await auth.signOut();
                  } catch (e) {
                    console.log('Error signing out:', e);
                  }
                  navigation.replace('SignIn');
                }}
                title={t('change_mobile_number')}
              />
            </View>
          </View>
        </ScrollView>
        {isLoading && <CustomeLoader loading={isLoading} />}
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    width: '100%',
  },
  body: {
    flex: 1,
    padding: moderateScale(24),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    minHeight: moderateScale(400),
    justifyContent: 'flex-start',
    marginTop: moderateScale(40),
  },
  backButton: {
    padding: moderateScale(8),
  },
  logo: {
    width: '33%',
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: moderateScale(10),
  },
  title: {
    fontSize: moderateScale(32),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: moderateScale(10),
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  phoneNumber: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  otpInput: {
    width: moderateScale(45),
    height: moderateScale(45),
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(5),
    textAlign: 'center',
    fontSize: moderateScale(20),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    backgroundColor: COLORS.lightGray,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  resendText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    marginRight: moderateScale(5),
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  timerText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
  },
  iconButton: {
    padding: 4,
  },
});

export default OTPVerificationScreen;
