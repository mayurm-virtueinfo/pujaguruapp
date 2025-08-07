import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {COLORS} from '../../../theme/theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CustomTextInput from '../../../components/CustomTextInput';
import PrimaryButton from '../../../components/PrimaryButton';
import {useTranslation} from 'react-i18next';
import {
  getCity,
  postAddAddress,
  updateAddress,
  getAddressType,
  getState, // <-- Import getState
} from '../../../api/apiService';
import {useCommonToast} from '../../../common/CommonToast';
import {requestLocationPermission} from '../../../utils/locationUtils';
import Geolocation from '@react-native-community/geolocation';
import CustomDropdown from '../../../components/CustomDropdown';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Address} from '../AddressesScreen/AddressesScreen';
import CustomeLoader from '../../../components/CustomeLoader';

const AddAddressScreen = () => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {showErrorToast, showSuccessToast} = useCommonToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    addressType: '',
  });
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    addressType: '',
  });
  console.log('formData', formData);
  const navigation = useNavigation();
  const [location, setLocation] = useState({latitude: 0, longitude: 0});
  const [isLoading, setIsLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState<
    {label: string; value: string; id?: number}[]
  >([]);
  const [stateOptions, setStateOptions] = useState<
    {label: string; value: string; id?: number}[]
  >([]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<
    {label: string; value: string; id: number}[]
  >([]);
  const didSetEditData = useRef(false);

  const route = useRoute<any>();
  const addressToEdit: Address | undefined = route.params?.addressToEdit;

  console.log('addressToEdit :: ', addressToEdit);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePincode = (pincode: string) => {
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(pincode);
  };

  const validateForm = () => {
    const errors: any = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = t('full_name_required');
      isValid = false;
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = t('phone_number_required');
      isValid = false;
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = t('invalid_phone_number');
      isValid = false;
    }
    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = t('address_line1_required');
      isValid = false;
    }
    if (!formData.addressLine2.trim()) {
      errors.addressLine2 = t('address_line2_required');
      isValid = false;
    }
    if (!formData.city) {
      errors.city = t('city_required');
      isValid = false;
    }
    if (!formData.state) {
      errors.state = t('state_required');
      isValid = false;
    }
    if (!formData.pincode.trim()) {
      errors.pincode = t('pincode_required');
      isValid = false;
    } else if (!validatePincode(formData.pincode)) {
      errors.pincode = t('invalid_pincode');
      isValid = false;
    }
    if (!formData.addressType) {
      errors.addressType = t('address_type_required');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCitiesTypesStates = async () => {
      try {
        const [cities, states, types]: any = await Promise.all([
          getCity(),
          getState(),
          getAddressType(),
        ]);

        // Cities
        let cityList: any[] = Array.isArray(cities)
          ? cities
          : cities?.data || [];
        let cityOptions = cityList.map((city: any) => ({
          label: city.name,
          value: String(city.id),
          id: city.id,
        }));
        if (isMounted) setCityOptions(cityOptions);

        // States
        let stateList: any[] = Array.isArray(states)
          ? states
          : states?.data || [];
        let stateOptions = stateList.map((state: any) => ({
          label: state.name,
          value: String(state.id),
          id: state.id,
        }));
        if (isMounted) setStateOptions(stateOptions);

        // Address Types
        let typeList: any[] = Array.isArray(types) ? types : types?.data || [];
        let typeOptions = typeList.map((type: any) => ({
          label: type.name,
          value: String(type.id),
          id: type.id,
        }));
        if (isMounted) setAddressTypeOptions(typeOptions);

        if (
          addressToEdit &&
          !didSetEditData.current &&
          cityOptions.length > 0 &&
          stateOptions.length > 0 &&
          typeOptions.length > 0
        ) {
          let matchedCityId = '';
          if (addressToEdit.city) {
            let cityValue = addressToEdit.city;
            if (typeof cityValue === 'object' && cityValue !== null) {
              cityValue = (cityValue as any).id ?? (cityValue as any).name;
            }
            const foundCity =
              cityOptions.find(
                opt =>
                  String(opt.id) === String(cityValue) ||
                  opt.label.toLowerCase() === String(cityValue).toLowerCase(),
              ) || null;
            matchedCityId = foundCity ? String(foundCity.value) : '';
          }

          let matchedStateId = '';
          if (addressToEdit.state) {
            let stateValue = addressToEdit.state;
            if (typeof stateValue === 'object' && stateValue !== null) {
              stateValue = (stateValue as any).id ?? (stateValue as any).name;
            }
            const foundState =
              stateOptions.find(
                opt =>
                  String(opt.id) === String(stateValue) ||
                  opt.label.toLowerCase() === String(stateValue).toLowerCase(),
              ) || null;
            matchedStateId = foundState ? String(foundState.value) : '';
          }

          let matchedTypeId = '';
          if (addressToEdit.address_type) {
            let typeValue = addressToEdit.address_type;
            if (typeof typeValue === 'object' && typeValue !== null) {
              typeValue = (typeValue as any).id ?? (typeValue as any).name;
            }
            const foundType =
              typeOptions.find(
                opt =>
                  String(opt.id) === String(typeValue) ||
                  opt.label.toLowerCase() === String(typeValue).toLowerCase(),
              ) || null;
            matchedTypeId = foundType ? String(foundType.value) : '';
          }

          setFormData({
            fullName: addressToEdit.name || '',
            phoneNumber: addressToEdit.phone_number || '',
            addressLine1: addressToEdit.address_line1 || '',
            addressLine2: addressToEdit.address_line2 || '',
            city: matchedCityId,
            state: matchedStateId,
            pincode: addressToEdit.pincode || '',
            addressType: matchedTypeId,
          });
          setLocation({
            latitude: addressToEdit.latitude || 0,
            longitude: addressToEdit.longitude || 0,
          });
          didSetEditData.current = true;
        }
      } catch (error) {
        showErrorToast('Failed to fetch cities, states, or address types');
        setCityOptions([]);
        setStateOptions([]);
        setAddressTypeOptions([]);
      }
    };

    fetchCitiesTypesStates();

    return () => {
      isMounted = false;
    };
  }, [addressToEdit]);

  useEffect(() => {
    didSetEditData.current = false;
  }, [addressToEdit]);

  const handleFetchGPS = async () => {
    setIsLoading(true);
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setLocation({latitude, longitude});
          setIsLoading(false);
        },
        () => setIsLoading(false),
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } else {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      showErrorToast(t('please_fill_all_required_fields'));
      return;
    }

    let cityId = Number(formData.city) || 0;
    let stateId = Number(formData.state) || 0;
    let addressTypeId = Number(formData.addressType) || 0;

    const addressPayload = {
      name: formData.fullName,
      address_type: addressTypeId,
      address_line1: formData.addressLine1,
      address_line2: formData.addressLine2,
      phone_number: formData.phoneNumber,
      city: cityId,
      state: stateId,
      pincode: formData.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
    };
    try {
      if (addressToEdit) {
        const response: any = await updateAddress({
          id: addressToEdit.id,
          ...addressPayload,
        });
        console.log('response for update address :: ', response.data);
        if (response?.data?.success) {
          showSuccessToast(t('address_updated_successfully'));
          setFormData({
            fullName: '',
            phoneNumber: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            addressType: '',
          });
          setLocation({latitude: 0, longitude: 0});
          handleBack();
        }
      } else {
        console.log('======= Add Address Api called =======');
        const response: any = await postAddAddress(addressPayload);
        console.log('response for add address :: ', response);
        if (response.data.success) {
          showSuccessToast(t('address_added_successfully'));
          setFormData({
            fullName: '',
            phoneNumber: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            addressType: '',
          });
          setLocation({latitude: 0, longitude: 0});
          handleBack();
        }
      }
    } catch (error: any) {
      showErrorToast(t('failed_to_save_address'));
      console.log('error :: ', error?.response?.data?.message);
    }
  };

  const handleBack = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <CustomeLoader loading={isLoading} />
      <UserCustomHeader
        title={addressToEdit ? t('edit_address') : t('add_address')}
        showBackButton={true}
        onBackPress={handleBack}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('full_name') + ' *'}
              value={formData.fullName}
              onChangeText={value => handleInputChange('fullName', value)}
              placeholder={t('enter_full_name')}
              error={formErrors.fullName}
            />
          </View>
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('phone_number') + ' *'}
              value={formData.phoneNumber}
              onChangeText={value => handleInputChange('phoneNumber', value)}
              placeholder={t('enter_phone_number')}
              keyboardType="phone-pad"
              error={formErrors.phoneNumber}
            />
          </View>
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('address_line1') + ' *'}
              value={formData.addressLine1}
              onChangeText={value => handleInputChange('addressLine1', value)}
              placeholder={t('enter_address_line1')}
              error={formErrors.addressLine1}
            />
          </View>
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('address_line2') + ' *'}
              value={formData.addressLine2}
              onChangeText={value => handleInputChange('addressLine2', value)}
              placeholder={t('enter_address_line2')}
              error={formErrors.addressLine2}
            />
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <CustomDropdown
                items={stateOptions}
                selectedValue={formData.state}
                onSelect={value => handleInputChange('state', value)}
                label={t('state') + ' *'}
                placeholder={t('enter_state')}
                error={formErrors.state}
              />
            </View>
            <View style={styles.halfInputGroup}>
              <CustomDropdown
                items={cityOptions}
                selectedValue={formData.city}
                onSelect={value => handleInputChange('city', value)}
                label={t('city') + ' *'}
                placeholder={t('enter_city')}
                error={formErrors.city}
              />
            </View>
          </View>
          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <CustomTextInput
                label={t('pincode') + ' *'}
                value={formData.pincode}
                onChangeText={value => handleInputChange('pincode', value)}
                placeholder={t('enter_pincode')}
                keyboardType="phone-pad"
                error={formErrors.pincode}
              />
            </View>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleFetchGPS}
              disabled={isLoading}>
              <Icon
                name="my-location"
                size={18}
                color={COLORS.primaryTextDark}
              />
              <Text style={styles.locationButtonText}>
                {isLoading ? t('fetching_location') : t('my_location')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressTypeGroup}>
            <CustomDropdown
              items={addressTypeOptions.map(opt => ({
                ...opt,
                label: t(opt.label.toLowerCase()),
                value: String(opt.id),
              }))}
              selectedValue={formData.addressType}
              onSelect={value => handleInputChange('addressType', value)}
              label={t('type_of_address')}
              placeholder={t('select_type_of_address')}
              error={formErrors.addressType}
            />
          </View>
          <PrimaryButton
            title={addressToEdit ? t('update_address') : t('save_address')}
            onPress={handleSaveAddress}
            style={{marginTop: 0}}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  halfInputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  locationButton: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    marginTop: 23,
  },
  locationButtonText: {
    color: COLORS.primaryTextDark,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Sen-Medium',
    letterSpacing: -0.14,
  },
  addressTypeGroup: {
    marginBottom: 16,
  },
});

export default AddAddressScreen;
