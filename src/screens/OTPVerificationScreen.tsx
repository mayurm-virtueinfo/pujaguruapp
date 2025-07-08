import React, {useState, useRef} from 'react';
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
import {apiService, postSignIn} from '../api/apiService';
import {useAuth} from '../provider/AuthProvider';
import {MainAppStackParamList} from '../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';

type AuthNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'OTPVerification' | 'CompleteProfileScreen' | 'UserAppBottomTabNavigator'
>;

// type MainAppNavigationProp = StackNavigationProp<
//   MainAppStackParamList,
//   'UserAppBottomTabNavigator'
// >;

type OTPVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'OTPVerification'
>;

type OTPVerificationScreenNavigationProp = AuthNavigationProp;
// | MainAppNavigationProp;

interface Props {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<Props> = ({navigation, route}) => {
  const {t} = useTranslation();
  const {showErrorToast, showSuccessToast} = useCommonToast();
  const {signIn} = useAuth();
  const inset = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setLoading] = useState(false);
  const [otpConfirmation, setOtpConfirmation] = useState(
    route.params.confirmation,
  );
  const {phoneNumber} = route.params;
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSignIn = async (phoneNumber: string, uid: string) => {
    setLoading(true);
    try {
      const params = {
        mobile: phoneNumber,
        firebase_uid: uid,
      };
      const response = await postSignIn(params);
      if (response) {
        console.log('response :: ', response);
        if (response?.is_register === false) {
          navigation.navigate('CompleteProfileScreen');
        } else {
          signIn(response.access_token);
          await AsyncStorage.setItem(
            AppConstant.REFRESH_TOKEN,
            response.refresh_token,
          );
          navigation.navigate('UserAppBottomTabNavigator');
        }
      }
    } catch (error: any) {
      showErrorToast(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    try {
      setLoading(true);
      const userCredential = await otpConfirmation.confirm(code);
      if (userCredential?.user) {
        await handleSignIn(phoneNumber, userCredential.user.uid);
        await AsyncStorage.setItem(
          AppConstant.FIREBASE_UID,
          userCredential.user.uid,
        );
      }
    } catch (error: any) {
      showErrorToast(error?.message);
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
      const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
      setOtpConfirmation(confirmation);
      showSuccessToast(t('otp_resent'));
    } catch (error: any) {
      showErrorToast(error?.message || t('resend_otp_failed'));
    } finally {
      setLoading(false);
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
            <View style={styles.header}>
              <Image source={Images.ic_app_logo} style={styles.logo} />
              <Text style={styles.title}>{t('hi_welcome')}</Text>
            </View>
            <View style={[styles.body, {paddingBottom: inset.bottom}]}>
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
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    height: moderateScale(220),
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: moderateScale(24),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  logo: {
    width: '33%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: moderateScale(32),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
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
});

export default OTPVerificationScreen;
