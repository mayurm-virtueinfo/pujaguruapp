import React, {useState} from 'react';
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

interface AddAddressScreenProps {
  navigation?: any;
}

//component to add a new address
const AddAddressScreen: React.FC<AddAddressScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMyLocation = () => {
    // Implementation for getting current location
    console.log('Get my location');
  };

  const handleSaveAddress = () => {
    // Implementation for saving address
    console.log('Save address:', formData);
  };

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      <UserCustomHeader
        title={t('add_address')}
        showBackButton={true}
        onBackPress={handleBack}
      />

      {/* Form Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('full_name') + ' *'}
              value={formData.fullName}
              onChangeText={value => handleInputChange('fullName', value)}
              placeholder={t('enter_full_name')}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('phone_number') + ' *'}
              value={formData.phoneNumber}
              onChangeText={value => handleInputChange('phoneNumber', value)}
              placeholder={t('enter_phone_number')}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address Line 1 */}
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('address_line1') + ' *'}
              value={formData.addressLine1}
              onChangeText={value => handleInputChange('addressLine1', value)}
              placeholder={t('enter_address_line1')}
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.inputGroup}>
            <CustomTextInput
              label={t('address_line2') + ' *'}
              value={formData.addressLine2}
              onChangeText={value => handleInputChange('addressLine2', value)}
              placeholder={t('enter_address_line2')}
            />
          </View>

          {/* City and State Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <CustomTextInput
                label={t('city') + ' *'}
                value={formData.city}
                onChangeText={value => handleInputChange('city', value)}
                placeholder={t('enter_city')}
              />
            </View>

            <View style={styles.halfInputGroup}>
              <CustomTextInput
                label={t('state') + ' *'}
                value={formData.state}
                onChangeText={value => handleInputChange('state', value)}
                placeholder={t('enter_state')}
              />
            </View>
          </View>

          {/* Pincode and My Location Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfInputGroup}>
              <CustomTextInput
                label={t('pincode') + ' *'}
                value={formData.pincode}
                onChangeText={value => handleInputChange('pincode', value)}
                placeholder={t('enter_pincode')}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleMyLocation}>
              <Icon
                name="my-location"
                size={18}
                color={COLORS.primaryTextDark}
              />
              <Text style={styles.locationButtonText}>{t('my_location')}</Text>
            </TouchableOpacity>
          </View>

          {/* Address Type */}
          <View style={styles.addressTypeGroup}>
            <Text style={styles.label}>{t('type_of_address')}</Text>
            <View style={styles.addressTypeContainer}>
              {/* HOME Button */}
              <TouchableOpacity
                style={[
                  styles.addressTypeButton,
                  formData.addressType === 'HOME' &&
                    styles.addressTypeButtonActive,
                ]}
                onPress={() => handleInputChange('addressType', 'HOME')}>
                <Icon
                  name="home"
                  size={16}
                  color={
                    formData.addressType === 'HOME'
                      ? COLORS.white
                      : COLORS.primaryTextDark
                  }
                />
                <Text
                  style={[
                    styles.addressTypeText,
                    formData.addressType === 'HOME' &&
                      styles.addressTypeTextActive,
                  ]}>
                  {t('Home')}
                </Text>
              </TouchableOpacity>

              {/* OFFICE Button */}
              <TouchableOpacity
                style={[
                  styles.addressTypeButton,
                  formData.addressType === 'OFFICE' &&
                    styles.addressTypeButtonActive,
                ]}
                onPress={() => handleInputChange('addressType', 'OFFICE')}>
                <Icon
                  name="business"
                  size={16}
                  color={
                    formData.addressType === 'OFFICE'
                      ? COLORS.white
                      : COLORS.primaryTextDark
                  }
                />
                <Text
                  style={[
                    styles.addressTypeText,
                    formData.addressType === 'OFFICE' &&
                      styles.addressTypeTextActive,
                  ]}>
                  {t('office')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <PrimaryButton
            title={t('save_address')}
            onPress={handleSaveAddress}
            style={{marginTop: 0}}
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
  label: {
    color: COLORS.inputLabelText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Sen-Medium',
    marginBottom: 2,
    letterSpacing: -0.28,
  },
  textInput: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Sen-Medium',
    color: COLORS.primaryTextDark,
    backgroundColor: COLORS.white,
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
  addressTypeContainer: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  addressTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
  },
  addressTypeButtonActive: {
    backgroundColor: COLORS.gradientEnd,
  },
  addressTypeText: {
    color: COLORS.primaryTextDark,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Sen-Medium',
  },
  addressTypeTextActive: {
    color: COLORS.white,
  },
  saveButton: {
    height: 46,
    backgroundColor: COLORS.gradientEnd,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Sen-Medium',
    letterSpacing: -0.15,
    textTransform: 'uppercase',
  },
});

export default AddAddressScreen;
