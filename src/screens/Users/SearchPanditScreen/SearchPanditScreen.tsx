import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Dimensions, Alert} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  StackActions,
} from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const SearchPanditScreen: React.FC = () => {
  const route = useRoute();
  const {booking_Id, booking_id} = route.params as any;
  const bookingId = booking_Id || booking_id;
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [wsError, setWsError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(
    t('search_pandit_screen_scanning_location') || 'Scanning your location...',
  );
  const pulseRef = useRef<Animatable.View & View>(null);
  const circle1Ref = useRef<Animatable.View & View>(null);
  const circle2Ref = useRef<Animatable.View & View>(null);
  const ws = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    setSearchText(
      t('search_pandit_screen_scanning_location') ||
        'Scanning your location...',
    );
  }, [t]);

  useEffect(() => {
    if (bookingId) {
      // Start 1-minute timeout: if no acceptance, navigate to Home
      timeoutRef.current = setTimeout(() => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          // Reset to bottom tab with first tab focused and its first screen
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Main' as never,
                  params: {
                    screen: 'UserAppBottomTabNavigator',
                    params: {
                      screen: 'UserHomeNavigator',
                      params: {screen: 'UserHomeScreen'},
                    },
                  } as never,
                },
              ],
            }),
          );
        }
      }, 60 * 1000);

      let socketURL = `ws://192.168.1.23:9000/ws/bookings/${bookingId}/`;
      if (socketURL.startsWith('ws://') && !__DEV__) {
        socketURL = socketURL.replace('ws://', 'wss://');
      }
      console.log('socketURL :: ', socketURL);

      let socket: WebSocket | null = null;
      try {
        socket = new WebSocket(socketURL);
        ws.current = socket;
      } catch (err) {
        setWsError('WebSocket initialization failed');
        console.error('WebSocket initialization error:', err);
        return;
      }

      console.log('socketURL : ', socketURL);

      socket.onopen = () => {
        console.log('✅ Connected to WebSocket');
        setWsError(null);
      };

      socket.onerror = e => {
        setWsError('WebSocket connection error');
        console.error('WebSocket error:', e?.message || e);
      };

      socket.onclose = e => {
        console.log('WebSocket closed:', e.code, e.reason);
        if (!hasNavigatedRef.current && !wsError) {
          setWsError('WebSocket connection closed');
        }
      };

      socket.onmessage = event => {
        try {
          // Check if event.data exists and is a string
          if (!event.data || typeof event.data !== 'string') {
            console.warn('WebSocket received non-string data:', event.data);
            return;
          }

          const data = JSON.parse(event.data);

          // Validate the parsed data structure
          if (!data || typeof data !== 'object') {
            console.warn('WebSocket received invalid JSON data:', data);
            return;
          }

          if (data.status === 'accepted' || data.status === 'ACCEPTED') {
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              setLoading(false);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              // navigation.navigate('BookingSuccessfullyScreen', {
              //   booking: bookingId,
              //   auto: 'true',
              // } as any);
              // Direct replace to ConfirmPujaDetails
              navigation.dispatch(
                StackActions.replace(
                  'ConfirmPujaDetails' as never,
                  {
                    bookingId,
                  } as never,
                ),
              );
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          console.error('Raw message data:', event.data);
        }
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [bookingId, navigation, wsError]);

  // Timer-based progression removed

  const pulseAnimation = {
    0: {scale: 1, opacity: 0.7},
    0.5: {scale: 1.2, opacity: 1},
    1: {scale: 1, opacity: 0.7},
  };

  const radarAnimation = {
    0: {scale: 0.5, opacity: 1},
    1: {scale: 2.5, opacity: 0},
  };

  useEffect(() => {
    if (loading) {
      circle1Ref.current?.animate(radarAnimation, 2000);
      setTimeout(() => {
        circle2Ref.current?.animate(radarAnimation, 2000);
      }, 1000);
    }
  }, [loading]);

  return (
    <View style={[styles.safeArea, {paddingTop: inset.top}]}>
      <UserCustomHeader
        title={t('search_pandit_screen_title')}
        showBackButton={true}
      />

      <View style={styles.contentWrapper}>
        <Text style={styles.heading}>{t('search_pandit_screen_heading')}</Text>
        <Text style={styles.subheading}>
          {t('search_pandit_screen_subheading')}
        </Text>
        {wsError ? (
          <View style={{marginVertical: 20}}>
            <Text
              style={{color: 'red', textAlign: 'center', fontWeight: 'bold'}}>
              {t('search_pandit_screen_ws_error') ||
                'Unable to connect to server. Please check your internet connection or try again later.'}
            </Text>
            <Text
              style={{
                color: COLORS.textGray,
                textAlign: 'center',
                marginTop: 8,
                fontSize: 13,
              }}>
              {wsError}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.radarWrapper}>
              <Animatable.View
                ref={circle1Ref}
                style={[
                  styles.radarCircle,
                  {borderColor: COLORS.primary + '50'},
                ]}
              />
              <Animatable.View
                ref={circle2Ref}
                style={[
                  styles.radarCircle,
                  {borderColor: COLORS.gradientEnd + '40'},
                ]}
              />
              <Animatable.View
                ref={pulseRef}
                animation={pulseAnimation}
                iterationCount="infinite"
                duration={1500}
                style={styles.iconContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.gradientEnd]}
                  style={styles.iconGradient}>
                  <Ionicons
                    name="search"
                    size={moderateScale(60)}
                    color="#fff"
                    style={{alignSelf: 'center'}}
                  />
                </LinearGradient>
              </Animatable.View>
            </View>
            <Animatable.Text
              animation="pulse"
              easing="ease-in-out"
              iterationCount="infinite"
              duration={2000}
              style={styles.loadingText}>
              {searchText}
            </Animatable.Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  container: {
    flex: 1,
    borderTopRightRadius: moderateScale(30),
    borderTopLeftRadius: moderateScale(30),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(0),
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
    paddingBottom: verticalScale(40),
    backgroundColor: COLORS.white,
  },
  heading: {
    fontSize: moderateScale(22),
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: verticalScale(8),
    textAlign: 'center',
    fontFamily: 'Sen-Bold',
  },
  subheading: {
    fontSize: moderateScale(15),
    color: COLORS.textGray,
    marginBottom: verticalScale(30),
    textAlign: 'center',
    fontFamily: 'Sen-Regular',
  },
  radarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(180),
    height: moderateScale(180),
    marginBottom: verticalScale(32),
  },
  radarCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
    opacity: 0,
  },
  iconContainer: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: moderateScale(18),
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: 'Sen-Medium',
    fontWeight: '600',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    letterSpacing: 0.2,
  },
});

export default SearchPanditScreen;
