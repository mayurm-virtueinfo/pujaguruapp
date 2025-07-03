import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../../../components/CustomHeader';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Octicons from 'react-native-vector-icons/Octicons';
import {apiService, PoojaBookingAddress} from '../../../api/apiService';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const AddressSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PujaBooking'
  >;
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

  const handleNextPress = () => {
    navigation.navigate('PujaBooking');
  };

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAllPoojaAddresses();
  }, []);

  const fetchAllPoojaAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getBookingAddress();
      console.log('Fetched Pooja Address Requests:', response);
      if (response && Array.isArray(response)) {
        setPoojaPlaces(response);
      }
    } catch (error) {
      console.error('Error fetching pooja places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Pooja Places:', poojaPlaces);

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        showCirclePlusButton={true}
      />
      <CustomeLoader loading={isLoading} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>{t('select_address')}</Text>
            <Text style={styles.descriptionText}>{t('choose_puja_place')}</Text>
            {!isLoading && (
              <View style={styles.pricingContainer}>
                {poojaPlaces.map((place, index) => (
                  <React.Fragment key={place.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() => setSelectedAddressId(place.id)}>
                      <View>
                        <Text style={styles.pricingText}>{place.title}</Text>
                        <Text style={styles.subtitleText}>
                          {place.subtitle}
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
                ))}
              </View>
            )}
            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={!selectedAddressId}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
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
