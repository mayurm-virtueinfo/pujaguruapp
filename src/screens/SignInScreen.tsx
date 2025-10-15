import React, {useState, useEffect, useRef} from 'react';
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
  TouchableOpacity,
  Modal,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
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
import CustomeLoader from '../components/CustomeLoader';
import {
  getTermsAndConditions,
  getUserAgreement,
  getRefundPolicy,
} from '../api/apiService';
import CustomDropdown from '../components/CustomDropdown';
import {changeLanguage} from '../i18n';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const {showErrorToast, showSuccessToast} = useCommonToast();
  const [phoneNumber, setPhoneNumber] = useState(__DEV__ ? '1111111111' : '');
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{phoneNumber?: string}>({});
  const [policiesError, setPoliciesError] = useState<string | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [languageModalVisible, setLanguageModalVisible] =
    useState<boolean>(true);
  const [termsContent, setTermsContent] = useState<string>('');
  const [userAgreementContent, setUserAgreementContent] = useState<string>('');
  const [refundPolicyContent, setRefundPolicyContent] = useState<string>('');
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (i18n?.language) {
      setSelectedLanguage(i18n.language as string);
    }
  }, [i18n?.language]);

  useFocusEffect(
    React.useCallback(() => {
      setErrors({});
      setLoading(false);

      getTermsAndConditions()
        .then(data => setTermsContent(data || ''))
        .catch(() => setTermsContent(''));

      getUserAgreement()
        .then(data => setUserAgreementContent(data || ''))
        .catch(() => setUserAgreementContent(''));

      getRefundPolicy()
        .then(data => setRefundPolicyContent(data || ''))
        .catch(() => setRefundPolicyContent(''));
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

    if (!isAgreed) {
      setPoliciesError('You must accept the terms to continue.');
      return;
    }

    if (!cleanPhoneNumber) {
      setErrors({phoneNumber: 'Please enter your phone number.'});
      return;
    }

    const formattedPhone = cleanPhoneNumber.startsWith('+')
      ? cleanPhoneNumber
      : `+91${cleanPhoneNumber}`;

    if (!validatePhoneNumber(formattedPhone)) {
      setErrors({
        phoneNumber:
          'Please enter a valid phone number in international format.',
      });
      return;
    }

    setErrors({});
    await proceedWithOTP(formattedPhone);
  };

  const handleOpenPolicy = (type: 'terms' | 'user' | 'refund') => {
    let title = '';
    let htmlContent = '';
    if (type === 'terms') {
      title = t('terms_and_conditions') || 'Terms & Conditions';
      htmlContent =
        termsContent ||
        t('terms_and_conditions_content') ||
        'Here are the Terms & Conditions...';
    } else if (type === 'user') {
      title = t('user_agreement') || 'User Agreement';
      htmlContent =
        userAgreementContent ||
        t('user_agreement_content') ||
        'Here is the User Agreement...';
    } else if (type === 'refund') {
      title = t('refund_policy') || 'Refund Policy';
      htmlContent =
        refundPolicyContent ||
        t('refund_policy_content') ||
        'Here is the Refund Policy...';
    }

    navigation.navigate('TermsPolicyScreen', {
      title,
      htmlContent,
    });
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
            <View style={[styles.containerHeader, {paddingTop: inset.top}]}>
              <Image source={Images.ic_app_logo} style={styles.logo} />
              <Text style={styles.title}>{t('hi_welcome')}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLanguageModalVisible(true)}
                hitSlop={{bottom: 12, left: 12, right: 12}}
                style={styles.languagePill}>
                <Text style={styles.languagePillIcon}>
                  <Icon name="language" size={20} color={COLORS.white} />
                </Text>
                <Text style={styles.languagePillText}>
                  {selectedLanguage === 'en'
                    ? 'English'
                    : selectedLanguage === 'hi'
                    ? 'हिन्दी'
                    : selectedLanguage === 'gu'
                    ? 'ગુજરાતી'
                    : selectedLanguage === 'mr'
                    ? 'मराठी'
                    : selectedLanguage}
                </Text>
              </TouchableOpacity>
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

              <View style={styles.termsRow}>
                <View style={styles.checkboxWrapper}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsAgreed(!isAgreed)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{checked: isAgreed}}
                    accessibilityLabel="Agree to terms">
                    <View
                      style={[
                        styles.checkbox,
                        isAgreed && styles.checkboxChecked,
                      ]}>
                      {isAgreed && (
                        <Icon
                          name="check"
                          size={moderateScale(16)}
                          color="#fff"
                          style={styles.checkboxIcon}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{flex: 1}}>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => handleOpenPolicy('terms')}>
                      Terms & Conditions
                    </Text>
                    {', '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => handleOpenPolicy('user')}>
                      User Agreement
                    </Text>
                    {' & '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => handleOpenPolicy('refund')}>
                      Refund Policy
                    </Text>
                  </Text>
                </View>
              </View>

              {!!policiesError && (
                <Text style={styles.errorText}>{policiesError}</Text>
              )}

              <Modal
                visible={languageModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setLanguageModalVisible(false)}>
                <View style={styles.languageModalOverlay}>
                  <View style={styles.languageModalCard}>
                    <Text style={styles.languageModalTitle}>
                      {t('language') || 'Language'}
                    </Text>
                    <CustomDropdown
                      label={t('language') || 'Language'}
                      items={[
                        {label: 'English', value: 'en'},
                        {label: 'हिन्दी', value: 'hi'},
                        {label: 'ગુજરાતી', value: 'gu'},
                        {label: 'मराठी', value: 'mr'},
                      ]}
                      selectedValue={selectedLanguage}
                      onSelect={async (value: string) => {
                        setSelectedLanguage(value);
                      }}
                    />
                    <PrimaryButton
                      title={t('continue') || 'continue'}
                      onPress={async () => {
                        await changeLanguage(selectedLanguage);
                        setLanguageModalVisible(false);
                      }}
                      style={{marginTop: moderateScale(16)}}
                    />
                  </View>
                </View>
              </Modal>

              <PrimaryButton
                title={t('send_otp')}
                onPress={handleSignIn}
                disabled={!isAgreed}
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
    justifyContent: 'center',
  },
  logo: {
    width: '33%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: moderateScale(30),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: moderateScale(8),
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
    marginBottom: moderateScale(8),
  },
  containerHeader: {
    height: moderateScale(250),
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: moderateScale(20),
  },
  languagePill: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(24),
    marginTop: moderateScale(30),
    zIndex: 10,
    elevation: 10,
  },
  languagePillIcon: {
    fontSize: moderateScale(16),
    color: COLORS.white,
    marginRight: moderateScale(6),
  },
  languagePillText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
  },
  containerBody: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    flex: 1,
    padding: moderateScale(24),
    backgroundColor: '#FFFFFF',
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  languageModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
  },
  languageModalTitle: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: moderateScale(10),
  },
  checkboxContainer: {
    marginRight: moderateScale(8),
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderColor: COLORS.primaryBackgroundButton,
  },
  checkboxIcon: {
    alignSelf: 'center',
  },
  checkboxWrapper: {
    paddingTop: moderateScale(3),
  },
  termsTextContainer: {
    flex: 1,
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: moderateScale(13),
    color: '#000',
    lineHeight: moderateScale(18),
  },

  termsLink: {
    color: COLORS.primaryBackgroundButton,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
