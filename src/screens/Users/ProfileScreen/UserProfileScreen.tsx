import React, { useEffect, useState } from 'react';
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
  Text,
} from 'react-native';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../../navigation/AuthNavigator';
import {
  getCity,
  getState,
  postRegisterFCMToken,
} from '../../../api/apiService';
import ApiEndpoints, { APP_URL, POST_SIGNUP } from '../../../api/apiEndpoints';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomeLoader from '../../../components/CustomeLoader';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import ThemedInput from '../../../components/ThemedInput';
import { moderateScale } from 'react-native-size-matters';
import { useCommonToast } from '../../../common/CommonToast';
import { getFcmToken } from '../../../configuration/firebaseMessaging';
import { getCurrentLocation } from '../../../utils/locationUtils';

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

// Helper to format date as DD/MM/YYYY for Indian display
const formatDateIndian = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const UserProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<CompleteProfileScreenRouteProp>();
  const route = useRoute<CompleteProfileScreenRouteProps>();
  const { phoneNumber, firstName, lastName, address, uid } = route?.params;
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
  const [state, setState] = useState([]);
  const [city, setCity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const { showErrorToast } = useCommonToast();

  console.log('formData :: ', formData);
  console.log('profileImage :: ', profileImage);

  useEffect(() => {
    handleFetchGPS();
  }, []);

  const handleFetchGPS = async () => {
    setIsLoading(true);
    try {
      const locationData = await getCurrentLocation();
      if (locationData) {
        setFormData(prev => ({
          ...prev,
          latitude: locationData.latitude.toString(),
          longitude: locationData.longitude.toString(),
        }));
      }
    } catch (err) {
      showErrorToast('Location permission required');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const getStateData = async () => {
      setIsLoading(true);
      try {
        const response: any = await getState();
        if (Array.isArray(response?.data)) {
          const stateData: any = response?.data.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setState(stateData);
        } else {
          setState([]);
        }
      } catch (error: any) {
        console.log('error in get state data :: ', error);
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
          const cityData: any = response.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setCity(cityData);
        } else {
          setCity([]);
        }
      } catch (error: any) {
        console.log('error in get city data :: ', error);
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

    if (!formData.first_name) {
      errors.userName = t('invalid_user_name');
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = t('invalid_email');
    }

    // Phone field is required, must be 10 digits, only numbers allowed
    if (!formData.mobile) {
      errors.phone = t('phone_required') || 'Phone number is required';
    } else if (!/^\+?\d+$/.test(formData.mobile)) {
      errors.phone =
        t('invalid_phone_digits') || 'Phone number must contain only numbers';
    } else if (formData.mobile.length !== 13) {
      errors.phone =
        t('invalid_phone_length') || 'Phone number must be exactly 10 digits';
    }

    if (!formData.state) {
      errors.state = t('state_required');
    }

    if (!formData.city) {
      errors.location = t('city_required');
    }

    if (!formData.dob) {
      errors.dob = t('dob_required') || 'Date of Birth is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const themedInputLabelStyle = {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.inputLabelText,
    marginBottom: 4,
  };

  const handleSignUp = async () => {
    console.log('formData :: ', formData);

    if (formData.latitude === '0' || formData.longitude === '0') {
      showErrorToast('Please wait, fetching GPS location...');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new FormData();

      // Append all text fields from formData
      Object.keys(formData).forEach(key => {
        params.append(key, formData[key as keyof typeof formData]);
      });

      if (profileImage) {
        // FIX 1: Ensure proper URI format for Android
        // We now handle this in the picker functions, so we can trust profileImage.uri
        const imageUri = profileImage.uri;

        // FIX 2: Use proper object structure for React Native
        params.append('profile_img', {
          uri: imageUri,
          name: profileImage.name,
          type: profileImage.type,
        } as any);
      }

      console.log('FormData params:', params); // Debug log

      const fullUrl = `${APP_URL}${POST_SIGNUP}`;
      console.log('Full Fetch URL:', fullUrl);

      if (!APP_URL) {
        showErrorToast('Configuration Error: APP_URL is missing');
        setIsLoading(false);
        return;
      }

      // Create a timeout promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 15000); // 15s timeout
      });

      // Race the fetch against the timeout
      const response: any = await Promise.race([
        fetch(`${APP_URL}${POST_SIGNUP}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-Master-Key': ApiEndpoints.XMasterKey,
            // 'Content-Type': 'multipart/form-data', // Do NOT set this manually for fetch + FormData
          },
          body: params,
        }),
        timeout,
      ]);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseJson;
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
      console.log('Error in user profile screen signup :: ', error);
      console.log('error in sign up :: ', error?.response?.data || error);
      showErrorToast('Network Error, Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    Keyboard.dismiss();
    Alert.alert(t('select_profile_picture'), t('choose_an_option'), [
      { text: t('take_photo'), onPress: () => openCamera() },
      { text: t('choose_from_gallery'), onPress: () => openGallery() },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    try {
      const image1 = await ImagePicker.openCamera({
        mediaType: 'photo',
        width: 160,
        height: 160,
        compressImageQuality: 0.5,
        cropping: true,
      });

      const ext = image1.path.substr(image1.path.lastIndexOf('.') + 1);
      const partPhoto = {
        name: (image1.modificationDate || Date.now()) + '.' + ext,
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
        width: 160,
        height: 160,
        compressImageQuality: 0.5,
        cropping: true,
      });

      const ext = image1.path.substr(image1.path.lastIndexOf('.') + 1);
      const partPhoto = {
        name: (image1.modificationDate || Date.now()) + '.' + ext,
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

  // Helper: Only allow numeric input and max 10 numbers in phone field
  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, '');
    if (cleaned.length > 13) {
      cleaned = cleaned.slice(0, 13);
    }
    setFormData(prev => ({ ...prev, mobile: cleaned }));
    setFormErrors(prev => ({ ...prev, phone: undefined }));
  };

  // This handler sets dob in API format (YYYY-MM-DD)
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // API (YYYY-MM-DD)
      setFormData(prev => ({ ...prev, dob: formattedDate }));
      setFormErrors(prev => ({ ...prev, dob: undefined }));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.headerGradient]}
      />
      <UserCustomHeader title={t('profile')} showBackButton={true} />

      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={handleImagePicker}>
          <Image
            source={{
              uri:
                profileImage?.uri ||
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
            }}
            style={styles.profileImage}
          />
          <View style={styles.editIconContainer}>
            <Icon name="camera-outline" size={16} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <ThemedInput
              label={t('user_name')}
              placeholder={t('enter_your_name')}
              value={formData.first_name}
              onChangeText={text => {
                setFormData(prev => ({ ...prev, first_name: text }));
                setFormErrors(prev => ({ ...prev, userName: undefined }));
              }}
              labelStyle={themedInputLabelStyle}
              error={formErrors.userName}
              required
            />
            <ThemedInput
              label={t('email')}
              placeholder={t('enter_your_email')}
              value={formData.email}
              onChangeText={text => {
                setFormData(prev => ({ ...prev, email: text }));
                setFormErrors(prev => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              labelStyle={themedInputLabelStyle}
              error={formErrors.email}
              required
            />
            <TouchableOpacity onPress={() => setShowDatePicker(prev => !prev)}>
              <View pointerEvents="none">
                <ThemedInput
                  label={t('dob') || 'Date of Birth'}
                  placeholder={t('select_dob') || 'Select Date of Birth'}
                  value={formatDateIndian(formData.dob)}
                  onChangeText={() => {}}
                  labelStyle={themedInputLabelStyle}
                  editable={false}
                  error={formErrors.dob}
                  required
                />
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <View>
                {Platform.OS === 'ios' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginBottom: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: COLORS.primary,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: COLORS.white,
                          fontFamily: Fonts.Sen_Bold,
                          fontSize: 14,
                        }}
                      >
                        {t('done') || 'Done'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <DateTimePicker
                  value={formData.dob ? new Date(formData.dob) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  themeVariant="light"
                />
              </View>
            )}
            <ThemedInput
              label={t('phone')}
              placeholder={t('enter_your_phone')}
              value={formData.mobile}
              // Phone input: only allow numbers, max 10, clear error on edit
              onChangeText={handlePhoneChange}
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={15}
              labelStyle={themedInputLabelStyle}
              error={formErrors.phone}
              required
              keyboardType="phone-pad"
              editable={false}
              style={styles.disabledInput}
            />
            <CustomDropdown
              label={t('state')}
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
              placeholder={t('enter_your_State')}
              error={formErrors.state}
              required
            />
            <CustomDropdown
              label={t('city')}
              items={city}
              selectedValue={formData.city}
              onSelect={value => {
                setFormData(prev => ({ ...prev, city: value }));
                setFormErrors(prev => ({ ...prev, location: undefined }));
              }}
              placeholder={
                formData.state
                  ? t('enter_your_location')
                  : t('select_state_first')
              }
              error={formErrors.location}
              required
            />

            <PrimaryButton
              title={t('save')}
              onPress={handleSignUp}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={isLoading || formData.latitude === '0'}
            />
          </View>
        </ScrollView>
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
    height: 184,
    backgroundColor: COLORS.primaryBackground,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 105,
    alignSelf: 'center',
    zIndex: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.black,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  contentContainer: {
    position: 'absolute',
    top: 153,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundPrimary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 1,
  },
  inputContainer: {
    gap: 16,
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  disabledInput: {
    backgroundColor: COLORS.lightGray,
  },
});

export default UserProfileScreen;
