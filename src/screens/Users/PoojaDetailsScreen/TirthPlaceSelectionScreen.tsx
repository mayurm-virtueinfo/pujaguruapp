import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS, COMMON_RADIO_CONTAINER_STYLE } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Octicons from 'react-native-vector-icons/Octicons';
import { getTirthPlace, PoojaBookingTirthPlace } from '../../../api/apiService';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import { useNavigation, useRoute } from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { translateData } from '../../../utils/TranslateData';
import { moderateScale } from 'react-native-size-matters';

const TirthPlaceSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'TirthPlaceSelectionScreen'
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
  } = route?.params as any;

  console.log('tirth place route?.params :: ', route?.params);

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingTirthPlace[]>([]);
  const [originalPoojaPlaces, setOriginalPoojaPlaces] = useState<
    PoojaBookingTirthPlace[]
  >([]);
  const [selectedTirthPlaceId, setSelectedTirthPlaceId] = useState<
    number | null
  >(null);
  const [selectedTirthPlaceName, setSelectedTirthPlaceName] = useState<
    string | null
  >(null);
  const [selectedTirthPlaceDescription, setSelectedTirthPlaceDescription] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTirthPlaceLatitude, setSelectedTirthPlaceLatitude] = useState<
    string | null
  >(null);
  const [selectedTirthPlaceLongitude, setSelectedTirthPlaceLongitude] =
    useState<string | null>(null);

  const translationCacheRef = useRef<Map<string, any>>(new Map());

  console.log(
    'selectedTirthPlaceDescription :: ',
    selectedTirthPlaceDescription,
  );

  const fetchTirthPlaces = useCallback(async () => {
    try {
      setIsLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setPoojaPlaces(cachedData);
        setIsLoading(false);
        return;
      }

      const response = await getTirthPlace();
      if (response && Array.isArray(response)) {
        setOriginalPoojaPlaces(response);

        const translated: any = await translateData(response, currentLanguage, [
          'city_name',
          'description',
        ]);
        translationCacheRef.current.set(currentLanguage, translated);
        setPoojaPlaces(translated);
      } else {
        setPoojaPlaces([]);
        setOriginalPoojaPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching tirth places:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchTirthPlaces();
  }, [fetchTirthPlaces]);

  const handleTirthPlaceSelect = (place: PoojaBookingTirthPlace) => {
    const originalPlace = originalPoojaPlaces.find(p => p.id === place.id);
    if (originalPlace) {
      setSelectedTirthPlaceId(originalPlace.id);
      setSelectedTirthPlaceName(originalPlace.city_name);
      setSelectedTirthPlaceDescription(originalPlace.description);
      setSelectedTirthPlaceLatitude(originalPlace.latitude);
      setSelectedTirthPlaceLongitude(originalPlace.longitude);
    }
  };

  const handleNextPress = () => {
    navigation.navigate('PujaBooking', {
      poojaId: poojaId,
      samagri_required: samagri_required,
      puja_image: puja_image,
      puja_name: puja_name,
      poojaName: selectedTirthPlaceName,
      tirth: selectedTirthPlaceId,
      price: price,
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
      description: description,
      poojaDescription: selectedTirthPlaceDescription,
      selectTirthPlaceName: selectedTirthPlaceName || '',
      selectedAddressLatitude: selectedTirthPlaceLatitude,
      selectedAddressLongitude: selectedTirthPlaceLongitude,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <View style={styles.flexContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{
            paddingBottom: 60 + (inset.bottom || 20),
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentWrapper}>
            {/* Title and Description Group */}
            <View style={styles.headerGroup}>
              <Text style={styles.sectionTitle}>{t('select_tirth_place')}</Text>
              <Text style={styles.descriptionText}>
                {t('choose_tirth_place')}
              </Text>
            </View>

            {/* Tirth Place Options Group */}
            {!isLoading && (
              <View
                style={[COMMON_RADIO_CONTAINER_STYLE, styles.radioContainer]}
              >
                {poojaPlaces.map((place, index) => (
                  <React.Fragment key={place.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() => handleTirthPlaceSelect(place)}
                    >
                      <View style={styles.textContainer}>
                        <Text style={styles.pricingText}>
                          {place.city_name}
                        </Text>
                        <Text
                          style={styles.subtitleText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
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
          </View>
        </ScrollView>
        <View
          style={[
            styles.bottomButtonContainer,
            {
              paddingBottom: 16,
            },
          ]}
        >
          <PrimaryButton
            title={t('next')}
            onPress={handleNextPress}
            disabled={!selectedTirthPlaceId}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flexContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(10),
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
    marginRight: moderateScale(10),
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'justify',
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: moderateScale(24),
  },
  divider: {
    borderColor: COLORS.border,
    borderWidth: 0.8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'justify',
    color: '#6c7278',
  },
});

export default TirthPlaceSelectionScreen;
