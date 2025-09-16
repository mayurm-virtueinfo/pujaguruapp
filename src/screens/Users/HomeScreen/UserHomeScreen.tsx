import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  AppState,
} from 'react-native';
import {moderateScale} from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getRecommendedPandit,
  getUpcomingPujas,
  getInProgress,
  getActivePuja,
  getPanchang,
  PujaItem,
  RecommendedPandit,
} from '../../../api/apiService';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import PrimaryButton from '../../../components/PrimaryButton';
import {getLocationForAPI} from '../../../helper/helper';

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
  const [location, setLocation] = useState<any | null>(null);
  const [recomendedPandits, setRecomendedPandits] = useState<
    RecommendedPandit[]
  >([]);
  const [todayPanchang, setTodayPanchang] = useState<string | null>(null);
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();

  useEffect(() => {
    fetchUserAndLocation();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('App active - refreshing location data');
        fetchRecommendedPandits();
        fetchTodayPanchang();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUpcomingPujas();
      fetchInProgressPujas();
      fetchPendingPujas();
      fetchRecommendedPandits();
      fetchTodayPanchang();
      // Start silent polling while focused
      startHomePolling();
      // Cleanup on unfocus
      return () => stopHomePolling();
    }, []),
  );

  // Polling controls for silent refresh
  const homePollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isHomeRefreshingRef = useRef<boolean>(false);

  const startHomePolling = () => {
    if (homePollingTimerRef.current) {
      clearInterval(homePollingTimerRef.current);
    }
    homePollingTimerRef.current = setInterval(async () => {
      if (isHomeRefreshingRef.current) return;
      isHomeRefreshingRef.current = true;
      try {
        await refreshListsSilently();
      } finally {
        isHomeRefreshingRef.current = false;
      }
    }, 7000);
  };

  const stopHomePolling = () => {
    if (homePollingTimerRef.current) {
      clearInterval(homePollingTimerRef.current);
      homePollingTimerRef.current = null;
    }
  };

  const fetchUserAndLocation = async () => {
    try {
      const user = await AsyncStorage.getItem(AppConstant.USER_ID);
      setUser(user);

      const locationData = await getLocationForAPI();
      if (locationData) {
        setLocation(locationData);
      }
    } catch (error) {
      console.error('Error fetching user and location:', error);
    }
  };

  const fetchUpcomingPujas = async () => {
    setLoading(true);
    try {
      const response: any = await getUpcomingPujas();
      setPujas(response || []);
    } catch (error) {
      console.error('Error fetching upcoming puja data:', error);
      setPujas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInProgressPujas = async () => {
    setLoading(true);
    try {
      const response: any = await getInProgress();
      setInProgressPujas(response || []);
    } catch (error) {
      console.error('Error fetching in-progress puja data:', error);
      setInProgressPujas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPujas = async () => {
    setLoading(true);
    try {
      const response: any = await getActivePuja();
      let bookings: PendingPuja[] = [];
      if (Array.isArray(response?.booking)) {
        bookings = response.booking;
      } else if (response?.booking) {
        bookings = [response.booking];
      } else {
        bookings = [];
      }
      setPendingPujas(bookings);
    } catch (error) {
      console.error('Error fetching pending puja data:', error);
      setPendingPujas([]);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh for lists without toggling the global loader
  const refreshListsSilently = async () => {
    try {
      const [upcoming, inProgress, active]: any = await Promise.all([
        getUpcomingPujas().catch(() => []),
        getInProgress().catch(() => []),
        getActivePuja().catch(() => ({booking: []})),
      ]);

      // Upcoming
      setPujas(Array.isArray(upcoming) ? upcoming : []);

      // In-progress
      setInProgressPujas(Array.isArray(inProgress) ? inProgress : []);

      // Pending (normalize to array)
      let bookings: PendingPuja[] = [];
      if (Array.isArray(active?.booking)) {
        bookings = active.booking;
      } else if (active?.booking) {
        bookings = [active.booking];
      }
      setPendingPujas(bookings);
    } catch (e) {
      // keep silent
    }
  };

  const fetchRecommendedPandits = async () => {
    try {
      setLoading(true);

      const locationData = await getLocationForAPI();

      if (locationData) {
        const response = await getRecommendedPandit(
          locationData.latitude,
          locationData.longitude,
        );

        if (response && Array.isArray(response.data)) {
          setRecomendedPandits(response.data || []);
        }
      } else {
        console.warn('No location available for recommended pandits');
      }
    } catch (error: any) {
      if (
        Platform.OS === 'ios' &&
        error?.response?.status === 403 &&
        error?.response?.data?.detail ===
          'Authentication credentials were not provided.'
      ) {
        Alert.alert(
          t('error'),
          t('authentication_credentials_not_provided') ||
            'Authentication credentials were not provided. Please login again.',
        );
        return;
      }
      console.error(
        'Error fetching recommended pandits:',
        error.response?.data,
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTodayPanchang = async () => {
    try {
      const locationData = await getLocationForAPI();

      if (locationData) {
        const dateStr = formatDate(new Date());
        const response = await getPanchang(
          dateStr,
          String(locationData.latitude),
          String(locationData.longitude),
        );

        if (response?.success && response?.today_panchang) {
          setTodayPanchang(response.today_panchang);
        }
      } else {
        console.warn('No location available for panchang');
      }
    } catch (error) {
      console.log('Error fetching panchang:', error);
    }
  };

  const handleBookPandit = (
    panditId: number,
    panditName: string,
    panditImage: string,
    panditCity: string,
  ) => {
    navigation.navigate('SelectPujaScreen', {
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
      panditCity: panditCity,
    });
  };

  const handleNavigation = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <UserCustomHeader
        title={t('home')}
        // showBellButton={true}
        // onNotificationPress={handleNotificationPress}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recommended Panditji Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recomended_panditji')}</Text>
            <TouchableOpacity
              style={styles.seeAllContainer}
              onPress={() => handleNavigation('UserPanditjiNavigator')}>
              <Text style={styles.seeAllText}>{t('see_all')}</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={COLORS.primaryBackground}
              />
            </TouchableOpacity>
          </View>
          {todayPanchang && (
            <Text style={styles.subtitle}>{todayPanchang}</Text>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.panditCardsContainer}
            contentContainerStyle={styles.panditCardsContentContainer}>
            {recomendedPandits && recomendedPandits.length > 0 ? (
              recomendedPandits.map((pandit: any) => {
                const panditImage =
                  pandit.profile_img ||
                  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';
                return (
                  <View
                    style={[styles.panditCard, THEMESHADOW.shadow]}
                    key={pandit.id}>
                    <View style={styles.panditImageWrapper}>
                      <Image
                        source={{uri: panditImage}}
                        style={styles.panditImage}
                        accessibilityLabel={`Profile image of ${pandit.full_name}`}
                      />
                      <View
                        style={[
                          styles.ratingContainerAbsolute,
                          THEMESHADOW.shadow,
                        ]}>
                        <Ionicons
                          name="star"
                          size={16}
                          color={COLORS.primaryBackgroundButton}
                          style={{marginRight: 5}}
                        />
                        <Text style={styles.ratingText}>
                          {pandit.average_rating}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={styles.panditName}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {pandit.full_name}
                    </Text>
                    <View style={{alignSelf: 'center'}}>
                      <PrimaryButton
                        title={t('book')}
                        onPress={() =>
                          handleBookPandit(
                            pandit.pandit_id,
                            pandit.full_name,
                            panditImage,
                            pandit.city,
                          )
                        }
                        style={{
                          maxWidth: 90,
                          maxHeight: 40,
                        }}
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
                ]}>
                <Text style={styles.noPanditText}>
                  {t('no_panditji_found')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* In-progress Puja Section */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>
            {t('in_progress_pujas') || 'In-progress Pujas'}
          </Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {inProgressPujas && inProgressPujas.length > 0 ? (
              inProgressPujas.map((puja, idx) => (
                <View key={puja.id}>
                  <TouchableOpacity
                    style={styles.pujaCard}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: puja.id,
                      })
                    }>
                    <Image
                      source={{uri: puja.pooja_image_url}}
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
              <Text style={{color: '#888', textAlign: 'center'}}>
                {t('no_in_progress_pujas') || 'No in-progress pujas'}
              </Text>
            )}
          </View>
        </View>

        {/* Pending Puja Section */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>
            {t('pending_pujas') || 'Pending Pujas'}
          </Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {Array.isArray(pendingPujas) && pendingPujas.length > 0 ? (
              pendingPujas.map((puja, idx) => {
                const pooja = puja.pooja || {};
                const imageUrl =
                  pooja.image_url ||
                  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';
                const poojaName = pooja.title || 'Unknown Puja';
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
                      }>
                      <Image
                        source={{uri: imageUrl}}
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
              <Text style={{color: '#888', textAlign: 'center'}}>
                {t('no_pending_pujas') || 'No pending pujas'}
              </Text>
            )}
          </View>
        </View>

        {/* Upcoming Puja Section */}
        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>{t('upcoming_pujas')}</Text>
          <View style={[styles.pujaCardsContainer, THEMESHADOW.shadow]}>
            {pujas && pujas.length > 0 ? (
              pujas.map((puja, idx) => (
                <View key={puja.id}>
                  <TouchableOpacity
                    style={styles.pujaCard}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: puja.id,
                      })
                    }>
                    <Image
                      source={{uri: puja.pooja_image_url}}
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
              <Text style={{color: '#888', textAlign: 'center'}}>
                {t('no_upcoming_pujas')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#6C7278',
    fontWeight: '500',
    marginBottom: moderateScale(12),
  },
  panditCardsContainer: {
    flexGrow: 0,
    marginTop: moderateScale(12),
  },
  panditCardsContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(2),
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
    borderRadius: moderateScale(40),
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
    letterSpacing: -0.33,
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
