import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {AuthStackParamList} from '../navigation/AuthNavigator';
import ThemedInput from '../components/ThemedInput';
import {getAuth, signInWithPhoneNumber} from '@react-native-firebase/auth';
import {validatePhoneNumber} from '../helper/Validation';
import {moderateScale} from 'react-native-size-matters';
import {useCommonToast} from '../common/CommonToast';
import {COLORS} from '../theme/theme';
import PrimaryButton from '../components/PrimaryButton';
import {Images} from '../theme/Images';
import Fonts from '../theme/fonts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import CustomeLoader from '../components/CustomeLoader';

type SignInScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'SignIn'
>;

type SignInScreenRouteProp = RouteProp<AuthStackParamList, 'SignIn'>;

interface Props {
  navigation: SignInScreenNavigationProp;
  route: SignInScreenRouteProp;
}

const SignInScreen: React.FC<Props> = ({navigation, route}) => {
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const {showErrorToast, showSuccessToast} = useCommonToast();
  const [phoneNumber, setPhoneNumber] = useState('1111111111');
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{phoneNumber?: string}>({});
  const [previousPhoneNumber, setPreviousPhoneNumber] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      setErrors({});
      setLoading(false);

      if (route.params?.previousPhoneNumber) {
        setPreviousPhoneNumber(route.params.previousPhoneNumber);
      }
    }, [route.params]),
  );

  const proceedWithOTP = async (formattedPhone: string) => {
    try {
      setLoading(true);

      const auth = getAuth();
      if (auth.currentUser) {
        await auth.signOut();
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      const confirmation = await signInWithPhoneNumber(
        getAuth(),
        formattedPhone,
      );

      setLoading(false);
      showSuccessToast('OTP has been sent to your phone.');
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        confirmation,
      });
    } catch (error: any) {
      console.error('Full error object:', error);
      setLoading(false);
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        errorMessage =
          'Too many requests. Please wait a few minutes and try again.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage =
          'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'App not authorized for phone authentication.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Captcha verification failed. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showErrorToast(errorMessage);
    }
  };

  const handleSignIn = async () => {
    const cleanPhoneNumber = phoneNumber.trim().replace(/\s+/g, '');

    if (!cleanPhoneNumber) {
      const newErrors: any = {};
      newErrors.phoneNumber = 'Please enter your phone number.';
      setErrors(newErrors);
      return;
    }

    const formattedPhone = cleanPhoneNumber.startsWith('+')
      ? cleanPhoneNumber
      : `+91${cleanPhoneNumber}`;

    if (previousPhoneNumber && formattedPhone === previousPhoneNumber) {
      Alert.alert(
        'Same Number Detected',
        'You entered the same phone number. What would you like to do?',
        [
          {
            text: 'Enter Different Number',
            onPress: () => {
              setPhoneNumber('');
              setPreviousPhoneNumber('');
            },
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
      return;
    }

    if (!validatePhoneNumber(formattedPhone)) {
      const newErrors: any = {};
      newErrors.phoneNumber =
        'Please enter a valid phone number in international format.';
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await proceedWithOTP(formattedPhone);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground
        source={Images.ic_splash_background}
        style={styles.container}
        resizeMode="cover">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View
              style={[
                styles.containerHeader,
                {paddingTop: inset.top + moderateScale(20)},
              ]}>
              <Image source={Images.ic_app_logo} style={styles.logo} />
              <Text style={styles.title}>{t('hi_welcome')}</Text>
            </View>

            <View style={styles.containerBody}>
              <Text style={styles.mainTitle}>{t('sign_in')}</Text>
              <Text style={styles.subtitle}>
                {t('please_enter_your_credential')}
              </Text>

              <View style={styles.inputContainer}>
                <ThemedInput
                  placeholder={t('phone_number')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>

              <PrimaryButton title={t('send_otp')} onPress={handleSignIn} />

              {/* Commented out terms and conditions section
              <Text style={styles.termsText}>
                {t('by_signing_in_you_agree_to_our')}
                <Text
                  style={{color: COLORS.primaryBackgroundButton}}
                  onPress={() => {
                    Alert.alert(
                      t('terms_of_service'),
                      t('terms_of_service_content'),
                    );
                  }}>
                  {` ${t('terms_of_service')}`}
                </Text>
                {` ${t('and')}`}
                <Text
                  style={{color: COLORS.primaryBackgroundButton}}
                  onPress={() => {
                    Alert.alert(
                      t('privacy_policy'),
                      t('privacy_policy_content'),
                    );
                  }}>
                  {` ${t('privacy_policy')}`}
                </Text>
              </Text>
              */}
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
    justifyContent: 'center',
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
  inputContainer: {
    marginBottom: 24,
  },
  containerHeader: {
    height: moderateScale(220),
    alignItems: 'center',
  },
  containerBody: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    flex: 1,
    padding: moderateScale(24),
    backgroundColor: '#FFFFFF',
  },
  termsText: {
    fontSize: moderateScale(12),
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Regular,
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default SignInScreen;
