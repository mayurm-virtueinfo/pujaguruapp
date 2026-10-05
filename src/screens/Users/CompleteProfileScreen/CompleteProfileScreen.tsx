import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
import AppConstant from '../../../utils/appConstant';

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

const CompleteProfileScreen: React.FC<Props> = ({ navigation }) => {
  const inset = useSafeAreaInsets();
  const { t } = useTranslation();

  const route = useRoute();
  const { phoneNumber } = (route.params as { phoneNumber: string }) || {};

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  const uidRef = useRef<string | null>(null);
  const [, setUid] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: phoneNumber || '',
    firstName: '',
    lastName: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<keyof FormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setScreenData] = useState<ScreenDimensions>(
    Dimensions.get('window'),
  );

  const fetchUID = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      const fetchedUid = await AsyncStorage.getItem(AppConstant.FIREBASE_UID);
      if (!fetchedUid && retryCount < 5) {
        await new Promise(res => setTimeout(() => res(null), 300));
        return fetchUID(retryCount + 1);
      }
      setUid(fetchedUid);
      uidRef.current = fetchedUid;
    } catch (error) {
      console.error('Error fetching UID:', error);
    }
  }, []);

  useEffect(() => {
    fetchUID();
    const onChange = (result: { window: ScreenDimensions }) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, [fetchUID]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const nameRegex = /^[a-zA-Z\s]{2,30}$/;

    if (!formData.phoneNumber) {
      errors.phoneNumber =
        t('invalid_phone_number') || 'Phone number is required';
    }

    if (!formData.firstName || !nameRegex.test(formData.firstName.trim())) {
      errors.firstName =
        t('invalid_first_name') ||
        'Please enter a valid first name (2-30 letters)';
    }

    if (!formData.lastName || !nameRegex.test(formData.lastName.trim())) {
      errors.lastName =
        t('invalid_last_name') ||
        'Please enter a valid last name (2-30 letters)';
    }

    if (!formData.address || formData.address.trim().length < 2) {
      errors.address =
        t('invalid_address') || 'Please enter your complete address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    let currentUid = uidRef.current;
    if (!currentUid) {
      await fetchUID();
      currentUid = uidRef.current;
    }

    if (!currentUid) {
      setIsLoading(false);
      setFormErrors(prev => ({
        ...prev,
        phoneNumber:
          t('uid_not_found_try_again') || 'Session error. Please try again.',
      }));
      return;
    }

    navigation.navigate('UserProfileScreen', {
      phoneNumber: formData.phoneNumber,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      address: formData.address.trim(),
      uid: currentUid,
    });
    setIsLoading(false);
  };

  const containerDynamic = { paddingTop: inset.top };

  return (
    <View style={[styles.container, containerDynamic]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.headerGradient}
      />
      <UserCustomHeader
        title={t('complete_your_profile') || 'Complete Your Profile'}
        showBackButton={true}
      />

      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Visual Hero Banner */}
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View style={styles.heroBanner}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarCircle}>
                    <Ionicons
                      name="person"
                      size={moderateScale(32)}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.avatarMiniBadge}>
                    <Ionicons
                      name="sparkles"
                      size={moderateScale(11)}
                      color={COLORS.primary}
                    />
                  </View>
                </View>

                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {t('step_1_of_2', 'Step 1 of 2')} •{' '}
                    {t('personal_details', 'Personal Details')}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  {t('tell_us_about_yourself', 'Tell Us About Yourself')}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {t(
                    'profile_screen_subtitle',
                    'Please enter your basic information to personalize your Vedic consultations and booking experience.',
                  )}
                </Text>
              </View>
            </TouchableWithoutFeedback>

            {/* Main Form Card */}
            <View style={styles.formCard}>
              {/* First Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('first_name') || 'First Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => firstNameRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    focusedField === 'firstName' && styles.inputWrapperFocused,
                    formErrors.firstName ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={moderateScale(18)}
                    color={
                      formErrors.firstName
                        ? '#EF4444'
                        : focusedField === 'firstName'
                        ? COLORS.primary
                        : '#94A3B8'
                    }
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    ref={firstNameRef}
                    style={styles.inputField}
                    placeholder={t('enter_first_name') || 'Enter first name'}
                    placeholderTextColor="#94A3B8"
                    value={formData.firstName}
                    onChangeText={text => handleInputChange('firstName', text)}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(prev =>
                          prev === 'firstName' ? null : prev,
                        );
                      }, 100);
                    }}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    textContentType="givenName"
                    maxLength={30}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                  {Boolean(formData.firstName) && (
                    <TouchableOpacity
                      onPress={() => handleInputChange('firstName', '')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={moderateScale(16)}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {Boolean(formErrors.firstName) && (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.firstName}</Text>
                  </View>
                )}
              </View>

              {/* Last Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('last_name') || 'Last Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => lastNameRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    focusedField === 'lastName' && styles.inputWrapperFocused,
                    formErrors.lastName ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={moderateScale(18)}
                    color={
                      formErrors.lastName
                        ? '#EF4444'
                        : focusedField === 'lastName'
                        ? COLORS.primary
                        : '#94A3B8'
                    }
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    ref={lastNameRef}
                    style={styles.inputField}
                    placeholder={t('enter_last_name') || 'Enter last name'}
                    placeholderTextColor="#94A3B8"
                    value={formData.lastName}
                    onChangeText={text => handleInputChange('lastName', text)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(prev =>
                          prev === 'lastName' ? null : prev,
                        );
                      }, 100);
                    }}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    textContentType="familyName"
                    maxLength={30}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => addressRef.current?.focus()}
                  />
                  {Boolean(formData.lastName) && (
                    <TouchableOpacity
                      onPress={() => handleInputChange('lastName', '')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={moderateScale(16)}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {Boolean(formErrors.lastName) && (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.lastName}</Text>
                  </View>
                )}
              </View>

              {/* Phone Number (Verified & Read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('phone_number') || 'Phone Number'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[styles.inputWrapper, styles.disabledInputWrapper]}
                >
                  <Ionicons
                    name="call-outline"
                    size={moderateScale(18)}
                    color="#64748B"
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.inputField, styles.disabledInputField]}
                    placeholder={
                      t('enter_phone_number') || 'Enter phone number'
                    }
                    placeholderTextColor="#94A3B8"
                    value={formData.phoneNumber}
                    editable={false}
                  />
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={moderateScale(14)}
                      color="#059669"
                    />
                    <Text style={styles.verifiedText}>
                      {t('verified', 'Verified')}
                    </Text>
                  </View>
                </View>
                {Boolean(formErrors.phoneNumber) && (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>
                      {formErrors.phoneNumber}
                    </Text>
                  </View>
                )}
              </View>

              {/* Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('address') || 'Address'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => addressRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    styles.addressWrapper,
                    focusedField === 'address' && styles.inputWrapperFocused,
                    formErrors.address ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={moderateScale(19)}
                    color={
                      formErrors.address
                        ? '#EF4444'
                        : focusedField === 'address'
                        ? COLORS.primary
                        : '#94A3B8'
                    }
                    style={styles.addressLeftIcon}
                  />
                  <TextInput
                    ref={addressRef}
                    style={[styles.inputField, styles.addressInputField]}
                    placeholder={
                      t(
                        'enter_address_placeholder',
                        'Flat / House No., Street, Area, City',
                      ) ||
                      t('enter_address') ||
                      'Enter address'
                    }
                    placeholderTextColor="#94A3B8"
                    value={formData.address}
                    onChangeText={text => handleInputChange('address', text)}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(prev =>
                          prev === 'address' ? null : prev,
                        );
                      }, 100);
                    }}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={150}
                  />
                </TouchableOpacity>
                {Boolean(formErrors.address) && (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.address}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Trust and Privacy Note */}
            <View style={styles.trustBadgeRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={moderateScale(15)}
                color="#64748B"
                style={styles.trustIcon}
              />
              <Text style={styles.trustText}>
                {t(
                  'profile_privacy_note',
                  'Your personal information is encrypted and never shared.',
                )}
              </Text>
            </View>

            {/* Next Action Button */}
            <TouchableOpacity
              style={styles.nextButton}
              activeOpacity={0.85}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>{t('next') || 'NEXT'}</Text>
              <View style={styles.nextButtonIconCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={moderateScale(16)}
                  color={COLORS.primaryTextDark}
                />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
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
    height: 180,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
    marginTop: verticalScale(6),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(36),
  },
  heroBanner: {
    alignItems: 'center',
    marginBottom: verticalScale(18),
    paddingHorizontal: scale(12),
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: verticalScale(12),
  },
  avatarCircle: {
    width: moderateScale(66),
    height: moderateScale(66),
    borderRadius: moderateScale(33),
    backgroundColor: '#FFF0F1',
    borderWidth: 2,
    borderColor: '#FFE0E3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: moderateScale(3),
    borderWidth: 1.5,
    borderColor: '#FFE0E3',
  },
  stepBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBadgeText: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(11),
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(20),
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: verticalScale(4),
  },
  heroSubtitle: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: verticalScale(16),
  },
  fieldLabel: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(13),
    color: '#334155',
    marginBottom: verticalScale(6),
  },
  redAsterisk: {
    color: '#DC2626',
    fontFamily: Fonts.Sen_Bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: scale(14),
    minHeight: verticalScale(48),
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputLeftIcon: {
    marginRight: scale(10),
  },
  inputField: {
    flex: 1,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(14),
    color: '#1E293B',
    paddingVertical: 0,
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  disabledInputField: {
    color: '#475569',
    fontFamily: Fonts.Sen_Medium,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(11),
    color: '#059669',
    marginLeft: scale(4),
  },
  addressWrapper: {
    alignItems: 'flex-start',
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(10),
    minHeight: verticalScale(90),
  },
  addressLeftIcon: {
    marginTop: verticalScale(2),
    marginRight: scale(10),
  },
  addressInputField: {
    height: verticalScale(70),
    textAlignVertical: 'top',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(5),
    paddingLeft: scale(2),
  },
  errorIcon: {
    marginRight: scale(4),
  },
  errorText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    color: '#EF4444',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(10),
  },
  trustIcon: {
    marginRight: scale(6),
  },
  trustText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(16),
    height: verticalScale(52),
    shadowColor: COLORS.primaryBackgroundButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    color: COLORS.primaryTextDark,
    letterSpacing: 0.8,
    marginRight: scale(8),
  },
  nextButtonIconCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CompleteProfileScreen;
