import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fonts from '../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { COLORS } from '../../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../../components/CustomTextInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { useTranslation } from 'react-i18next';
import {
  getCity,
  postAddAddress,
  updateAddress,
  getAddressType,
  getState,
} from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import CustomDropdown from '../../../components/CustomDropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Address } from '../AddressesScreen/AddressesScreen';
import CustomeLoader from '../../../components/CustomeLoader';

const AddAddressScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showErrorToast, showSuccessToast } = useCommonToast();
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
  const navigation = useNavigation();
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityOptions, setCityOptions] = useState<
    { label: string; value: string; id?: number }[]
  >([]);
  const [stateOptions, setStateOptions] = useState<
    { label: string; value: string; id?: number }[]
  >([]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<
    { label: string; value: string; id: number }[]
  >([]);
  const [cityCoordinates, setCityCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const didSetEditData = useRef(false);
  const route = useRoute<any>();
  const addressToEdit: Address | undefined = route.params?.addressToEdit;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  console.log('cityCoordinates :: ', cityCoordinates);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    setFormErrors(prev => ({
      ...prev,
      [field]: '',
    }));

    if (field === 'state') {
      setFormData(prev => ({ ...prev, city: '' }));
      setCityOptions([]);
      setCityName('');
    }

    if (field === 'city') {
      const found = cityOptions.find(
        opt => String(opt.value) === String(value),
      );
      setCityName(found?.label || '');
    }
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
    // addressLine2 is optional
    if (!formData.state) {
      errors.state = t('state_required');
      isValid = false;
    }
    if (!formData.city) {
      errors.city = t('city_required');
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
    const findCityCoordinates = async () => {
      if (cityName) {
        const coordinates: any = await getCityCoordinates(cityName);
        console.log('coordinates :: ', coordinates);
        setCityCoordinates(
          coordinates?.found
            ? {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              }
            : null,
        );
      }
    };
    findCityCoordinates();
  }, [cityName]);

  const getCityCoordinates = async (cityName: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName,
      )}&limit=1`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PujaGuruApp/1.0',
        },
      });

      const contentType = response.headers.get('content-type') || '';
      const rawBody = await response.text();

      if (!response.ok) {
        console.error(
          'Geocoding HTTP error:',
          response.status,
          rawBody?.slice(0, 200),
        );
        return { found: false, error: `HTTP ${response.status}` };
      }

      let data: any = null;
      try {
        data = contentType.includes('application/json')
          ? JSON.parse(rawBody)
          : JSON.parse(rawBody);
      } catch (e: any) {
        console.error(
          'Geocoding parse error:',
          e?.message,
          rawBody?.slice(0, 200),
        );
        return { found: false, error: 'Invalid JSON from geocoder' };
      }
      console.log('data for city coordinates :: ', data);

      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0]?.lat &&
        data[0]?.lon
      ) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          found: true,
        };
      } else {
        return { found: false };
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      return { found: false, error: error.message };
    }
  };

  const fetchCities = async (stateId: string) => {
    if (!stateId) return;

    setIsLoading(true);
    try {
      const response: any = await getCity(String(stateId));
      let cityList: any[] = Array.isArray(response)
        ? response
        : response?.data || [];
      const cityOptions = cityList.map((city: any) => ({
        label: city.name,
        value: String(city.id),
        id: city.id,
      }));
      setCityOptions(cityOptions);

      // For edit mode, set the city after fetching cities
      if (addressToEdit && !didSetEditData.current && addressToEdit.city) {
        let cityValue = addressToEdit.city;
        if (typeof cityValue === 'object' && cityValue !== null) {
          cityValue = (cityValue as any).id ?? (cityValue as any).name;
        }
        const foundCity = cityOptions.find(
          opt =>
            String(opt.id) === String(cityValue) ||
            opt.label.toLowerCase() === String(cityValue).toLowerCase(),
        );
        if (foundCity) {
          setFormData(prev => ({
            ...prev,
            city: foundCity.value,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching city data:', error);
      showErrorToast(t('failed_to_fetch_cities'));
      setCityOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStatesAndTypes = async () => {
      try {
        const [states, types]: any = await Promise.all([
          getState(),
          getAddressType(),
        ]);

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

        // Handle edit case
        if (addressToEdit && !didSetEditData.current) {
          let matchedStateId = '';
          if (addressToEdit.state) {
            let stateValue = addressToEdit.state;
            if (typeof stateValue === 'object' && stateValue !== null) {
              stateValue = (stateValue as any).id ?? (stateValue as any).name;
            }
            const foundState = stateOptions.find(
              opt =>
                String(opt.id) === String(stateValue) ||
                opt.label.toLowerCase() === String(stateValue).toLowerCase(),
            );
            matchedStateId = foundState ? String(foundState.value) : '';
          }

          let matchedTypeId = '';
          if (addressToEdit.address_type) {
            let typeValue = addressToEdit.address_type;
            if (typeof typeValue === 'object' && typeValue !== null) {
              typeValue = (typeValue as any).id ?? (typeValue as any).name;
            }
            const foundType = typeOptions.find(
              opt =>
                String(opt.id) === String(typeValue) ||
                opt.label.toLowerCase() === String(typeValue).toLowerCase(),
            );
            matchedTypeId = foundType ? String(foundType.value) : '';
          }

          setFormData({
            fullName: addressToEdit.name || '',
            phoneNumber: addressToEdit.phone_number || '',
            addressLine1: addressToEdit.address_line1 || '',
            addressLine2: addressToEdit.address_line2 || '',
            city: '',
            state: matchedStateId,
            pincode: addressToEdit.pincode || '',
            addressType: matchedTypeId,
          });
          setLocation({
            latitude: addressToEdit.latitude || 0,
            longitude: addressToEdit.longitude || 0,
          });

          if (matchedStateId) {
            await fetchCities(matchedStateId);
          }
          didSetEditData.current = true;
        }
      } catch (error) {
        showErrorToast(t('failed_to_fetch_data'));
        setStateOptions([]);
        setAddressTypeOptions([]);
      }
    };

    fetchStatesAndTypes();

    return () => {
      isMounted = false;
    };
  }, [addressToEdit]);

  useEffect(() => {
    if (formData.state && !addressToEdit) {
      fetchCities(formData.state);
    }
  }, [formData.state]);

  useEffect(() => {
    didSetEditData.current = false;
  }, [addressToEdit]);

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      showErrorToast(t('please_fill_all_required_fields'));
      return;
    }

    let cityId = Number(formData.city) || 0;
    let addressTypeId = Number(formData.addressType) || 0;

    const addressPayload = {
      name: formData.fullName,
      address_type: addressTypeId,
      address_line1: formData.addressLine1,
      address_line2: formData.addressLine2,
      phone_number: formData.phoneNumber,
      city: cityId,
      state: String(formData.state),
      pincode: formData.pincode,
      latitude: cityCoordinates?.latitude ?? 0,
      longitude: cityCoordinates?.longitude ?? 0,
    };

    try {
      if (addressToEdit) {
        const response: any = await updateAddress({
          id: addressToEdit.id,
          ...addressPayload,
        });
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
          setLocation({ latitude: 0, longitude: 0 });
          setCityName('');
          handleBack();
        }
      } else {
        const response: any = await postAddAddress(addressPayload);
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
          setLocation({ latitude: 0, longitude: 0 });
          setCityName('');
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={isLoading} />
      <UserCustomHeader
        title={addressToEdit ? t('edit_address') : t('add_address')}
        showBackButton={true}
        onBackPress={handleBack}
      />
      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section 1: Contact Details Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {t('contact_details') || 'Contact Details'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  label={t('full_name')}
                  value={formData.fullName}
                  onChangeText={value => handleInputChange('fullName', value)}
                  placeholder={t('enter_full_name')}
                  error={formErrors.fullName}
                  required={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  label={t('phone_number')}
                  value={formData.phoneNumber}
                  onChangeText={value =>
                    handleInputChange('phoneNumber', value)
                  }
                  placeholder={t('enter_phone_number')}
                  keyboardType="phone-pad"
                  error={formErrors.phoneNumber}
                  onlyInteger={true}
                  maxIntegerLength={10}
                  required={true}
                />
              </View>
            </View>

            {/* Section 2: Address Information Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionHeaderTitle}>
                  {t('address_details') || 'Address Details'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  label={t('address_line1')}
                  value={formData.addressLine1}
                  onChangeText={value =>
                    handleInputChange('addressLine1', value)
                  }
                  placeholder={t('enter_address_line1')}
                  error={formErrors.addressLine1}
                  required={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  label={t('address_line2')}
                  value={formData.addressLine2}
                  onChangeText={value =>
                    handleInputChange('addressLine2', value)
                  }
                  placeholder={t('enter_address_line2')}
                  error={formErrors.addressLine2}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomDropdown
                  items={stateOptions}
                  selectedValue={formData.state}
                  onSelect={value => handleInputChange('state', value)}
                  label={t('state')}
                  placeholder={t('select_state')}
                  error={formErrors.state}
                  required={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomDropdown
                  items={cityOptions}
                  selectedValue={formData.city}
                  onSelect={value => handleInputChange('city', value)}
                  label={t('city')}
                  placeholder={t('select_city')}
                  error={formErrors.city}
                  required={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  label={t('pincode')}
                  value={formData.pincode}
                  onChangeText={value => handleInputChange('pincode', value)}
                  placeholder={t('enter_pincode')}
                  keyboardType="phone-pad"
                  error={formErrors.pincode}
                  onlyInteger={true}
                  maxIntegerLength={6}
                  required={true}
                />
              </View>

              {/* Address Type Selection Chips */}
              <View style={styles.addressTypeGroup}>
                <Text style={styles.fieldLabel}>
                  {t('type_of_address') || 'Type of Address'}
                  <Text style={styles.redStar}> *</Text>
                </Text>

                <View style={styles.chipsRow}>
                  {addressTypeOptions.map(opt => {
                    const isSelected =
                      String(formData.addressType) === String(opt.value);
                    const lower = opt.label.toLowerCase();
                    let iconName = 'location-outline';
                    if (lower.includes('home')) {
                      iconName = isSelected ? 'home' : 'home-outline';
                    } else if (
                      lower.includes('office') ||
                      lower.includes('work')
                    ) {
                      iconName = isSelected ? 'business' : 'business-outline';
                    }

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.typeChip,
                          isSelected && styles.typeChipSelected,
                        ]}
                        onPress={() =>
                          handleInputChange('addressType', String(opt.value))
                        }
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={iconName}
                          size={17}
                          color={
                            isSelected
                              ? COLORS.primary
                              : COLORS.pujaTextSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.typeChipText,
                            isSelected && styles.typeChipTextSelected,
                          ]}
                        >
                          {t(opt.label.toLowerCase()) || opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {formErrors.addressType ? (
                  <Text style={styles.errorText}>{formErrors.addressType}</Text>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View
            style={[
              styles.bottomActionBar,
              {
                paddingBottom: isKeyboardVisible
                  ? verticalScale(8)
                  : Math.max(insets.bottom, verticalScale(12)),
              },
            ]}
          >
            <PrimaryButton
              title={addressToEdit ? t('update_address') : t('save_address')}
              onPress={handleSaveAddress}
              style={styles.saveButton}
              disabled={isLoading}
            />
          </View>
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
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(20),
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
    fontSize: moderateScale(15),
    color: COLORS.primaryTextDark,
  },
  inputGroup: {
    marginBottom: verticalScale(14),
  },
  addressTypeGroup: {
    marginTop: verticalScale(4),
  },
  fieldLabel: {
    color: COLORS.inputLabelText,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(8),
  },
  redStar: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(14),
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: scale(6),
  },
  typeChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF0F1',
    borderWidth: 1.5,
  },
  typeChipText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: COLORS.primaryTextDark,
  },
  typeChipTextSelected: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },
  bottomActionBar: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    backgroundColor: COLORS.pujaBackground,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },
  saveButton: {
    marginTop: 0,
  },
});

export default AddAddressScreen;
