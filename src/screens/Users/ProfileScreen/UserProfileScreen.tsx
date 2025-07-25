import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import Fonts from '../../../theme/fonts';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import CustomTextInput from '../../../components/CustomTextInput';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {AuthStackParamList} from '../../../navigation/AuthNavigator';
import {getCity, postSignUp} from '../../../api/apiService';
import CustomDropdown from '../../../components/CustomDropdown';
import CustomeLoader from '../../../components/CustomeLoader';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import ThemedInput from '../../../components/ThemedInput';
import {moderateScale} from 'react-native-size-matters';

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
  location?: string;
}

const UserProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<CompleteProfileScreenRouteProp>();
  const route = useRoute<CompleteProfileScreenRouteProps>();
  const {phoneNumber, firstName, lastName, address, uid, latitude, longitude} =
    route?.params;
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(phoneNumber);
  const [location, setLocation] = useState('');
  const [city, setCity] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [profileImage, setProfileImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  console.log(firstName, lastName, address, uid, latitude, longitude);

  useEffect(() => {
    const getCityData = async () => {
      setIsLoading(true);
      try {
        const response = await getCity();
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
      } finally {
        setIsLoading(false);
      }
    };
    getCityData();
  }, []);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userName) {
      errors.userName = t('invalid_user_name');
    }

    if (!email || !emailRegex.test(email)) {
      errors.email = t('invalid_email');
    }

    if (!phone) {
      errors.phone = t('invalid_phone');
    }

    if (!location) {
      errors.location = t('location_required');
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
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new FormData();
      params.append('mobile', phoneNumber);
      params.append('firebase_uid', uid);
      params.append('first_name', firstName);
      params.append('last_name', lastName);
      params.append('address', address);
      params.append('role', 1);
      params.append('email', email);
      params.append('city', location);
      params.append('latitude', latitude?.toString() || '0');
      params.append('longitude', longitude?.toString() || '0');

      if (profileImage) {
        params.append('profile_img', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type,
        });
      }

      const response = await postSignUp(params as any);
      if (response) {
        await AsyncStorage.setItem(
          AppConstant.ACCESS_TOKEN,
          response.access_token,
        );
        await AsyncStorage.setItem(
          AppConstant.REFRESH_TOKEN,
          response.refresh_token,
        );
        await AsyncStorage.setItem(
          AppConstant.CURRENT_USER,
          JSON.stringify(response.user),
        );
        await AsyncStorage.setItem(
          AppConstant.LOCATION,
          JSON.stringify(response.location),
        );
        const userID = response.user?.id;
        await AsyncStorage.setItem(AppConstant.USER_ID, String(userID));
        navigation.navigate('UserAppBottomTabNavigator');
      }
    } catch (error: any) {
      console.log('error in sign up :: ', error?.response?.data || error);
      Alert.alert(t('error'), t('signup_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    Keyboard.dismiss();
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
        Alert.alert(t('error'), t('camera_access_failed'));
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
        Alert.alert(t('error'), t('gallery_access_failed'));
      }
    }
  };

  const processImage = async (image: any) => {
    try {
      const imageData = {
        uri:
          Platform.OS === 'ios'
            ? image.path.replace('file://', '')
            : image.path,
        type: image.mime,
        name: `profile_${Date.now()}.${image.mime.split('/')[1]}`,
      };
      setProfileImage(imageData);
    } catch (error) {
      console.log('Error processing image:', error);
      Alert.alert(t('error'), t('image_processing_failed'));
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
              label={t('user_name')}
              placeholder={t('enter_your_name')}
              value={userName}
              onChangeText={text => {
                setUserName(text);
                setFormErrors(prev => ({...prev, userName: undefined}));
              }}
              labelStyle={themedInputLabelStyle}
              error={formErrors.userName}
            />
            <ThemedInput
              label={t('email')}
              placeholder={t('enter_your_email')}
              value={email}
              onChangeText={text => {
                setEmail(text);
                setFormErrors(prev => ({...prev, email: undefined}));
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              labelStyle={themedInputLabelStyle}
              error={formErrors.email}
            />
            <ThemedInput
              label={t('phone')}
              placeholder={t('enter_your_phone')}
              value={phone}
              onChangeText={text => {
                setPhone(text);
                setFormErrors(prev => ({...prev, phone: undefined}));
              }}
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={15}
              labelStyle={themedInputLabelStyle}
              error={formErrors.phone}
            />
            <CustomDropdown
              label={t('location')}
              items={city}
              selectedValue={location}
              onSelect={value => {
                setLocation(value);
                setFormErrors(prev => ({...prev, location: undefined}));
              }}
              placeholder={t('enter_your_location')}
              error={formErrors.location}
            />
            <PrimaryButton
              title={t('save_changes')}
              onPress={handleSignUp}
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

export default UserProfileScreen;
