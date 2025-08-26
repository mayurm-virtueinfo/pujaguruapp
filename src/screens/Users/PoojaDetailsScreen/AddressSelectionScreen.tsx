import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
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
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';

const AddressSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList | UserHomeParamList,
    'AddressSelectionScreen',
    'AddAddressScreen'
  >;
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

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
  } = route?.params as any;

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingAddress[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const [selectedUserAddressId, setSelectedUserAddressId] = useState<
    number | null
  >(null);
  const [selectedAddress, setSelectedAddress] =
    useState<PoojaBookingAddress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  console.log('selectedAddress :: ', selectedAddress);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllPoojaAddresses();
    }, []),
  );

  console.log('poojaPlaces :: ', poojaPlaces);

  const fetchAllPoojaAddresses = async () => {
    try {
      setIsLoading(true);
      const response: any = await getAddressTypeForBooking();
      if (response.success) {
        setPoojaPlaces(response.data);
      }
    } catch (error) {
      console.error('Error fetching pooja places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
    const found = poojaPlaces.find(place => place.id === id) || null;
    setSelectedAddress(found);
    // @ts-ignore
    if (found && found.user_address_id) {
      // @ts-ignore
      setSelectedUserAddressId(found.user_address_id);
    } else {
      setSelectedUserAddressId(null);
    }
  };

  const handleNextPress = () => {
    navigation.navigate('PujaBooking', {
      poojaId: poojaId,
      samagri_required: samagri_required,
      address: selectedUserAddressId,
      poojaName: selectedAddress?.name || '',
      poojaDescription: selectedAddress?.full_address || '',
      puja_image: puja_image,
      puja_name: puja_name,
      price: price,
      selectAddressName: selectedAddress?.name || '',
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
    });
  };

  const onPlusPress = () => {
    navigation.navigate('AddAddressScreen' as never);
  };

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        showCirclePlusButton={true}
        onPlusPress={onPlusPress}
      />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.flexGrow}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.contentWrapper}>
              <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>{t('select_address')}</Text>
                <Text style={styles.descriptionText}>
                  {t('choose_puja_place')}
                </Text>
                {!isLoading && (
                  <View style={[styles.pricingContainer, THEMESHADOW.shadow]}>
                    {poojaPlaces.length === 0 ? (
                      <View style={{alignItems: 'center', paddingVertical: 24}}>
                        <Text
                          style={{
                            fontSize: 16,
                            color: COLORS.primaryTextDark,
                            fontFamily: Fonts.Sen_Medium,
                          }}>
                          {t('add_your_address')}
                        </Text>
                      </View>
                    ) : (
                      poojaPlaces.map((place, index) => (
                        <React.Fragment key={place.id}>
                          <TouchableOpacity
                            style={styles.pricingOption}
                            activeOpacity={0.7}
                            onPress={() => handleSelectAddress(place.id)}>
                            <View>
                              <Text style={styles.pricingText}>
                                {place.name}
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
            </View>
          </ScrollView>
          <View
            style={[
              styles.buttonWrapper,
              {paddingBottom: inset.bottom > 0 ? inset.bottom : 16},
            ]}>
            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginTop: 20,
  },
  pricingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  buttonWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 1,
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    marginTop: 10,
    textAlign: 'justify',
    color: '#6c7278',
  },
});

export default AddressSelectionScreen;
