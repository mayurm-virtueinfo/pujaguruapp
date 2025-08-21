import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import Fonts from '../../../theme/fonts';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PrimaryButtonOutlined from '../../../components/PrimaryButtonOutlined';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  getEditProfile,
  getOldCityApi,
  putEditProfile,
} from '../../../api/apiService';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomeLoader from '../../../components/CustomeLoader';
import Icon from 'react-native-vector-icons/Ionicons';
import ThemedInput from '../../../components/ThemedInput';
import {moderateScale} from 'react-native-size-matters';
import {requestLocationPermission} from '../../../utils/locationUtils';
import Geolocation from '@react-native-community/geolocation';
import {useCommonToast} from '../../../common/CommonToast';

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
}

const UserEditProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  console.log('formData', formData);
  const [city, setCity] = useState<{label: string; value: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  console.log(' profileImage :: ', profileImage);

  useEffect(() => {
    let isMounted = true;
    let profileResponse: any = null;
    let cityResponse: any = null;

    const fetchProfileAndCity = async () => {
      setIsLoading(true);
      try {
        const [profile, cities] = await Promise.all([
          getEditProfile(),
          getOldCityApi(),
        ]);
        profileResponse = profile;
        cityResponse = cities;

        let cityData: {label: string; value: string}[] = [];
        if (Array.isArray(cityResponse)) {
          cityData = cityResponse.map((item: any) => ({
            label: item.name,
            value: String(item.id),
          }));
        }

        if (isMounted) {
          setCity(cityData);

          let selectedCityId = '';
          if (
            profileResponse &&
            profileResponse.address &&
            profileResponse.address.city
          ) {
            const foundCity = cityData.find(
              c => String(c.value) === String(profileResponse.address.city),
            );
            if (foundCity) {
              selectedCityId = String(foundCity.value);
            }
          }

          setFormData({
            firstName: profileResponse?.first_name || '',
            lastName: profileResponse?.last_name || '',
            email: profileResponse?.email || '',
            phone: profileResponse?.mobile || '',
            address: profileResponse?.address?.address_line1 || '',
            location: selectedCityId,
            latitude: profileResponse?.address?.latitude
              ? String(profileResponse.address.latitude)
              : '',
            longitude: profileResponse?.address?.longitude
              ? String(profileResponse.address.longitude)
              : '',
          });

          if (profileResponse?.profile_img) {
            setProfileImage({
              uri: profileResponse.profile_img,
              name: `profile_${Date.now()}.jpg`,
              type: 'image/jpeg',
            });
          }
        }
      } catch (error: any) {
        console.log('Error fetching profile/city data:', error);
        showErrorToast(
          t('error_fetching_profile_city_data') ||
            'Error fetching profile/city data',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndCity();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.firstName) {
      errors.firstName = t('invalid_first_name');
    }
    if (!formData.lastName) {
      errors.lastName = t('invalid_last_name');
    }
    if (!formData.location) {
      errors.location = t('location_required');
    }
    if (!formData.address) {
      errors.address = t('address_required');
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

  const handleInputChange = (
    field: keyof FormData,
    value: string,
    latitude?: string,
    longitude?: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(latitude !== undefined ? {latitude} : {}),
      ...(longitude !== undefined ? {longitude} : {}),
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
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
    // eslint-disable-next-line no-alert
    // @ts-ignore
    Alert.alert(t('select_profile_picture'), t('choose_an_option'), [
      {text: t('take_photo'), onPress: () => openCamera()},
      {text: t('choose_from_gallery'), onPress: () => openGallery()},
      {text: t('cancel'), style: 'cancel'},
    ]);
  };

  const openCamera = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.7,
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
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.7,
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

  const handleFetchGPS = async () => {
    setIsLoading(true);
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          handleInputChange(
            'address',
            `${latitude}, ${longitude}`,
            String(latitude),
            String(longitude),
          );
          setIsLoading(false);
        },
        error => {
          console.warn('Error getting location:', error.message);
          showErrorToast(
            t('error_getting_location') || 'Error getting location',
          );
          setIsLoading(false);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } else {
      console.warn('Location permission denied');
      showErrorToast(
        t('location_permission_denied') || 'Location permission denied',
      );
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
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
              uri: profileImage?.uri || 'https://via.placeholder.com/100',
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
              label={t('First name')}
              placeholder={t('enter_first_name')}
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
              labelStyle={themedInputLabelStyle}
              error={formErrors.firstName}
            />
            <ThemedInput
              label={t('Last name')}
              placeholder={t('enter_last_name')}
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
              labelStyle={themedInputLabelStyle}
              error={formErrors.lastName}
            />
            <ThemedInput
              label={t('email')}
              placeholder={t('enter_your_email')}
              value={formData.email}
              onChangeText={() => {}}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              labelStyle={themedInputLabelStyle}
              error={formErrors.email}
              editable={false}
            />
            <ThemedInput
              label={t('phone')}
              placeholder={t('enter_your_phone')}
              value={formData.phone}
              onChangeText={() => {}}
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={15}
              labelStyle={themedInputLabelStyle}
              error={formErrors.phone}
              editable={false}
            />
            <CustomDropdown
              label={t('location')}
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
              placeholder={t('enter_your_location')}
              error={formErrors.location}
              key={city.length > 0 ? 'city-dropdown' : 'city-dropdown-empty'}
            />
            <ThemedInput
              label={t('Address')}
              placeholder={t('enter_address')}
              value={formData.address}
              onChangeText={text =>
                handleInputChange(
                  'address',
                  text,
                  formData.latitude,
                  formData.longitude,
                )
              }
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              maxLength={100}
              labelStyle={themedInputLabelStyle}
              error={formErrors.address}
            />
            <PrimaryButtonOutlined
              title={t('fetch_gps_location')}
              onPress={handleFetchGPS}
              disabled={isLoading}
            />
            <PrimaryButton
              title={t('save_changes')}
              onPress={handleSaveProfile}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
});

export default UserEditProfileScreen;
