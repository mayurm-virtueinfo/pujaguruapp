import React, { useCallback, useState } from 'react';
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
  Image,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import PrimaryButtonOutlined from '../../../components/PrimaryButtonOutlined';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  } = (route?.params as any) || {};

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
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        showCirclePlusButton={true}
        onPlusPress={onPlusPress}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flexGrow}>
          {/* Mismatch Modal */}
          <Modal
            visible={mismatchModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMismatchModalVisible(false)}
          >
            <View style={styles.mismatchModalOverlay}>
              <View style={styles.mismatchModalContainer}>
                <View style={styles.mismatchIconCircle}>
                  <Ionicons name="warning-outline" size={28} color="#EA580C" />
                </View>
                <Text style={styles.mismatchModalTitle}>
                  {t('oops') || 'Location Mismatch'}
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
                  style={styles.modalPrimaryBtn}
                />
                <PrimaryButtonOutlined
                  title={
                    t('choose_another_address') || 'Choose Another Address'
                  }
                  onPress={() => {
                    setMismatchModalVisible(false);
                  }}
                  style={styles.modalOutlinedBtn}
                />
              </View>
            </View>
          </Modal>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            alwaysBounceVertical={true}
            keyboardShouldPersistTaps="handled"
            overScrollMode="always"
            nestedScrollEnabled={true}
          >
            {/* 1. Puja Summary Card */}
            {puja_name ? (
              <View style={styles.summaryCard}>
                {puja_image ? (
                  <Image
                    source={{ uri: puja_image }}
                    style={styles.summaryImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.summaryImagePlaceholder}>
                    <Ionicons
                      name="sparkles"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                )}
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryTitle} numberOfLines={1}>
                    {puja_name}
                  </Text>
                  <View style={styles.summaryTagRow}>
                    <View style={styles.samagriTag}>
                      <Text style={styles.samagriTagText}>
                        {samagri_required ? 'With Samagri' : 'Without Samagri'}
                      </Text>
                    </View>
                    {panditName ? (
                      <View style={styles.panditTag}>
                        <Ionicons name="person" size={11} color="#15803D" />
                        <Text style={styles.panditTagText} numberOfLines={1}>
                          {panditName}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {price ? (
                  <View style={styles.summaryPriceCol}>
                    <Text style={styles.summaryPriceLabel}>Total</Text>
                    <Text style={styles.summaryPrice}>₹{price}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 2. Title and Description Group */}
            <View style={styles.headerGroup}>
              <Text style={styles.sectionTitle}>{t('select_address')}</Text>
              <Text style={styles.descriptionText}>
                {t('choose_puja_place')}
              </Text>
            </View>

            {/* 3. Address Options Group */}
            {!isLoading && (
              <View style={styles.addressesListContainer}>
                {poojaPlaces.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons
                        name="location-outline"
                        size={32}
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.emptyTitleText}>
                      {t('add_your_address') || 'No Saved Addresses'}
                    </Text>
                    <Text style={styles.emptySubtitleText}>
                      Please add the venue address where the puja will be
                      performed.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyAddButton}
                      onPress={onPlusPress}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={18}
                        color={COLORS.white}
                      />
                      <Text style={styles.emptyAddButtonText}>
                        {t('add_address') || 'Add New Address'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {poojaPlaces.map(place => {
                      const isSelected = selectedAddressId === place.id;

                      return (
                        <TouchableOpacity
                          key={place.id}
                          style={[
                            styles.addressCard,
                            isSelected && styles.addressCardSelected,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => handleSelectAddress(place.id)}
                          testID={`address-option-${place.id}`}
                        >
                          <View style={styles.addressInfoCol}>
                            <View style={styles.addressTitleRow}>
                              <Text
                                style={[
                                  styles.addressTypeText,
                                  isSelected && styles.addressTypeTextSelected,
                                ]}
                              >
                                {place.address_type || 'Address'}
                              </Text>
                              {isSelected && (
                                <View style={styles.selectedPillBadge}>
                                  <Text style={styles.selectedPillText}>
                                    Selected
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.fullAddressText}>
                              {place.full_address}
                            </Text>
                            {place.city ? (
                              <View style={styles.cityPill}>
                                <Ionicons
                                  name="navigate-outline"
                                  size={11}
                                  color="#6B7280"
                                />
                                <Text style={styles.cityPillText}>
                                  {String(place.city)}
                                  {place.state ? `, ${place.state}` : ''}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Ionicons
                            name={
                              isSelected
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={24}
                            color={isSelected ? COLORS.primary : '#D1D5DB'}
                          />
                        </TouchableOpacity>
                      );
                    })}

                    {/* Add Another Address Button Card */}
                    <TouchableOpacity
                      style={styles.addAddressCard}
                      activeOpacity={0.8}
                      onPress={onPlusPress}
                      testID="btn-add-new-address"
                    >
                      <View style={styles.addAddressIconCircle}>
                        <Ionicons name="add" size={18} color={COLORS.primary} />
                      </View>
                      <Text style={styles.addAddressText}>
                        {t('add_address') || 'Add Address'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>

          {/* 4. Bottom Action Button */}
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
  keyboardAvoid: {
    flex: 1,
  },
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(130),
  },

  /* Puja Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(12),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  summaryImagePlaceholder: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
    marginRight: moderateScale(8),
  },
  summaryTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(4),
  },
  summaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  samagriTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: 6,
  },
  samagriTagText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#4B5563',
  },
  panditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: 6,
  },
  panditTagText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#15803D',
  },
  summaryPriceCol: {
    alignItems: 'flex-end',
  },
  summaryPriceLabel: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.Sen_Regular,
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  summaryPrice: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },

  /* Header Section */
  headerGroup: {
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.3,
    marginBottom: moderateScale(6),
  },
  descriptionText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#6C7278',
    lineHeight: moderateScale(20),
  },

  /* Address List */
  addressesListContainer: {
    gap: moderateScale(12),
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#EAECEF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F9',
  },
  addressInfoCol: {
    flex: 1,
    paddingRight: moderateScale(8),
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(3),
  },
  addressTypeText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  addressTypeTextSelected: {
    color: COLORS.primary,
  },
  selectedPillBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(1.5),
    borderRadius: 8,
  },
  selectedPillText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  fullAddressText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#4B5563',
    lineHeight: moderateScale(18),
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: moderateScale(4),
  },
  cityPillText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#6B7280',
  },

  /* Add Address Card Button */
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: moderateScale(14),
    backgroundColor: '#FAFAFA',
    marginTop: moderateScale(4),
  },
  addAddressIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },

  /* Empty State */
  emptyStateContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  emptyIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  emptyTitleText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  emptySubtitleText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(16),
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: COLORS.primary,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: 10,
  },
  emptyAddButtonText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.white,
  },

  /* Bottom Button */
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(6),
  },

  /* Mismatch Modal */
  mismatchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  mismatchModalContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: moderateScale(22),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mismatchIconCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  mismatchModalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  mismatchModalMessage: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#4B5563',
    marginBottom: moderateScale(20),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  modalPrimaryBtn: {
    width: '100%',
  },
  modalOutlinedBtn: {
    width: '100%',
    marginTop: moderateScale(10),
  },
});

export default AddressSelectionScreen;
