import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  AppState,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getRecommendedPandit,
  getUpcomingPujas,
  getInProgress,
  getActivePuja,
  PujaItem,
  RecommendedPandit,
} from '../../../api/apiService';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import { translateData } from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import PrimaryButton from '../../../components/PrimaryButton';
import { getCurrentLocation } from '../../../utils/locationUtils';
import { LOCATION_UPDATED_EVENT } from '../../../helper/helper';

interface PendingPuja {
  id: number;
  pooja: {
    title?: string;
    image_url?: string;
    pooja_name?: string;
    pooja_image_url?: string;
  };
  booking_date?: string;
  when_is_pooja?: string;
}

const UserHomeScreen: React.FC = () => {
  const navigation = useNavigation<UserHomeParamList>();
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [inProgressPujas, setInProgressPujas] = useState<PujaItem[]>([]);
  const [pendingPujas, setPendingPujas] = useState<PendingPuja[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [recomendedPandits, setRecomendedPandits] = useState<
    RecommendedPandit[]
  >([]);
  const [originalRecomendedPandits, setOriginalRecomendedPandits] = useState<
    RecommendedPandit[]
  >([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const inset = useSafeAreaInsets();

  // Fetch user ID
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(AppConstant.USER_ID).then(uid => {
      if (isMounted) setUser(uid);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load all data (with optional location)
  const loadAllData = useCallback(
    async (
      locationForPandit?: { latitude: number; longitude: number } | null,
    ) => {
      setLoading(true);
      try {
        // Parallel API calls (non-blocking)
        const [upcomingRes, inProgressRes, activeRes] = await Promise.all([
          getUpcomingPujas().catch(() => []),
          getInProgress().catch(() => []),
          getActivePuja().catch(() => ({ bookings: [] })),
        ]);

        // Recommended Pandits (only if location)
        let recommendedArr: RecommendedPandit[] = [];
        if (locationForPandit) {
          try {
            const rec = await getRecommendedPandit(
              locationForPandit.latitude.toString(),
              locationForPandit.longitude.toString(),
            );
            recommendedArr = Array.isArray(rec)
              ? rec
              : (rec as any)?.data || [];
          } catch (err) {
            console.warn('Failed to fetch recommended pandits:', err);
            recommendedArr = [];
          }
        }

        // Parse responses
        const upcomingArr: PujaItem[] = Array.isArray(upcomingRes)
          ? upcomingRes
          : [];
        const inProgressArr: PujaItem[] = Array.isArray(inProgressRes)
          ? inProgressRes
          : [];
        const pendingArr: PendingPuja[] = Array.isArray(activeRes?.bookings)
          ? activeRes.bookings
          : activeRes?.bookings
          ? [activeRes.bookings]
          : [];

        // Translate all data in parallel
        const [tPujas, tInProgress, tPending, tRecommended] = await Promise.all(
          [
            translateData(upcomingArr, currentLanguage, [
              'pooja_name',
              'when_is_pooja',
            ]) as Promise<PujaItem[]>,
            translateData(inProgressArr, currentLanguage, [
              'pooja_name',
            ]) as Promise<PujaItem[]>,
            Promise.all(
              pendingArr.map(async p => {
                if (p.pooja) {
                  const translatedPooja = await translateData(
                    p.pooja,
                    currentLanguage,
                    ['title', 'pooja_name'],
                  );
                  return { ...p, pooja: translatedPooja } as PendingPuja;
                }
                return p;
              }),
            ),
            translateData(recommendedArr, currentLanguage, [
              'full_name',
              'city',
            ]) as Promise<RecommendedPandit[]>,
          ],
        );

        // Update state
        setPujas(tPujas);
        setInProgressPujas(tInProgress);
        setPendingPujas(tPending);
        setRecomendedPandits(tRecommended);
        setOriginalRecomendedPandits(recommendedArr);
      } catch (err) {
        console.error('Error loading home data:', err);
        setPujas([]);
        setInProgressPujas([]);
        setPendingPujas([]);
        setRecomendedPandits([]);
        setOriginalRecomendedPandits([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentLanguage],
  );

  // Initial load: get location + load data
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);

      // Start non-location APIs immediately
      const [upcomingRes, inProgressRes, activeRes] = await Promise.all([
        getUpcomingPujas().catch(() => []),
        getInProgress().catch(() => []),
        getActivePuja().catch(() => ({ bookings: [] })),
      ]);

      let fetchedLocation: { latitude: number; longitude: number } | null =
        null;

      // Try to get location in parallel
      try {
        const loc = await getCurrentLocation();
        if (loc && isMounted) {
          fetchedLocation = {
            latitude: loc.latitude,
            longitude: loc.longitude,
          };
          setLocation(fetchedLocation);
        }
      } catch (err) {
        console.log('Location fetch failed (non-blocking):', err);
      }

      // Load pandits only if location exists
      let recommendedArr: RecommendedPandit[] = [];
      if (fetchedLocation) {
        try {
          const rec = await getRecommendedPandit(
            fetchedLocation.latitude.toString(),
            fetchedLocation.longitude.toString(),
          );
          recommendedArr = Array.isArray(rec) ? rec : (rec as any)?.data || [];
        } catch {
          recommendedArr = [];
        }
      }

      // Parse
      const upcomingArr = Array.isArray(upcomingRes) ? upcomingRes : [];
      const inProgressArr = Array.isArray(inProgressRes) ? inProgressRes : [];
      const pendingArr: PendingPuja[] = Array.isArray(activeRes?.bookings)
        ? activeRes.bookings
        : activeRes?.bookings
        ? [activeRes.bookings]
        : [];

      // Translate
      const [tPujas, tInProgress, tPending, tRecommended] = await Promise.all([
        translateData(upcomingArr, currentLanguage, [
          'pooja_name',
          'when_is_pooja',
        ]) as Promise<PujaItem[]>,
        translateData(inProgressArr, currentLanguage, [
          'pooja_name',
        ]) as Promise<PujaItem[]>,
        Promise.all(
          pendingArr.map(async p => {
            if (p.pooja) {
              const translatedPooja = await translateData(
                p.pooja,
                currentLanguage,
                ['title', 'pooja_name'],
              );
              return { ...p, pooja: translatedPooja } as PendingPuja;
            }
            return p;
          }),
        ),
        translateData(recommendedArr, currentLanguage, [
          'full_name',
          'city',
        ]) as Promise<RecommendedPandit[]>,
      ]);

      if (isMounted) {
        setPujas(tPujas);
        setInProgressPujas(tInProgress);
        setPendingPujas(tPending);
        setRecomendedPandits(tRecommended);
        setOriginalRecomendedPandits(recommendedArr);
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [currentLanguage]);

  // AppState: Re-fetch location when app is active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        const loc = await getCurrentLocation();
        if (loc) {
          setLocation({ latitude: loc.latitude, longitude: loc.longitude });
          loadAllData({ latitude: loc.latitude, longitude: loc.longitude });
        } else {
          loadAllData(null);
        }
      }
    });

    return () => subscription.remove();
  }, [loadAllData]);

  // Location update event listener
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      LOCATION_UPDATED_EVENT,
      async (newLoc: { latitude?: any; longitude?: any }) => {
        if (newLoc?.latitude && newLoc?.longitude) {
          const loc = {
            latitude: Number(newLoc.latitude),
            longitude: Number(newLoc.longitude),
          };
          setLocation(loc);
          await loadAllData(loc);
        } else {
          await loadAllData(null);
        }
      },
    );
    return () => listener.remove();
  }, [loadAllData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const loc = await getCurrentLocation();
    await loadAllData(
      loc ? { latitude: loc.latitude, longitude: loc.longitude } : null,
    );
  }, [loadAllData]);

  // Navigation handlers
  const handleBookPandit = useCallback(
    (
      panditId: number,
      panditName: string,
      panditImage: string,
      panditCity: string,
    ) => {
      navigation.navigate('SelectPujaScreen', {
        panditId,
        panditName,
        panditImage,
        panditCity,
      });
    },
    [navigation],
  );

  const handleNavigation = useCallback(
    (route: keyof UserHomeParamList) => {
      navigation.navigate(route);
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <UserCustomHeader title={t('home')} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primaryBackground]}
            tintColor={COLORS.primaryBackground}
          />
        }
      >
        {/* Recommended Panditji */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recomended_panditji')}</Text>
            <TouchableOpacity
              style={styles.seeAllContainer}
              onPress={() => handleNavigation('UserPanditjiNavigator')}
            >
              <Text style={styles.seeAllText}>{t('see_all')}</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={COLORS.primaryBackground}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.panditCardsContainer}
            contentContainerStyle={styles.panditCardsContentContainer}
          >
            {recomendedPandits.length > 0 ? (
              recomendedPandits.map((pandit: any) => {
                const panditImage =
                  pandit.profile_img ||
                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU';

                return (
                  <View
                    style={[styles.panditCard, THEMESHADOW.shadow]}
                    key={pandit.id}
                  >
                    <View style={styles.panditImageWrapper}>
                      <Image
                        source={{ uri: panditImage }}
                        style={styles.panditImage}
                      />
                      <View
                        style={[
                          styles.ratingContainerAbsolute,
                          THEMESHADOW.shadow,
                        ]}
                      >
                        <Ionicons
                          name="star"
                          size={16}
                          color={COLORS.primaryBackgroundButton}
                          style={{ marginRight: 5 }}
                        />
                        <Text style={styles.ratingText}>
                          {pandit.average_rating || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={styles.panditName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {pandit.full_name}
                    </Text>
                    <View style={{ alignSelf: 'center', marginTop: 8 }}>
                      <PrimaryButton
                        title={t('book')}
                        onPress={() => {
                          const original = originalRecomendedPandits.find(
                            p => p.id === pandit.id,
                          );
                          handleBookPandit(
                            original?.pandit_id ?? pandit.pandit_id,
                            original?.full_name ?? pandit.full_name,
                            original?.profile_img ?? pandit.profile_img,
                            original?.city ?? pandit.city,
                          );
                        }}
                        style={{ maxWidth: 90, maxHeight: 40 }}
                        textStyle={{
                          paddingHorizontal: 12,
                          textAlign: 'center',
                          fontSize: 15,
                          fontFamily: Fonts.Sen_Medium,
                        }}
                      />
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={[
                  THEMESHADOW.shadow,
                  {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.white,
                    paddingVertical: 12,
                  },
                ]}
              >
                <Text style={styles.noPanditText}>
                  {t('no_panditji_found')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* In-progress Puja */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>{t('in_progress_pujas')}</Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {inProgressPujas.length > 0 ? (
              inProgressPujas.map((puja, idx) => (
                <View key={puja.id}>
                  <TouchableOpacity
                    style={styles.pujaCard}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: puja.id,
                      })
                    }
                  >
                    <Image
                      source={{ uri: puja.pooja_image_url }}
                      style={styles.pujaImage}
                    />
                    <View style={styles.pujaTextContainer}>
                      <Text style={styles.pujaName}>{puja.pooja_name}</Text>
                      <Text style={styles.pujaDate}>{puja.booking_date}</Text>
                    </View>
                  </TouchableOpacity>
                  {idx !== inProgressPujas.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>
                {t('no_in_progress_pujas')}
              </Text>
            )}
          </View>
        </View>

        {/* Pending Approval */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>{t('waiting_for_approval')}</Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {pendingPujas.length > 0 ? (
              pendingPujas.map((puja, idx) => {
                const pooja = puja.pooja || {};
                const imageUrl =
                  pooja.image_url ||
                  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';
                const poojaName =
                  pooja.title || pooja.pooja_name || 'Unknown Puja';
                const poojaDate =
                  puja.when_is_pooja || puja.booking_date || 'No Date';

                return (
                  <View key={puja.id || idx}>
                    <TouchableOpacity
                      style={styles.pujaCard}
                      onPress={() =>
                        navigation.navigate('ConfirmPujaDetails', {
                          bookingId: puja.id,
                        })
                      }
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.pujaImage}
                      />
                      <View style={styles.pujaTextContainer}>
                        <Text style={styles.pujaName}>{poojaName}</Text>
                        <Text style={styles.pujaDate}>{poojaDate}</Text>
                      </View>
                    </TouchableOpacity>
                    {idx !== pendingPujas.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>
                {t('no_pending_pujas')}
              </Text>
            )}
          </View>
        </View>

        {/* Upcoming Puja */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>{t('upcoming_pujas')}</Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {pujas.length > 0 ? (
              pujas.map((puja, idx) => (
                <View key={puja.id}>
                  <TouchableOpacity
                    style={styles.pujaCard}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: puja.id,
                      })
                    }
                  >
                    <Image
                      source={{ uri: puja.pooja_image_url }}
                      style={styles.pujaImage}
                    />
                    <View style={styles.pujaTextContainer}>
                      <Text style={styles.pujaName}>{puja.pooja_name}</Text>
                      <Text style={styles.pujaDate}>{puja.when_is_pooja}</Text>
                    </View>
                  </TouchableOpacity>
                  {idx !== pujas.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>
                {t('no_upcoming_pujas')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    zIndex: 10,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
  },
  section: {
    marginBottom: moderateScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    fontWeight: '600',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryBackground,
    fontWeight: '500',
  },
  panditCardsContainer: {
    flexGrow: 0,
    paddingTop: moderateScale(12),
    paddingHorizontal: 10,
  },
  panditCardsContentContainer: {
    flexDirection: 'row',
    paddingBottom: moderateScale(10),
  },
  panditCard: {
    width: moderateScale(160),
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    marginRight: moderateScale(12),
  },
  panditImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  panditImage: {
    width: moderateScale(86),
    height: moderateScale(86),
    borderRadius: moderateScale(50),
    borderWidth: 1,
  },
  ratingContainerAbsolute: {
    position: 'absolute',
    bottom: moderateScale(-10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
  },
  panditName: {
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginTop: moderateScale(10),
  },
  ratingText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  noPanditText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#888',
    paddingHorizontal: moderateScale(10),
  },
  pujaSection: {
    marginBottom: moderateScale(24),
  },
  pujaCardsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginVertical: moderateScale(12),
  },
  pujaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  pujaImage: {
    width: moderateScale(52),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  pujaTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pujaName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(4),
  },
  pujaDate: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginVertical: moderateScale(8),
  },
});

export default UserHomeScreen;
