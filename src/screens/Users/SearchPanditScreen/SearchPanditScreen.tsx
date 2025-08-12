import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const {width} = Dimensions.get('window');

const SearchPanditScreen: React.FC = () => {
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  // Use translation keys for search steps
  const SEARCH_STEPS = [
    t('search_pandit_screen_scanning_location'),
    t('search_pandit_screen_finding_nearby_pandits'),
    t('search_pandit_screen_matching_requirements'),
    t('search_pandit_screen_almost_there'),
  ];

  const [searchText, setSearchText] = useState(SEARCH_STEPS[0]);
  const pulseRef = useRef<Animatable.View & View>(null);
  const circle1Ref = useRef<Animatable.View & View>(null);
  const circle2Ref = useRef<Animatable.View & View>(null);

  useEffect(() => {
    // Recompute SEARCH_STEPS on language change
    setSearchText(SEARCH_STEPS[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];
    SEARCH_STEPS.forEach((text, idx) => {
      timers.push(
        setTimeout(() => {
          setStep(idx);
          setSearchText(text);
        }, idx * 1200),
      );
    });
    timers.push(
      setTimeout(() => {
        setLoading(false);
        // Only navigate to PaymentScreen
        navigation.navigate('PaymentScreen' as never);
      }, SEARCH_STEPS.length * 1200),
    );
    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SEARCH_STEPS.join('|')]);

  // Pulse animation for the icon
  const pulseAnimation = {
    0: {scale: 1, opacity: 0.7},
    0.5: {scale: 1.2, opacity: 1},
    1: {scale: 1, opacity: 0.7},
  };

  // Radar circle animation (expanding and fading)
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
        <View style={styles.radarWrapper}>
          <Animatable.View
            ref={circle1Ref}
            style={[styles.radarCircle, {borderColor: COLORS.primary + '50'}]}
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
