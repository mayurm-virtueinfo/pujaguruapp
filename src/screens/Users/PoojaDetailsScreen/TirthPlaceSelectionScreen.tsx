import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  } = (route?.params as any) || {};

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
    (navigation as any).navigate('PujaBooking', {
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <View style={styles.flexContainer}>
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
                  <Ionicons name="sparkles" size={20} color={COLORS.primary} />
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
            <Text style={styles.sectionTitle}>{t('select_tirth_place')}</Text>
            <Text style={styles.descriptionText}>
              {t('choose_tirth_place')}
            </Text>
          </View>

          {/* 3. Tirth Place Options Group */}
          {!isLoading && (
            <View style={styles.tirthListContainer}>
              {poojaPlaces.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>
                    No Tirth Places available
                  </Text>
                </View>
              ) : (
                poojaPlaces.map(place => {
                  const isSelected = selectedTirthPlaceId === place.id;

                  return (
                    <TouchableOpacity
                      key={place.id}
                      style={[
                        styles.tirthCard,
                        isSelected && styles.tirthCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleTirthPlaceSelect(place)}
                      testID={`tirth-option-${place.id}`}
                    >
                      <View style={styles.textContainer}>
                        <View style={styles.tirthTitleRow}>
                          <Text
                            style={[
                              styles.tirthNameText,
                              isSelected && styles.tirthNameTextSelected,
                            ]}
                          >
                            {place.city_name}
                          </Text>
                          <View style={styles.tirthPillBadge}>
                            <Text style={styles.tirthPillText}>
                              Holy Pilgrimage
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={styles.subtitleText}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {place.description}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          isSelected ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={24}
                        color={isSelected ? COLORS.primary : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  );
                })
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
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(130),
    flexGrow: 1,
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

  /* Tirth Cards */
  tirthListContainer: {
    gap: moderateScale(12),
  },
  tirthCard: {
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
  tirthCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F9',
  },
  textContainer: {
    flex: 1,
    paddingRight: moderateScale(8),
  },
  tirthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  tirthNameText: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  tirthNameTextSelected: {
    color: COLORS.primary,
  },
  tirthPillBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(1.5),
    borderRadius: 8,
  },
  tirthPillText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#C2410C',
  },
  subtitleText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#4B5563',
    lineHeight: moderateScale(17),
  },

  /* Empty Container */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(30),
    gap: moderateScale(8),
  },
  emptyText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#9CA3AF',
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
});

export default TirthPlaceSelectionScreen;
