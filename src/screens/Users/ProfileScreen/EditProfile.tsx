import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Keyboard,
  Alert,
  Modal,
  Text,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  getEditProfile,
  getOldCityApi,
  putEditProfile,
} from '../../../api/apiService';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomeLoader from '../../../components/CustomeLoader';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { useCommonToast } from '../../../common/CommonToast';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  latitude?: string;
  longitude?: string;
  dob: string;
}

interface UserProfileApiResponse {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  profile_img?: string;
  address?: {
    city?: string | number;
    address_line1?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
}

const DEFAULT_AVATAR =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU';

const UserEditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showErrorToast, showSuccessToast } = useCommonToast();
  const toastRef = useRef({ showErrorToast, showSuccessToast });
  toastRef.current = { showErrorToast, showSuccessToast };

  const routeParams = useRoute().params as { edit?: boolean } | undefined;
  const isEditing = routeParams?.edit ?? true;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    dob: '',
  });

  const [city, setCity] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        handleInputChange(
          'dob',
          moment(selectedDate).format('YYYY-MM-DD'),
          formData.latitude,
          formData.longitude,
        );
      }
    } else if (selectedDate) {
      handleInputChange(
        'dob',
        moment(selectedDate).format('YYYY-MM-DD'),
        formData.latitude,
        formData.longitude,
      );
    }
  };

  const confirmIOSDate = () => {
    setShowDatePicker(false);
  };

  const getDatePickerDate = (): Date => {
    if (formData.dob) {
      const parsed = new Date(formData.dob);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfileAndCity = async () => {
      setIsLoading(true);
      try {
        const [profileResult, citiesResult] = await Promise.all([
          getEditProfile(),
          getOldCityApi(),
        ]);
        const profile = profileResult as UserProfileApiResponse | null;
        const cities = citiesResult as any[];

        let cityData: { label: string; value: string }[] = [];
        if (Array.isArray(cities)) {
          cityData = cities.map((item: any) => ({
            label: item.name,
            value: String(item.id),
          }));
        }

        if (isMounted) {
          setCity(cityData);

          const userAddress = profile?.address;
          let selectedCityId = '';
          if (userAddress?.city) {
            const targetCity = String(userAddress.city);
            const foundCity = cityData.find(
              c => String(c.value) === targetCity,
            );
            if (foundCity) {
              selectedCityId = String(foundCity.value);
            }
          }

          setFormData({
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
            email: profile?.email || '',
            phone: profile?.mobile || '',
            address: userAddress?.address_line1 || '',
            location: selectedCityId,
            latitude:
              userAddress?.latitude != null ? String(userAddress.latitude) : '',
            longitude:
              userAddress?.longitude != null
                ? String(userAddress.longitude)
                : '',
            dob: profile?.dob || '',
          });

          if (profile?.profile_img) {
            setProfileImage({
              uri: profile.profile_img,
              name: `profile_${Date.now()}.jpg`,
              type: 'image/jpeg',
            });
          }
        }
      } catch (error: any) {
        console.log('Error fetching profile/city data:', error);
        toastRef.current.showErrorToast(
          t('error_fetching_profile_city_data') ||
            'Error fetching profile/city data',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfileAndCity();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = t('invalid_first_name') || 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = t('invalid_last_name') || 'Last name is required';
    }
    if (!formData.location) {
      errors.location = t('location_required') || 'Location is required';
    }
    if (!formData.address.trim()) {
      errors.address = t('address_required') || 'Address is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string,
    latitude?: string,
    longitude?: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new FormData();
      params.append('first_name', formData.firstName);
      params.append('last_name', formData.lastName);
      params.append('address.city', formData.location);
      params.append('address.address_line1', formData.address);
      params.append('dob', formData.dob);

      if (formData.latitude) {
        params.append('address.latitude', formData.latitude);
      }
      if (formData.longitude) {
        params.append('address.longitude', formData.longitude);
      }

      if (
        profileImage &&
        profileImage.uri &&
        !profileImage.uri.startsWith('http')
      ) {
        params.append('profile_img', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type,
        });
      }
      const response: any = await putEditProfile(params as any);
      if (response) {
        showSuccessToast(
          t('profile_updated_successfully') || 'Profile updated successfully',
        );
        navigation.goBack();
      } else {
        showErrorToast(t('profile_update_failed') || 'Profile update failed');
      }
    } catch (error: any) {
      console.log(
        'error in update profile :: ',
        error?.response?.data || error,
      );
      showErrorToast(t('profile_update_failed') || 'Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    Keyboard.dismiss();
    Alert.alert(
      t('select_profile_picture') || 'Profile Picture',
      t('choose_an_option') || 'Choose an option',
      [
        {
          text: t('take_photo') || 'Take Photo',
          onPress: () => openCamera(),
        },
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
      const image = await ImagePicker.openCamera({
        width: 300,
        height: 300,
        compressImageQuality: 0.7,
        modalPresentationStyle: 'fullScreen',
        mediaType: 'photo',
        cropperStatusBarLight: true,
      });
      await processImage(image);
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('Error accessing camera:', error);
        showErrorToast(t('camera_access_failed') || 'Camera access failed');
      }
    }
  };

  const openGallery = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        compressImageQuality: 0.7,
        modalPresentationStyle: 'fullScreen',
        mediaType: 'photo',
        cropperStatusBarLight: true,
      });
      await processImage(image);
    } catch (error: any) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('Error accessing gallery:', error);
        showErrorToast(t('gallery_access_failed') || 'Gallery access failed');
      }
    }
  };

  const processImage = async (image: any) => {
    try {
      const uri =
        Platform.OS === 'ios'
          ? image.path.replace('file://', '')
          : image.path.startsWith('file://')
          ? image.path
          : `file://${image.path}`;

      const imageData = {
        uri: uri,
        type: image.mime,
        name: `profile_${Date.now()}.${image.mime.split('/')[1]}`,
      };
      setProfileImage(imageData);
    } catch (error) {
      console.log('Error processing image:', error);
      showErrorToast('Image processing failed');
    }
  };

  const containerDynamicStyle = { paddingTop: inset.top };
  const bottomBarDynamicStyle = {
    paddingBottom: Math.max(inset.bottom, verticalScale(14)),
  };

  return (
    <View style={[styles.container, containerDynamicStyle]}>
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
        title={t('edit_profile') || 'Edit Profile'}
        showBackButton={true}
      />

      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleImagePicker}
                style={styles.avatarTouchArea}
              >
                <View style={styles.avatarBorderRing}>
                  <Image
                    source={{
                      uri: profileImage?.uri || DEFAULT_AVATAR,
                    }}
                    style={styles.profileImage}
                  />
                  <View style={styles.cameraBadge}>
                    <Icon name="camera" size={15} color={COLORS.white} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleImagePicker}
                style={styles.changePhotoPill}
              >
                <Icon
                  name="camera-outline"
                  size={14}
                  color={COLORS.primary}
                  style={styles.changePhotoIcon}
                />
                <Text style={styles.changePhotoText}>
                  {t('change_photo') || 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section 1: Personal Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Icon
                    name="person-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {t('personal_info') || 'Personal Information'}
                </Text>
              </View>

              {/* First Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('first_name') || 'First Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    formErrors.firstName ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="person-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder={t('enter_first_name') || 'Enter first name'}
                    placeholderTextColor={COLORS.textSecondary}
                    value={formData.firstName}
                    onChangeText={text =>
                      handleInputChange(
                        'firstName',
                        text,
                        formData.latitude,
                        formData.longitude,
                      )
                    }
                    autoComplete="name"
                    textContentType="givenName"
                    maxLength={30}
                  />
                </View>
                {formErrors.firstName ? (
                  <Text style={styles.errorText}>{formErrors.firstName}</Text>
                ) : null}
              </View>

              {/* Last Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('last_name') || 'Last Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    formErrors.lastName ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="person-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder={t('enter_last_name') || 'Enter last name'}
                    placeholderTextColor={COLORS.textSecondary}
                    value={formData.lastName}
                    onChangeText={text =>
                      handleInputChange(
                        'lastName',
                        text,
                        formData.latitude,
                        formData.longitude,
                      )
                    }
                    autoComplete="name"
                    textContentType="familyName"
                    maxLength={30}
                  />
                </View>
                {formErrors.lastName ? (
                  <Text style={styles.errorText}>{formErrors.lastName}</Text>
                ) : null}
              </View>

              {/* Date of Birth */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('date_of_birth') || 'Date of Birth'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openDatePicker}
                  style={styles.inputWrapper}
                >
                  <Icon
                    name="calendar-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.inputLeftIcon}
                  />
                  <Text
                    style={[
                      styles.datePickerValueText,
                      !formData.dob ? styles.datePickerPlaceholderText : null,
                    ]}
                  >
                    {formData.dob
                      ? moment(formData.dob).format('DD MMM YYYY')
                      : t('select_date_of_birth') || 'Select Date of Birth'}
                  </Text>
                  <Icon
                    name="calendar"
                    size={17}
                    color={COLORS.primary}
                    style={styles.datePickerActionIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Contact Information */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Icon
                    name="shield-checkmark-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {t('contact_details') || 'Contact Details'}
                </Text>
              </View>

              {/* Phone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('phone') || 'Phone Number'}
                </Text>
                <View
                  style={[styles.inputWrapper, styles.disabledInputWrapper]}
                >
                  <Icon
                    name="call-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.inputField, styles.disabledInputField]}
                    value={formData.phone}
                    editable={false}
                    placeholder={t('enter_your_phone') || 'Phone'}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <View style={styles.verifiedBadge}>
                    <Icon
                      name="checkmark-circle"
                      size={12}
                      color="#059669"
                      style={styles.verifiedBadgeIcon}
                    />
                    <Text style={styles.verifiedBadgeText}>
                      {t('verified') || 'Verified'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('email') || 'Email Address'}
                </Text>
                <View
                  style={[styles.inputWrapper, styles.disabledInputWrapper]}
                >
                  <Icon
                    name="mail-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.inputField, styles.disabledInputField]}
                    value={formData.email}
                    editable={false}
                    placeholder={t('enter_your_email') || 'Email'}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Icon
                    name="lock-closed"
                    size={14}
                    color="#94A3B8"
                    style={styles.lockIcon}
                  />
                </View>
              </View>

              {/* Security Hint */}
              <View style={styles.securityHintRow}>
                <Icon
                  name="information-circle-outline"
                  size={14}
                  color="#94A3B8"
                  style={styles.hintIcon}
                />
                <Text style={styles.securityHintText}>
                  {t('account_locked_note') ||
                    'Contact details are linked to your account and cannot be modified.'}
                </Text>
              </View>
            </View>

            {/* Section 3: Location & Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Icon
                    name="location-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {t('location_and_address') || 'Location & Address'}
                </Text>
              </View>

              {/* City Dropdown */}
              <View style={styles.dropdownFieldGroup}>
                <CustomDropdown
                  label={t('location') || 'City / Location'}
                  items={city}
                  selectedValue={formData.location}
                  onSelect={value =>
                    handleInputChange(
                      'location',
                      String(value),
                      formData.latitude,
                      formData.longitude,
                    )
                  }
                  placeholder={
                    t('enter_your_location') || 'Select your location'
                  }
                  error={formErrors.location}
                  key={
                    city.length > 0 ? 'city-dropdown' : 'city-dropdown-empty'
                  }
                  required={true}
                />
              </View>

              {/* Address Line */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('address') || 'Full Address'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[
                    styles.addressInputWrapper,
                    formErrors.address ? styles.inputWrapperError : null,
                  ]}
                >
                  <Icon
                    name="home-outline"
                    size={16}
                    color={COLORS.inputLabelText}
                    style={styles.addressLeftIcon}
                  />
                  <TextInput
                    style={styles.addressInputField}
                    placeholder={
                      t('enter_address') ||
                      'House/Flat no., Street, Area, Landmark'
                    }
                    placeholderTextColor={COLORS.textSecondary}
                    value={formData.address}
                    onChangeText={text =>
                      handleInputChange(
                        'address',
                        text,
                        formData.latitude,
                        formData.longitude,
                      )
                    }
                    multiline={true}
                    numberOfLines={3}
                    autoComplete="street-address"
                    textContentType="fullStreetAddress"
                    maxLength={150}
                  />
                </View>
                {formErrors.address ? (
                  <Text style={styles.errorText}>{formErrors.address}</Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Fixed Action Bar */}
          <View style={[styles.bottomActionBar, bottomBarDynamicStyle]}>
            <PrimaryButton
              title={isEditing ? t('save_changes') : t('save')}
              onPress={handleSaveProfile}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
              disabled={isLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Date Picker Modal for iOS / Native for Android */}
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
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancelText}>
                    {t('cancel') || 'Cancel'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.modalTitleText}>
                  {t('date_of_birth') || 'Date of Birth'}
                </Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text style={styles.modalDoneText}>
                    {t('done') || 'Done'}
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={getDatePickerDate()}
                mode="date"
                is24Hour={true}
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
                themeVariant="light"
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={getDatePickerDate()}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )
      )}
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
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(28),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(18),
  },
  avatarTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorderRing: {
    width: moderateScale(104),
    height: moderateScale(104),
    borderRadius: moderateScale(52),
    borderWidth: 4,
    borderColor: COLORS.white,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: COLORS.white,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(48),
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  changePhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#FFE0E3',
  },
  changePhotoIcon: {
    marginRight: scale(5),
  },
  changePhotoText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(12),
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(14),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  sectionHeaderTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: '#1E293B',
  },
  fieldGroup: {
    marginBottom: verticalScale(12),
  },
  dropdownFieldGroup: {
    marginBottom: verticalScale(4),
  },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.inputLabelText,
    marginBottom: verticalScale(6),
  },
  redAsterisk: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    height: moderateScale(48),
    paddingHorizontal: scale(12),
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF8F8',
  },
  disabledInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  inputLeftIcon: {
    marginRight: scale(10),
  },
  inputField: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#1E293B',
    paddingVertical: 0,
  },
  disabledInputField: {
    color: '#64748B',
    fontFamily: Fonts.Sen_Medium,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeIcon: {
    marginRight: scale(3),
  },
  verifiedBadgeText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#059669',
  },
  lockIcon: {
    marginLeft: scale(6),
  },
  securityHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
    paddingHorizontal: scale(2),
  },
  hintIcon: {
    marginRight: scale(5),
  },
  securityHintText: {
    flex: 1,
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
    lineHeight: moderateScale(15),
  },
  datePickerValueText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#1E293B',
  },
  datePickerPlaceholderText: {
    color: COLORS.textSecondary,
  },
  datePickerActionIcon: {
    marginLeft: scale(8),
  },
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    minHeight: moderateScale(80),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  addressLeftIcon: {
    marginRight: scale(10),
    marginTop: verticalScale(3),
  },
  addressInputField: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#1E293B',
    padding: 0,
    textAlignVertical: 'top',
    minHeight: moderateScale(60),
  },
  errorText: {
    color: COLORS.error,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    marginTop: verticalScale(4),
    marginLeft: scale(2),
  },
  bottomActionBar: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    marginTop: 0,
    height: moderateScale(48),
    borderRadius: moderateScale(12),
  },
  saveButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingBottom: verticalScale(24),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  modalCancelText: {
    fontSize: moderateScale(15),
    color: '#64748B',
    fontFamily: Fonts.Sen_Medium,
  },
  modalDoneText: {
    fontSize: moderateScale(15),
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  iosDatePicker: {
    height: 200,
  },
});

export default UserEditProfileScreen;
