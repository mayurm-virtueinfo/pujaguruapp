import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImagePicker from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import ApiEndpoints, { APP_URL, POST_SIGNUP } from '../../../api/apiEndpoints';
import {
  getCity,
  getState,
  postRegisterFCMToken,
} from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { getFcmToken } from '../../../configuration/firebaseMessaging';
import { useLocation } from '../../../context/LocationContext';
import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
import AppConstant from '../../../utils/appConstant';
import PermissionDeniedView from '../Panchang/components/PermissionDeniedView';

type CompleteProfileScreenRouteProp = NavigationProp<
  AuthStackParamList,
  'UserAppBottomTabNavigator'
>;

type CompleteProfileScreenRouteProps = RouteProp<
  AuthStackParamList,
  'UserProfileScreen'
>;

interface FormErrors {
  userName?: string;
  email?: string;
  phone?: string;
  state?: string;
  location?: string;
  dob?: string;
}

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const m = moment(dateStr);
  return m.isValid() ? m.format('DD MMM YYYY') : '';
};

const UserProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<CompleteProfileScreenRouteProp>();
  const route = useRoute<CompleteProfileScreenRouteProps>();
  const { phoneNumber, firstName, lastName, address, uid } =
    (route?.params as any) || {};

  const userNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    mobile: phoneNumber || '',
    firebase_uid: uid || '',
    first_name: firstName || '',
    last_name: lastName || '',
    address: address || '',
    role: 1,
    email: '',
    dob: '',
    state: '',
    city: '',
    latitude: '0',
    longitude: '0',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));
  const [state, setState] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [city, setCity] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const { showErrorToast } = useCommonToast();

  const {
    location: locationData,
    refreshLocation,
    permissionStatus,
    loading: locationLoading,
  } = useLocation();

  useEffect(() => {
    if (locationData) {
      setFormData(prev => {
        if (prev.latitude === '0' && prev.longitude === '0') {
          return {
            ...prev,
            latitude: locationData.latitude.toString(),
            longitude: locationData.longitude.toString(),
          };
        }
        return prev;
      });
    }
  }, [locationData]);

  useEffect(() => {
    const getStateData = async () => {
      setIsLoading(true);
      try {
        const response: any = await getState();
        if (Array.isArray(response?.data)) {
          const stateData = response.data.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setState(stateData);
        } else {
          setState([]);
        }
      } catch (error: any) {
        console.log('Error fetching states:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getStateData();
  }, []);

  useEffect(() => {
    const getCityData = async () => {
      if (!formData.state) {
        setCity([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getCity(formData.state);
        if (Array.isArray(response)) {
          const cityData = response.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setCity(cityData);
        } else {
          setCity([]);
        }
      } catch (error: any) {
        console.log('Error fetching cities:', error);
        setCity([]);
      } finally {
        setIsLoading(false);
      }
    };

    getCityData();
  }, [formData.state]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name || formData.first_name.trim().length < 2) {
      errors.userName =
        t('invalid_user_name') || 'Please enter a valid user name';
    }

    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errors.email = t('invalid_email') || 'Please enter a valid email address';
    }

    if (!formData.mobile) {
      errors.phone = t('phone_required') || 'Phone number is required';
    } else if (!/^\+?\d+$/.test(formData.mobile)) {
      errors.phone =
        t('invalid_phone_digits') || 'Phone number must contain only numbers';
    }

    if (!formData.dob) {
      errors.dob = t('dob_required') || 'Date of Birth is required';
    }

    if (!formData.state) {
      errors.state = t('state_required') || 'State is required';
    }

    if (!formData.city) {
      errors.location = t('city_required') || 'City is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    if (formData.latitude === '0' || formData.longitude === '0') {
      showErrorToast(
        t('fetching_gps_location') || 'Please wait, fetching GPS location...',
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new FormData();

      Object.keys(formData).forEach(key => {
        params.append(key, formData[key as keyof typeof formData]);
      });

      if (profileImage) {
        params.append('profile_img', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type,
        } as any);
      }

      if (!APP_URL) {
        showErrorToast('Configuration Error: APP_URL is missing');
        setIsLoading(false);
        return;
      }

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000);
      });

      const response: any = await Promise.race([
        fetch(`${APP_URL}${POST_SIGNUP}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-Master-Key': ApiEndpoints.XMasterKey,
          },
          body: params,
        }),
        timeout,
      ]);

      const responseText = await response.text();
      let responseJson: any;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON', e);
        throw {
          response: {
            data: { message: 'Invalid server response', raw: responseText },
          },
        };
      }

      if (!response.ok) {
        throw { response: { data: responseJson } };
      }

      if (responseJson) {
        await AsyncStorage.setItem(
          AppConstant.ACCESS_TOKEN,
          responseJson.access_token,
        );
        await AsyncStorage.setItem(
          AppConstant.REFRESH_TOKEN,
          responseJson.refresh_token,
        );
        await AsyncStorage.setItem(
          AppConstant.CURRENT_USER,
          JSON.stringify(responseJson.user),
        );
        await AsyncStorage.setItem(
          AppConstant.LOCATION,
          JSON.stringify({
            ...responseJson.location,
            timestamp: new Date().toISOString(),
          }),
        );
        const userID = responseJson.user?.id;
        await AsyncStorage.setItem(AppConstant.USER_ID, String(userID));
        const fcmToken = await getFcmToken();

        if (fcmToken) {
          postRegisterFCMToken(fcmToken, 'user');
        }
        navigation.navigate('UserAppBottomTabNavigator');
      }
    } catch (error: any) {
      console.log('Error in user profile signup:', error);
      showErrorToast(
        error?.response?.data?.message ||
          'Network Error, Please check your connection and try again',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    Keyboard.dismiss();
    Alert.alert(
      t('select_profile_picture') || 'Select Profile Photo',
      t('choose_an_option') || 'Choose photo from',
      [
        { text: t('take_photo') || 'Take Photo', onPress: () => openCamera() },
        {
          text: t('choose_from_gallery') || 'Choose from Gallery',
          onPress: () => openGallery(),
        },
        { text: t('cancel') || 'Cancel', style: 'cancel' },
      ],
    );
  };

  const openCamera = async () => {
    try {
      const image1 = await ImagePicker.openCamera({
        mediaType: 'photo',
        width: 240,
        height: 240,
        compressImageQuality: 0.7,
        cropping: true,
      });

      const ext = image1.path.substring(image1.path.lastIndexOf('.') + 1);
      const partPhoto = {
        name: `${image1.modificationDate || Date.now()}.${ext}`,
        type: image1.mime,
        uri:
          Platform.OS === 'android'
            ? image1.path.startsWith('file://')
              ? image1.path
              : `file://${image1.path}`
            : image1.path.replace('file://', ''),
      };
      setProfileImage(partPhoto);
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('Error accessing camera:', error);
        showErrorToast(error?.message || 'Failed to take photo');
      }
    }
  };

  const openGallery = async () => {
    try {
      const image1 = await ImagePicker.openPicker({
        mediaType: 'photo',
        width: 240,
        height: 240,
        compressImageQuality: 0.7,
        cropping: true,
      });

      const ext = image1.path.substring(image1.path.lastIndexOf('.') + 1);
      const partPhoto = {
        name: `${image1.modificationDate || Date.now()}.${ext}`,
        type: image1.mime,
        uri:
          Platform.OS === 'android'
            ? image1.path.startsWith('file://')
              ? image1.path
              : `file://${image1.path}`
            : image1.path.replace('file://', ''),
      };
      setProfileImage(partPhoto);
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('Error accessing gallery:', error);
        showErrorToast(error?.message || 'Failed to select photo');
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, dob: formattedDate }));
        setFormErrors(prev => ({ ...prev, dob: undefined }));
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    const formattedDate = tempDate.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, dob: formattedDate }));
    setFormErrors(prev => ({ ...prev, dob: undefined }));
    setShowDatePicker(false);
  };

  if (!locationData && !locationLoading) {
    return (
      <View style={styles.container}>
        <PermissionDeniedView
          onRetry={refreshLocation}
          isPermanent={permissionStatus === 'blocked'}
        />
      </View>
    );
  }

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
        title={t('profile') || 'Profile'}
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
            {/* Profile Avatar Header Section */}
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={handleImagePicker}
                  activeOpacity={0.85}
                  style={styles.avatarTouchArea}
                >
                  <View style={styles.avatarRing}>
                    {profileImage?.uri ? (
                      <Image
                        source={{ uri: profileImage.uri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Icon
                          name="person"
                          size={moderateScale(42)}
                          color="#94A3B8"
                        />
                      </View>
                    )}
                    <View style={styles.cameraBadge}>
                      <Icon
                        name="camera"
                        size={moderateScale(15)}
                        color={COLORS.white}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {t('step_2_of_2', 'Step 2 of 2')} •{' '}
                    {t('account_details', 'Account & Location')}
                  </Text>
                </View>

                <Text style={styles.avatarHintText}>
                  {t(
                    'tap_to_change_photo',
                    'Tap on the avatar to upload a profile photo',
                  )}
                </Text>
              </View>
            </TouchableWithoutFeedback>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* User Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('user_name') || 'User Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => userNameRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    focusedField === 'first_name' && styles.inputWrapperFocused,
                    formErrors.userName ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="person-outline"
                    size={moderateScale(18)}
                    color={
                      formErrors.userName
                        ? '#EF4444'
                        : focusedField === 'first_name'
                        ? COLORS.primary
                        : '#94A3B8'
                    }
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    ref={userNameRef}
                    style={styles.inputField}
                    placeholder={t('enter_your_name') || 'Enter user name'}
                    placeholderTextColor="#94A3B8"
                    value={formData.first_name}
                    onChangeText={text => {
                      setFormData(prev => ({ ...prev, first_name: text }));
                      setFormErrors(prev => ({ ...prev, userName: undefined }));
                    }}
                    onFocus={() => setFocusedField('first_name')}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(prev =>
                          prev === 'first_name' ? null : prev,
                        );
                      }, 100);
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                  {Boolean(formData.first_name) && (
                    <TouchableOpacity
                      onPress={() => {
                        setFormData(prev => ({ ...prev, first_name: '' }));
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name="close-circle"
                        size={moderateScale(16)}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {Boolean(formErrors.userName) && (
                  <View style={styles.errorRow}>
                    <Icon
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.userName}</Text>
                  </View>
                )}
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('email') || 'Email'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => emailRef.current?.focus()}
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                    formErrors.email ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="mail-outline"
                    size={moderateScale(18)}
                    color={
                      formErrors.email
                        ? '#EF4444'
                        : focusedField === 'email'
                        ? COLORS.primary
                        : '#94A3B8'
                    }
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    ref={emailRef}
                    style={styles.inputField}
                    placeholder={t('enter_your_email') || 'Enter your email'}
                    placeholderTextColor="#94A3B8"
                    value={formData.email}
                    onChangeText={text => {
                      setFormData(prev => ({ ...prev, email: text }));
                      setFormErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocusedField(prev =>
                          prev === 'email' ? null : prev,
                        );
                      }, 100);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  {Boolean(formData.email) && (
                    <TouchableOpacity
                      onPress={() => {
                        setFormData(prev => ({ ...prev, email: '' }));
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name="close-circle"
                        size={moderateScale(16)}
                        color="#CBD5E1"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {Boolean(formErrors.email) && (
                  <View style={styles.errorRow}>
                    <Icon
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.email}</Text>
                  </View>
                )}
              </View>

              {/* Date of Birth */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('dob') || 'Date of Birth'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (formData.dob) {
                      setTempDate(new Date(formData.dob));
                    }
                    setShowDatePicker(true);
                  }}
                  style={[
                    styles.inputWrapper,
                    formErrors.dob ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="calendar-outline"
                    size={moderateScale(18)}
                    color={formErrors.dob ? '#EF4444' : '#94A3B8'}
                    style={styles.inputLeftIcon}
                  />
                  <Text
                    style={[
                      styles.pickerValueText,
                      !formData.dob && styles.placeholderText,
                    ]}
                  >
                    {formData.dob
                      ? formatDateDisplay(formData.dob)
                      : t('select_dob') || 'Select Date of Birth'}
                  </Text>
                  <Icon
                    name="calendar"
                    size={moderateScale(18)}
                    color={COLORS.primary}
                    style={styles.pickerActionIcon}
                  />
                </TouchableOpacity>
                {Boolean(formErrors.dob) && (
                  <View style={styles.errorRow}>
                    <Icon
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.dob}</Text>
                  </View>
                )}

                {/* Date Picker (iOS Modal vs Android Dialog) */}
                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.modalCancelText}>
                              {t('cancel') || 'Cancel'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.modalTitleText}>
                            {t('dob') || 'Date of Birth'}
                          </Text>
                          <TouchableOpacity onPress={confirmIOSDate}>
                            <Text style={styles.modalDoneText}>
                              {t('done') || 'Done'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display="spinner"
                          maximumDate={new Date()}
                          onChange={handleDateChange}
                          themeVariant="light"
                          style={styles.iosDatePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  showDatePicker && (
                    <DateTimePicker
                      value={
                        formData.dob
                          ? new Date(formData.dob)
                          : new Date(2000, 0, 1)
                      }
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={handleDateChange}
                    />
                  )
                )}
              </View>

              {/* Phone (Verified) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('phone') || 'Phone'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[styles.inputWrapper, styles.disabledInputWrapper]}
                >
                  <Icon
                    name="call-outline"
                    size={moderateScale(18)}
                    color="#64748B"
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.inputField, styles.disabledInputField]}
                    value={formData.mobile}
                    editable={false}
                  />
                  <View style={styles.verifiedBadge}>
                    <Icon
                      name="checkmark-circle"
                      size={moderateScale(14)}
                      color="#059669"
                    />
                    <Text style={styles.verifiedText}>
                      {t('verified', 'Verified')}
                    </Text>
                  </View>
                </View>
                {Boolean(formErrors.phone) && (
                  <View style={styles.errorRow}>
                    <Icon
                      name="alert-circle"
                      size={moderateScale(13)}
                      color="#EF4444"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{formErrors.phone}</Text>
                  </View>
                )}
              </View>

              {/* State Dropdown */}
              <View style={styles.fieldGroup}>
                <CustomDropdown
                  label={t('state') || 'State'}
                  items={state}
                  selectedValue={formData.state}
                  onSelect={value => {
                    setFormData(prev => ({ ...prev, state: value, city: '' }));
                    setFormErrors(prev => ({
                      ...prev,
                      state: undefined,
                      location: undefined,
                    }));
                  }}
                  placeholder={t('enter_your_State') || 'Select your State'}
                  error={formErrors.state}
                  required
                />
              </View>

              {/* City Dropdown */}
              <View style={styles.fieldGroup}>
                <CustomDropdown
                  label={t('city') || 'City'}
                  items={city}
                  selectedValue={formData.city}
                  onSelect={value => {
                    setFormData(prev => ({ ...prev, city: value }));
                    setFormErrors(prev => ({ ...prev, location: undefined }));
                  }}
                  placeholder={
                    formData.state
                      ? t('enter_your_location') || 'Select your City'
                      : t('select_state_first') || 'Select State First'
                  }
                  error={formErrors.location}
                  required
                />
              </View>
            </View>

            {/* GPS Location Status Indicator */}
            <View style={styles.locationStatusRow}>
              <Icon
                name={
                  formData.latitude !== '0' && formData.longitude !== '0'
                    ? 'navigate-circle'
                    : 'compass-outline'
                }
                size={moderateScale(16)}
                color={
                  formData.latitude !== '0' && formData.longitude !== '0'
                    ? '#059669'
                    : '#D97706'
                }
                style={styles.locationIcon}
              />
              <Text style={styles.locationStatusText}>
                {formData.latitude !== '0' && formData.longitude !== '0'
                  ? t(
                      'gps_connected',
                      'GPS Coordinates linked for Vedic Charts',
                    )
                  : t('detecting_gps', 'Detecting location coordinates...')}
              </Text>
            </View>

            {/* Save / Complete Button */}
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.85}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {t('save') || 'SAVE CHANGES'}
              </Text>
              <View style={styles.saveButtonIconCircle}>
                <Icon
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
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(36),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  avatarTouchArea: {
    marginBottom: verticalScale(10),
  },
  avatarRing: {
    width: moderateScale(92),
    height: moderateScale(92),
    borderRadius: moderateScale(46),
    backgroundColor: '#FFF0F1',
    borderWidth: 3,
    borderColor: '#FFE0E3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  avatarImage: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
  },
  avatarPlaceholder: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(43),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stepBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(6),
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
  avatarHintText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
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
    marginBottom: verticalScale(14),
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
  pickerValueText: {
    flex: 1,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(14),
    color: '#1E293B',
  },
  placeholderText: {
    color: '#94A3B8',
    fontFamily: Fonts.Sen_Regular,
  },
  pickerActionIcon: {
    marginLeft: scale(8),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    paddingBottom: verticalScale(28),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitleText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    color: '#1E293B',
  },
  modalCancelText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(14),
    color: '#64748B',
  },
  modalDoneText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: COLORS.primary,
  },
  iosDatePicker: {
    height: verticalScale(190),
  },
  locationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(18),
    paddingHorizontal: scale(10),
  },
  locationIcon: {
    marginRight: scale(6),
  },
  locationStatusText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
  },
  saveButton: {
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
  saveButtonText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    color: COLORS.primaryTextDark,
    letterSpacing: 0.8,
    marginRight: scale(8),
  },
  saveButtonIconCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserProfileScreen;
