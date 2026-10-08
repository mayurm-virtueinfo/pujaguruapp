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
  ViewStyle,
  Platform,
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
import {
  COLORS,
  THEMESHADOW,
  COMMON_LIST_STYLE,
  COMMON_CARD_STYLE,
} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import { translateData } from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useLocation } from '../../../context/LocationContext';
import InlineLocationRequest from '../../../components/InlineLocationRequest';
import RecommendedPanditCard from '../../../components/RecommendedPanditCard';

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

const formatBookingDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const now = new Date();
      if (
        now.getFullYear() === year &&
        now.getMonth() === monthIndex &&
        now.getDate() === day
      ) {
        return 'Today';
      }

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${months[monthIndex]} ${day < 10 ? '0' + day : day}, ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      if (
        now.getFullYear() === d.getFullYear() &&
        now.getMonth() === d.getMonth() &&
        now.getDate() === d.getDate()
      ) {
        return 'Today';
      }
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

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
  console.log('webSocket messages in UserHomeScreen :: ', messages);

  // 🧠 Refs for controlling repeated fetches
  const isFetchingRef = useRef(false);
  const lastFetched = useRef<number>(0);
  const lastFetchedLanguage = useRef<string>(currentLanguage);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondaryRefreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const processedMessageCount = useRef(0);
  const recentlyAcceptedIds = useRef<Set<string>>(new Set());

  const {
    location: contextLocation,
    refreshLocation,
    permissionStatus,
    isLocationServiceEnabled,
    loading: locationLoading,
  } = useLocation();

  useEffect(() => {
    if (contextLocation) {
      setLocation({
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      });
    }
  }, [contextLocation]);

  // 🔄 Unified API loader
  const loadAllData = useCallback(
    async (
      loc?: { latitude: number; longitude: number } | null,
      forceRefresh: boolean = false,
    ) => {
      if (isFetchingRef.current) {
        console.log('⏳ Skipping duplicate loadAllData call...');
        return;
      }

      // Skip if last fetch was <30 seconds ago AND language hasn't changed AND forced refresh is false
      if (
        Date.now() - lastFetched.current < 30000 &&
        !refreshing &&
        !forceRefresh &&
        lastFetchedLanguage.current === currentLanguage
      ) {
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

        const rawPending: PendingPuja[] = Array.isArray(activeRes?.bookings)
          ? activeRes.bookings
          : activeRes?.bookings
          ? [activeRes.bookings]
          : [];

        // Exclude any booking that we already know was accepted
        const pendingArr = rawPending.filter(
          p => !recentlyAcceptedIds.current.has(String(p.id)),
        );

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

        setPujas(currentPujas => {
          const serverPujas: PujaItem[] = tPujas || [];
          const serverIds = new Set(serverPujas.map(p => String(p.id)));
          const preserved = currentPujas.filter(
            p =>
              recentlyAcceptedIds.current.has(String(p.id)) &&
              !serverIds.has(String(p.id)),
          );
          return [...preserved, ...serverPujas];
        });
        setInProgressPujas(tInProgress || []);
        setPendingPujas(tPending || []);
        setRecomendedPandits(tRecommended || []);
        setOriginalRecomendedPandits(recommendedArr || []);
        lastFetched.current = Date.now();
        lastFetchedLanguage.current = currentLanguage; // Update language tracker
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

  // 🧭 Initial load (Triggered when context updates location)
  useEffect(() => {
    if (contextLocation) {
      const loc = {
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      };
      loadAllData(loc);
    }
  }, [contextLocation, loadAllData]);

  // 📱 AppState listener (only when foregrounded)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        if (contextLocation) {
          const loc = {
            latitude: contextLocation.latitude,
            longitude: contextLocation.longitude,
          };
          await loadAllData(loc);
        } else {
          // refresh manually if missing? context usually handles init
          await refreshLocation();
        }
      }
    });
    return () => sub.remove();
  }, [loadAllData, location, contextLocation, refreshLocation]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    // Context update will trigger the data load via the useEffect above
    if (contextLocation) {
      const loc = {
        latitude: contextLocation.latitude,
        longitude: contextLocation.longitude,
      };
      await loadAllData(loc, true);
    } else {
      // If no location after refresh?
      setRefreshing(false);
    }
  }, [loadAllData, contextLocation, refreshLocation]);

  // ⚡ Dedicated booking-only loader (bypasses GPS, recommended pandits, and concurrency lock)
  const refreshBookingsOnly = useCallback(async () => {
    try {
      console.log(
        '🔄 [UserHomeScreen] Fetching fresh booking data from server...',
      );
      const [upcomingRes, inProgressRes, activeRes]: any = await Promise.all([
        getUpcomingPujas().catch(() => []),
        getInProgress().catch(() => []),
        getActivePuja().catch(() => ({ bookings: [] })),
      ]);

      const rawPending: PendingPuja[] = Array.isArray(activeRes?.bookings)
        ? activeRes.bookings
        : activeRes?.bookings
        ? [activeRes.bookings]
        : [];

      // Exclude any booking that we already know was accepted
      const pendingArr = rawPending.filter(
        p => !recentlyAcceptedIds.current.has(String(p.id)),
      );

      const [tPujas, tInProgress, tPending]: any = await Promise.all([
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
      ]);

      setPujas(currentPujas => {
        const serverPujas: PujaItem[] = tPujas || [];
        const serverIds = new Set(serverPujas.map(p => String(p.id)));
        const preserved = currentPujas.filter(
          p =>
            recentlyAcceptedIds.current.has(String(p.id)) &&
            !serverIds.has(String(p.id)),
        );
        return [...preserved, ...serverPujas];
      });
      setInProgressPujas(tInProgress || []);
      setPendingPujas(tPending || []);
      console.log('✅ [UserHomeScreen] Booking data refreshed successfully!');
    } catch (err) {
      console.warn('⚠️ [UserHomeScreen] Failed to refresh bookings:', err);
    }
  }, [currentLanguage]);

  useEffect(() => {
    // If no new messages, do nothing
    if (messages.length <= processedMessageCount.current) return;

    // Get only the new messages
    const newMessages = messages.slice(processedMessageCount.current);
    let shouldRefresh = false;

    newMessages.forEach(msg => {
      if (!msg) return;

      const type = String(msg.type || '').toLowerCase();
      const action = String(msg.action || '').toLowerCase();
      const bookingId = msg.booking_id ?? msg.id;

      // Check for booking update criteria
      if (
        type === 'booking_update' &&
        (action === 'accepted' ||
          action === 'in_progress' ||
          action === 'completed' ||
          action === 'cancelled')
      ) {
        console.log(
          `✅ [WebSocket] Received booking #${bookingId} update: action=${action}`,
        );
        shouldRefresh = true;

        // ⚡ 1. Instant Optimistic UI State Updates (0ms lag)
        if (action === 'accepted' && bookingId) {
          console.log(
            `⚡ [WebSocket Optimistic] Moving booking #${bookingId} to Upcoming Puja`,
          );
          recentlyAcceptedIds.current.add(String(bookingId));
          // Auto-clear after 15 seconds once backend DB is well past committed
          setTimeout(() => {
            recentlyAcceptedIds.current.delete(String(bookingId));
          }, 15000);

          setPendingPujas(prev => {
            const acceptedItem = prev.find(
              p => String(p.id) === String(bookingId),
            );
            if (acceptedItem) {
              const formattedDate =
                acceptedItem.when_is_pooja ||
                formatBookingDate(acceptedItem.booking_date);
              const newUpcomingItem: PujaItem = {
                id: acceptedItem.id,
                pooja_name:
                  acceptedItem.pooja?.title ||
                  acceptedItem.pooja?.pooja_name ||
                  'Puja',
                pooja_image_url:
                  acceptedItem.pooja?.image_url ||
                  acceptedItem.pooja?.pooja_image_url ||
                  '',
                booking_date: acceptedItem.booking_date || '',
                when_is_pooja: formattedDate,
              };
              setPujas(currentUpcoming => {
                const exists = currentUpcoming.some(
                  item => String(item.id) === String(acceptedItem.id),
                );
                if (exists) return currentUpcoming;
                const updated = [...currentUpcoming, newUpcomingItem];
                return updated.sort((a, b) => {
                  const dateA = a.booking_date || '';
                  const dateB = b.booking_date || '';
                  if (dateA && dateB) return dateA.localeCompare(dateB);
                  return 0;
                });
              });
            }
            return prev.filter(p => String(p.id) !== String(bookingId));
          });
        } else if (action === 'in_progress' && bookingId) {
          console.log(
            `⚡ [WebSocket Optimistic] Moving booking #${bookingId} to In-Progress`,
          );
          setPujas(prev => {
            const item = prev.find(p => String(p.id) === String(bookingId));
            if (item) {
              setInProgressPujas(curr => {
                const exists = curr.some(i => String(i.id) === String(item.id));
                return exists ? curr : [item, ...curr];
              });
            }
            return prev.filter(p => String(p.id) !== String(bookingId));
          });
        } else if (action === 'completed' && bookingId) {
          console.log(
            `⚡ [WebSocket Optimistic] Removing completed booking #${bookingId}`,
          );
          setInProgressPujas(prev =>
            prev.filter(p => String(p.id) !== String(bookingId)),
          );
          setPujas(prev =>
            prev.filter(p => String(p.id) !== String(bookingId)),
          );
        } else if (action === 'cancelled' && bookingId) {
          console.log(
            `⚡ [WebSocket Optimistic] Removing cancelled booking #${bookingId}`,
          );
          setPendingPujas(prev =>
            prev.filter(p => String(p.id) !== String(bookingId)),
          );
          setPujas(prev =>
            prev.filter(p => String(p.id) !== String(bookingId)),
          );
          setInProgressPujas(prev =>
            prev.filter(p => String(p.id) !== String(bookingId)),
          );
        }
      }
    });

    // Update the tracker so we don't process these again
    processedMessageCount.current = messages.length;

    // 🔄 2. Server Sync to absorb backend database lag smoothly
    if (shouldRefresh) {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      if (secondaryRefreshTimeout.current)
        clearTimeout(secondaryRefreshTimeout.current);

      // Server sync at 2000ms after backend DB has committed
      refreshTimeout.current = setTimeout(() => {
        console.log('🔄 [WebSocket] Executing server confirmation sync');
        refreshBookingsOnly();
      }, 2000);
    }

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      if (secondaryRefreshTimeout.current)
        clearTimeout(secondaryRefreshTimeout.current);
    };
  }, [messages, refreshBookingsOnly]);

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading && !!contextLocation} />
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
        contentContainerStyle={{
          paddingBottom:
            inset.bottom +
            (Platform.OS === 'android' ? moderateScale(50) : moderateScale(20)),
        }}
      >
        <View style={styles.mainContainer}>
          {/* Recommended Panditji */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('recomended_panditji')}
              </Text>
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
                recomendedPandits.map((pandit: any, idx) => {
                  const panditImage =
                    pandit.profile_img ||
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU';

                  return (
                    <React.Fragment key={pandit.id}>
                      <RecommendedPanditCard
                        image={panditImage}
                        title={pandit.full_name}
                        rating={pandit.average_rating}
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
                      />
                      {idx !== recomendedPandits.length - 1 && (
                        <View style={styles.spacer16} />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <View style={[THEMESHADOW.shadow, styles.noPanditContainer]}>
                  {!contextLocation ? (
                    <InlineLocationRequest
                      onAllow={refreshLocation}
                      permissionStatus={permissionStatus}
                      isLocationServiceEnabled={isLocationServiceEnabled}
                    />
                  ) : (
                    <Text style={styles.noPanditText}>
                      {loading
                        ? t('updating_location')
                        : t('no_panditji_found')}
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>

          {/* In-progress Puja */}
          <View style={styles.pujaSection}>
            <Text style={styles.sectionTitle}>{t('in_progress_pujas')}</Text>
            <View style={[styles.pujaCardsContainer, COMMON_LIST_STYLE]}>
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
                <Text style={styles.noItemText}>
                  {t('no_in_progress_pujas')}
                </Text>
              )}
            </View>
          </View>

          {/* Waiting for Approval */}
          <View style={styles.pujaSection}>
            <Text style={styles.sectionTitle}>{t('waiting_for_approval')}</Text>
            <View style={[styles.pujaCardsContainer, COMMON_LIST_STYLE]}>
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
                <Text style={styles.noItemText}>{t('no_pending_pujas')}</Text>
              )}
            </View>
          </View>

          {/* Upcoming Puja */}
          <View style={styles.pujaSection}>
            <Text style={styles.sectionTitle}>{t('upcoming_pujas')}</Text>
            <View style={[styles.pujaCardsContainer, COMMON_LIST_STYLE]}>
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
                        <Text style={styles.pujaDate}>
                          {puja.when_is_pooja ||
                            formatBookingDate(puja.booking_date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {idx !== pujas.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noItemText}>{t('no_upcoming_pujas')}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    paddingVertical: moderateScale(24),
  },
  section: {
    marginBottom: moderateScale(14),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    fontWeight: '600',
    marginBottom: moderateScale(12),
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  seeAllText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryBackground,
    fontWeight: '500',
  },
  panditCardsContainer: {},
  panditCardsContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(10),
  },
  noPanditText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textSecondary,
    paddingHorizontal: moderateScale(10),
  },
  pujaSection: {
    paddingHorizontal: moderateScale(24),
    marginBottom: moderateScale(24),
  },
  pujaCardsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  pujaCard: {
    ...(COMMON_CARD_STYLE as ViewStyle),
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
    color: COLORS.pujaCardSubtext,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  noItemText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    ...(COMMON_CARD_STYLE as ViewStyle),
  },
  mainContainer: {
    flex: 1,
  },
  spacer16: {
    width: moderateScale(16),
  },
  noPanditContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: moderateScale(24),
    borderRadius: moderateScale(16),
    marginHorizontal: moderateScale(4),
  },
});

export default UserHomeScreen;
