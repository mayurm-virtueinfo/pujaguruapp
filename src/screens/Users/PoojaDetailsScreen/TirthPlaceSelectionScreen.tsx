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
import {
  apiService,
  getTirthPlace,
  PoojaBookingAddress,
  PoojaBookingTirthPlace,
} from '../../../api/apiService';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {useNavigation, useRoute} from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';

const TirthPlaceSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'TirthPlaceSelectionScreen'
  >;
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

  const route = useRoute();
  const {poojaId, samagri_required} = route.params as any;

  const handleNextPress = () => {
    navigation.navigate('PujaBooking', {
      poojaId: poojaId,
      samagri_required: samagri_required,
      tirth: selectedTirthPlaceId,
    });
  };

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingTirthPlace[]>([]);
  const [selectedTirthPlaceId, setSelectedTirthPlaceId] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  console.log('selectedTirthPlaceId :: ', selectedTirthPlaceId);

  useEffect(() => {
    fetchTirthPlaces();
  }, []);

  const fetchTirthPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await getTirthPlace();
      console.log('Fetched Tirth Place Requests:', response);
      if (response && Array.isArray(response)) {
        setPoojaPlaces(response);
        console.log('Tirth Places:', response);
      }
    } catch (error) {
      console.error('Error fetching tirth places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>{t('select_tirth_place')}</Text>
            <Text style={styles.descriptionText}>
              {t('choose_tirth_place')}
            </Text>
            {!isLoading && (
              <View style={styles.pricingContainer}>
                {poojaPlaces.map((place, index) => (
                  <React.Fragment key={place.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() => setSelectedTirthPlaceId(place.id)}>
                      <View style={styles.textContainer}>
                        <Text style={styles.pricingText}>
                          {place.city_name}
                        </Text>
                        <Text
                          style={styles.subtitleText}
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {place.description}
                        </Text>
                      </View>
                      <View style={styles.iconContainer}>
                        <Octicons
                          name={
                            selectedTirthPlaceId === place.id
                              ? 'check-circle'
                              : 'circle'
                          }
                          size={24}
                          color={
                            selectedTirthPlaceId === place.id
                              ? COLORS.primary
                              : COLORS.inputBoder
                          }
                        />
                      </View>
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
              disabled={!selectedTirthPlaceId}
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
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
    textAlign: 'justify',
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

export default TirthPlaceSelectionScreen;
