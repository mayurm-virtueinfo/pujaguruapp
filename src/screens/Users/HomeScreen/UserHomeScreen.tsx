import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import { translateData } from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';
import PrimaryButton from '../../../components/PrimaryButton';
import {
  getLocationForAPI,
  LOCATION_UPDATED_EVENT,
} from '../../../helper/helper';
import { useWebSocket } from '../../../context/WebSocketContext';

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
  const navigation: any = useNavigation();
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [inProgressPujas, setInProgressPujas] = useState<PujaItem[]>([]);
  const [pendingPujas, setPendingPujas] = useState<PendingPuja[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
  const { messages } = useWebSocket();

  // 🧠 Refs for controlling repeated fetches
  const isFetchingRef = useRef(false);
  const lastFetched = useRef<number>(0);
  const lastHandledMessageId = useRef<string | null>(null);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔄 Unified API loader
  const loadAllData = useCallback(
    async (loc?: { latitude: number; longitude: number } | null) => {
      if (isFetchingRef.current) {
        console.log('⏳ Skipping duplicate loadAllData call...');
        return;
      }

      // Skip if last fetch was <30 seconds ago
      if (Date.now() - lastFetched.current < 30000 && !refreshing) {
        console.log('⏳ Skipping refresh: data is recent');
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);

      try {
        const [upcomingRes, inProgressRes, activeRes]: any = await Promise.all([
          getUpcomingPujas().catch(() => []),
          getInProgress().catch(() => []),
          getActivePuja().catch(() => ({ bookings: [] })),
        ]);

        let recommendedArr: RecommendedPandit[] = [];
        if (loc) {
          try {
            const rec = await getRecommendedPandit(
              loc.latitude.toString(),
              loc.longitude.toString(),
            );
            recommendedArr = Array.isArray(rec)
              ? rec
              : (rec as any)?.data || [];
          } catch (err) {
            console.warn('⚠️ Failed to fetch recommended pandits:', err);
          }
        }

        const pendingArr: PendingPuja[] = Array.isArray(activeRes?.bookings)
          ? activeRes.bookings
          : activeRes?.bookings
          ? [activeRes.bookings]
          : [];

        // 🔠 Translate all content
        const [tPujas, tInProgress, tPending, tRecommended]: any =
          await Promise.all([
            translateData(upcomingRes, currentLanguage, [
              'pooja_name',
              'when_is_pooja',
            ]),
            translateData(inProgressRes, currentLanguage, ['pooja_name']),
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
            ]),
          ]);

        setPujas(tPujas || []);
        setInProgressPujas(tInProgress || []);
        setPendingPujas(tPending || []);
        setRecomendedPandits(tRecommended || []);
        setOriginalRecomendedPandits(recommendedArr || []);
        lastFetched.current = Date.now();
      } catch (err) {
        console.error('❌ Error loading home data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [currentLanguage, refreshing],
  );

  // 🧭 Initial load
  useEffect(() => {
    const init = async () => {
      const loc = await getLocationForAPI();
      if (loc) setLocation(loc);
      await loadAllData(loc);
    };
    init();
  }, [loadAllData]);

  // 📱 AppState listener (only when foregrounded)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        const loc = await getLocationForAPI();
        await loadAllData(loc);
      }
    });
    return () => sub.remove();
  }, [loadAllData]);

  // 📍 Location update listener
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      LOCATION_UPDATED_EVENT,
      async newLoc => {
        if (newLoc?.latitude && newLoc?.longitude) {
          const loc = {
            latitude: Number(newLoc.latitude),
            longitude: Number(newLoc.longitude),
          };
          setLocation(loc);
          await loadAllData(loc);
        }
      },
    );
    return () => listener.remove();
  }, [loadAllData]);

  // 🔁 Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const loc = await getLocationForAPI();
    await loadAllData(loc);
  }, [loadAllData]);

  // ⚡ WebSocket real-time updates
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (!latest) return;

    const uniqueKey = `${latest.type}-${latest.action}-${latest.booking_id}`;
    if (lastHandledMessageId.current === uniqueKey) return;

    lastHandledMessageId.current = uniqueKey;

    const { type, action, booking_id } = latest;

    if (type === 'booking_update' && ['accepted'].includes(action)) {
      console.log(`✅ Updating puja list due to booking #${booking_id}`);

      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

      refreshTimeout.current = setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  }, [messages, onRefresh]);

  // 🔗 Navigation helper
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
    (route: any) => {
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
                          {pandit?.average_rating}
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
                {location ? (
                  <Text style={styles.noPanditText}>
                    {t('updating_location')}
                  </Text>
                ) : (
                  <Text style={styles.noPanditText}>
                    {t('location_not_available')}
                  </Text>
                )}
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
                      <Text style={styles.pujaDate}>
                        {puja.booking_date
                          ? (() => {
                              const dateParts = puja.booking_date.split('-');
                              // booking_date is assumed to be in YYYY-MM-DD
                              if (dateParts.length === 3) {
                                const [yyyy, mm, dd] = dateParts;
                                return `${dd}-${mm}-${yyyy}`;
                              }
                              return puja.booking_date;
                            })()
                          : ''}
                      </Text>
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
                // Set date in format DDMMYYYY (without dashes or spaces)
                let poojaDateRaw =
                  puja.when_is_pooja || puja.booking_date || 'No Date';
                let poojaDate = poojaDateRaw;
                if (
                  poojaDateRaw &&
                  poojaDateRaw !== 'No Date' &&
                  typeof poojaDateRaw === 'string' &&
                  poojaDateRaw.split('-').length === 3
                ) {
                  const [yyyy, mm, dd] = poojaDateRaw.split('-');
                  poojaDate = `${dd}-${mm}-${yyyy}`;
                }

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
