import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { COLORS, COMMON_RADIO_CONTAINER_STYLE } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import PrimaryButtonOutlined from '../../../components/PrimaryButtonOutlined';
import Octicons from 'react-native-vector-icons/Octicons';
import {
  getAddressTypeForBooking,
  PoojaBookingAddress,
} from '../../../api/apiService';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import { translateData } from '../../../utils/TranslateData';
import { moderateScale } from 'react-native-size-matters';

const AddressSelectionScreen: React.FC = () => {
  type BookingAddress = PoojaBookingAddress & {
    address_type?: string;
    latitude?: number;
    longitude?: number;
    city?: string | number;
    state?: string;
    uuid?: string;
  };
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList | UserHomeParamList,
    'AddressSelectionScreen',
    'AddAddressScreen'
  >;
  const { t, i18n } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

  const currentLanguage = i18n.language;

  const route = useRoute();

  const {
    poojaId,
    samagri_required,
    puja_image,
    puja_name,
    price,
    panditId,
    panditName,
    panditImage,
    description,
    panditCity,
  } = route?.params as any;

  console.log('AddressSelectionScreen route?.params :: ', route?.params);

  const [poojaPlaces, setPoojaPlaces] = useState<BookingAddress[]>([]);
  const [originalPoojaPlaces, setOriginalPoojaPlaces] = useState<
    BookingAddress[]
  >([]);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [selectedUserAddressId, setSelectedUserAddressId] = useState<
    number | null
  >(null);
  const [selectedAddress, setSelectedAddress] = useState<BookingAddress | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mismatchModalVisible, setMismatchModalVisible] =
    useState<boolean>(false);

  const fetchAllPoojaAddresses = useCallback(async () => {
    try {
      setIsLoading(true);

      const response: any = await getAddressTypeForBooking();

      if (response.success) {
        setOriginalPoojaPlaces(response.addresses);
        const translated: any = await translateData(
          response.addresses,
          currentLanguage,
          ['address_type', 'full_address'],
        );

        setPoojaPlaces(translated);
      } else {
        setPoojaPlaces([]);
        setOriginalPoojaPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching pooja places:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllPoojaAddresses();
    }, [fetchAllPoojaAddresses]),
  );

  const handleSelectAddress = (id: number) => {
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
      setSelectedAddress(null);
      setSelectedUserAddressId(null);
      return;
    }
    setSelectedAddressId(id);
    const found = originalPoojaPlaces.find(place => place.id === id) || null;
    setSelectedAddress(found);
    if (found && found.id) {
      setSelectedUserAddressId(found.id);
    } else {
      setSelectedUserAddressId(null);
    }
  };

  const handleNextPress = () => {
    const normalize = (value: any) =>
      value === undefined || value === null
        ? ''
        : String(value).toLowerCase().trim();

    if (selectedAddress) {
      const selectedCity = normalize(selectedAddress.city);
      const panditCityNorm = normalize(panditCity);
      if (selectedCity && panditCityNorm && selectedCity !== panditCityNorm) {
        setMismatchModalVisible(true);
        return;
      }
    }
    navigation.navigate('PujaBooking', {
      poojaId: poojaId,
      samagri_required: samagri_required,
      puja_image: puja_image,
      puja_name: puja_name,
      poojaName: puja_name,
      price: price,
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
      description: description,
      address: selectedUserAddressId,
      poojaDescription: selectedAddress?.full_address || '',
      selectAddressName: selectedAddress?.address_type || '',
      selectedAddressLatitude: String(selectedAddress?.latitude ?? ''),
      selectedAddressLongitude: String(selectedAddress?.longitude ?? ''),
    });
  };

  const onPlusPress = () => {
    navigation.navigate('AddAddressScreen' as never);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        showCirclePlusButton={true}
        onPlusPress={onPlusPress}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.flexGrow}>
          <Modal
            visible={mismatchModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMismatchModalVisible(false)}
          >
            <View style={styles.mismatchModalOverlay}>
              <View style={styles.mismatchModalContainer}>
                <Text style={styles.mismatchModalTitle}>
                  {t('oops') || 'Oops'}
                </Text>
                <Text style={styles.mismatchModalMessage}>
                  {t('pandit_city_mismatch', {
                    selectedCity: String(selectedAddress?.city ?? ''),
                    panditCity: String(panditCity ?? ''),
                  })}
                </Text>
                <PrimaryButton
                  title={t('go_to_home') || 'Go to Home'}
                  onPress={() => {
                    setMismatchModalVisible(false);
                    // @ts-ignore
                    navigation.navigate('UserHomeNavigator', {
                      screen: 'UserHomeScreen',
                    });
                  }}
                  style={{ width: '100%' }}
                />
                <PrimaryButtonOutlined
                  title={
                    t('choose_another_address') || 'Choose another address'
                  }
                  onPress={() => {
                    setMismatchModalVisible(false);
                  }}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Modal>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={{
              paddingBottom: 60 + (inset.bottom || 20),
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentWrapper}>
              {/* Title and Description Group */}
              <View style={styles.headerGroup}>
                <Text style={styles.sectionTitle}>{t('select_address')}</Text>
                <Text style={styles.descriptionText}>
                  {t('choose_puja_place')}
                </Text>
              </View>

              {/* Address Options Group */}
              {!isLoading && (
                <View
                  style={[COMMON_RADIO_CONTAINER_STYLE, styles.radioContainer]}
                >
                  {poojaPlaces.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: COLORS.primaryTextDark,
                          fontFamily: Fonts.Sen_Medium,
                        }}
                      >
                        {t('add_your_address')}
                      </Text>
                    </View>
                  ) : (
                    poojaPlaces.map((place, index) => (
                      <React.Fragment key={place.id}>
                        <TouchableOpacity
                          style={styles.pricingOption}
                          activeOpacity={0.7}
                          onPress={() => handleSelectAddress(place.id)}
                        >
                          <View style={styles.textContainer}>
                            <Text style={styles.pricingText}>
                              {place.address_type}
                            </Text>
                            <Text style={styles.subtitleText}>
                              {place.full_address}
                            </Text>
                          </View>
                          <Octicons
                            name={
                              selectedAddressId === place.id
                                ? 'check-circle'
                                : 'circle'
                            }
                            size={24}
                            color={
                              selectedAddressId === place.id
                                ? COLORS.primary
                                : COLORS.inputBoder
                            }
                          />
                        </TouchableOpacity>
                        {index !== poojaPlaces.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>
          <View
            style={[
              styles.bottomButtonContainer,
              {
                paddingBottom: moderateScale(16),
              },
            ]}
          >
            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              disabled={!selectedUserAddressId}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flexGrow: {
    flex: 1,
  },
  scrollContainer: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
    flex: 1,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(14),
    gap: moderateScale(24),
  },
  headerGroup: {
    marginTop: moderateScale(10),
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(10),
  },
  radioContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
  },
  textContainer: {
    flex: 1,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    marginBottom: moderateScale(5),
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: moderateScale(24),
  },
  mismatchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mismatchModalContainer: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
  },
  mismatchModalTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  mismatchModalMessage: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    color: '#6c7278',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  divider: {
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'justify',
    color: '#6c7278',
  },
});

export default AddressSelectionScreen;
