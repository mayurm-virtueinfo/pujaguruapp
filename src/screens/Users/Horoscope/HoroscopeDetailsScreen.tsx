import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import LinearGradient from 'react-native-linear-gradient';
import {
  HoroscopeResponse,
  HoroscopeDetailedStats,
  getDailyHoroscope,
} from '../../../api/apiService';
import { Images } from '../../../theme/Images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { translateText } from '../../../utils/TranslateData';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

type HoroscopeDetailsRouteProp = RouteProp<
  UserProfileParamList,
  'HoroscopeDetailsScreen'
>;

interface AspectConfig {
  icon: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

const ASPECT_CONFIGS: Record<string, AspectConfig> = {
  health: {
    icon: 'heart-outline',
    themeColor: '#059669',
    badgeBg: '#ECFDF5',
    badgeBorder: '#A7F3D0',
  },
  wealth: {
    icon: 'wallet-outline',
    themeColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
  occupation: {
    icon: 'briefcase-outline',
    themeColor: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
  },
  family: {
    icon: 'people-outline',
    themeColor: '#7C3AED',
    badgeBg: '#F5F3FF',
    badgeBorder: '#DDD6FE',
  },
};

const HoroscopeDetailsScreen = () => {
  const route = useRoute<HoroscopeDetailsRouteProp>();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const { signKey, signName } = route.params;

  const [data, setData] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Map<string, HoroscopeResponse>>(new Map());
  const inset = useSafeAreaInsets();

  const fetchData = async () => {
    const cacheKey = `${signKey}_${currentLanguage}`;
    if (cacheRef.current.has(cacheKey)) {
      setData(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let result = await getDailyHoroscope(signKey);

      if (result && currentLanguage !== 'en') {
        try {
          const fieldsToTranslate = [
            result.overview,
            result.remedy,
            result.health?.text,
            result.wealth?.text,
            result.occupation?.text,
            result.family?.text,
            result.lucky_stats?.color,
            result.lucky_stats?.good_time,
            result.date,
          ];

          const translations = await Promise.all(
            fieldsToTranslate.map(text =>
              text ? translateText(text, currentLanguage) : null,
            ),
          );

          result = {
            ...result,
            overview: translations[0] || result.overview,
            remedy: translations[1] || result.remedy,
            health: result.health
              ? {
                  ...result.health,
                  text: translations[2] || result.health.text,
                }
              : result.health,
            wealth: result.wealth
              ? {
                  ...result.wealth,
                  text: translations[3] || result.wealth.text,
                }
              : result.wealth,
            occupation: result.occupation
              ? {
                  ...result.occupation,
                  text: translations[4] || result.occupation.text,
                }
              : result.occupation,
            family: result.family
              ? {
                  ...result.family,
                  text: translations[5] || result.family.text,
                }
              : result.family,
            lucky_stats: result.lucky_stats
              ? {
                  ...result.lucky_stats,
                  color: translations[6] || result.lucky_stats.color,
                  good_time: translations[7] || result.lucky_stats.good_time,
                }
              : result.lucky_stats,
            date: translations[8] || result.date,
          };
        } catch (error) {
          console.warn('Horoscope translation failed', error);
        }
      }

      if (result) {
        cacheRef.current.set(cacheKey, result);
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching horoscope details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signKey, currentLanguage]);

  const getZodiacIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'aries':
        return Images.ic_aries;
      case 'taurus':
        return Images.ic_taurus;
      case 'gemini':
        return Images.ic_gemini;
      case 'cancer':
        return Images.ic_cancer;
      case 'leo':
        return Images.ic_leo;
      case 'virgo':
        return Images.ic_virgo;
      case 'libra':
        return Images.ic_libra;
      case 'scorpio':
        return Images.ic_scorpio;
      case 'sagittarius':
        return Images.ic_sagittarius;
      case 'capricorn':
        return Images.ic_capricorn;
      case 'aquarius':
        return Images.ic_aquarius;
      case 'pisces':
        return Images.ic_pisces;
      default:
        return Images.ic_aries;
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <View style={styles.ratingBadge}>
        <View style={styles.ratingStarsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={13}
              color={star <= rating ? '#EAB308' : '#CBD5E1'}
              style={styles.starIcon}
            />
          ))}
        </View>
        <Text style={styles.ratingScoreText}>{rating}/5</Text>
      </View>
    );
  };

  const renderAspectCard = (
    title: string,
    aspectKey: 'health' | 'wealth' | 'occupation' | 'family',
    details?: HoroscopeDetailedStats,
  ) => {
    if (!details) return null;
    const config = ASPECT_CONFIGS[aspectKey];

    const iconContainerDynamic = {
      backgroundColor: config.badgeBg,
      borderColor: config.badgeBorder,
    };

    return (
      <View style={styles.aspectCard}>
        <View style={styles.aspectHeader}>
          <View style={styles.aspectHeaderLeft}>
            <View style={[styles.aspectIconBox, iconContainerDynamic]}>
              <Ionicons
                name={config.icon}
                size={18}
                color={config.themeColor}
              />
            </View>
            <Text style={styles.aspectTitle}>{title}</Text>
          </View>
          {renderRatingStars(details.rating)}
        </View>
        <Text style={styles.aspectText}>{details.text}</Text>
      </View>
    );
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('HoroscopeScreen');
    }
  };

  const containerDynamic = { paddingTop: inset.top };
  const scrollContentDynamic = {
    paddingBottom: Math.max(
      inset.bottom + verticalScale(20),
      verticalScale(32),
    ),
  };

  return (
    <View style={[styles.container, containerDynamic]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <CustomeLoader loading={loading} />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.headerGradient}
      />
      <UserCustomHeader
        title={signName || t('daily_horoscope')}
        showBackButton
        onBackPress={handleBackPress}
      />

      <View style={styles.sheetContainer}>
        {loading ? (
          <View style={styles.loadingContainer} />
        ) : (
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={[styles.scrollContent, scrollContentDynamic]}
            showsVerticalScrollIndicator={false}
          >
            {data ? (
              <View style={styles.contentWrapper}>
                {/* Hero Zodiac Banner */}
                <View style={styles.heroCard}>
                  <View style={styles.heroAvatarContainer}>
                    <View style={styles.zodiacImageWrapper}>
                      <Image
                        source={getZodiacIcon(signKey)}
                        style={styles.zodiacImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  <View style={styles.heroInfoContainer}>
                    <Text style={styles.heroSignName}>{signName}</Text>
                    {!!data.date && (
                      <View style={styles.datePill}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={COLORS.primary}
                          style={styles.datePillIcon}
                        />
                        <Text style={styles.datePillText}>{data.date}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Lucky Stats Metrics Grid */}
                {data.lucky_stats && (
                  <View style={styles.luckyMetricsRow}>
                    {/* Lucky Color */}
                    <View style={styles.luckyMetricCard}>
                      <View
                        style={[styles.metricIconCircle, styles.colorIconBg]}
                      >
                        <Ionicons
                          name="color-palette"
                          size={18}
                          color="#7C3AED"
                        />
                      </View>
                      <Text style={styles.metricLabel}>
                        {t('lucky_color') || 'Lucky Color'}
                      </Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {data.lucky_stats.color || '—'}
                      </Text>
                    </View>

                    {/* Lucky Number */}
                    <View style={styles.luckyMetricCard}>
                      <View
                        style={[styles.metricIconCircle, styles.numberIconBg]}
                      >
                        <Ionicons name="sparkles" size={17} color="#D97706" />
                      </View>
                      <Text style={styles.metricLabel}>
                        {t('lucky_number') || 'Lucky Number'}
                      </Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {data.lucky_stats.number ?? '—'}
                      </Text>
                    </View>

                    {/* Good Time */}
                    <View style={styles.luckyMetricCard}>
                      <View
                        style={[styles.metricIconCircle, styles.timeIconBg]}
                      >
                        <Ionicons name="time" size={17} color="#059669" />
                      </View>
                      <Text style={styles.metricLabel}>
                        {t('good_time') || 'Good Time'}
                      </Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {data.lucky_stats.good_time || '—'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Daily Overview Card */}
                {!!data.overview && (
                  <View style={styles.overviewCard}>
                    <View style={styles.cardSectionHeader}>
                      <View style={styles.overviewIconCircle}>
                        <Ionicons
                          name="sunny-outline"
                          size={17}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text style={styles.overviewTitle}>
                        {t('overview') || 'Daily Overview'}
                      </Text>
                    </View>
                    <Text style={styles.overviewText}>{data.overview}</Text>
                  </View>
                )}

                {/* Life Aspects Section */}
                <View style={styles.aspectsSection}>
                  <Text style={styles.sectionHeaderTitle}>
                    {t('predictions') || 'Detailed Predictions'}
                  </Text>
                  {renderAspectCard(
                    t('health') || 'Health & Vitality',
                    'health',
                    data.health,
                  )}
                  {renderAspectCard(
                    t('wealth') || 'Wealth & Finances',
                    'wealth',
                    data.wealth,
                  )}
                  {renderAspectCard(
                    t('occupation') || 'Career & Profession',
                    'occupation',
                    data.occupation,
                  )}
                  {renderAspectCard(
                    t('family') || 'Family & Relations',
                    'family',
                    data.family,
                  )}
                </View>

                {/* Sacred Remedy Card */}
                {!!data.remedy && (
                  <View style={styles.remedyCard}>
                    <View style={styles.remedyHeaderRow}>
                      <View style={styles.remedyIconCircle}>
                        <Ionicons
                          name="leaf-outline"
                          size={18}
                          color="#B45309"
                        />
                      </View>
                      <Text style={styles.remedyTitle}>
                        {t('remedy') || 'Daily Sacred Remedy'}
                      </Text>
                    </View>
                    <Text style={styles.remedyText}>{data.remedy}</Text>
                  </View>
                )}
              </View>
            ) : (
              !loading && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={48}
                    color="#94A3B8"
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorText}>
                    {t('unable_to_fetch_horoscope') ||
                      'Unable to fetch horoscope right now.'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={fetchData}
                    style={styles.retryButton}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={16}
                      color={COLORS.white}
                      style={styles.retryIcon}
                    />
                    <Text style={styles.retryButtonText}>
                      {t('retry') || 'Retry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default HoroscopeDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
    marginTop: verticalScale(6),
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
  },
  contentWrapper: {
    gap: verticalScale(14),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroAvatarContainer: {
    marginBottom: verticalScale(10),
  },
  zodiacImageWrapper: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#FFF7ED',
    borderWidth: 3,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  zodiacImage: {
    width: moderateScale(62),
    height: moderateScale(62),
  },
  heroInfoContainer: {
    alignItems: 'center',
  },
  heroSignName: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(20),
    color: '#0F172A',
    marginBottom: verticalScale(6),
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F1',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FFE0E3',
  },
  datePillIcon: {
    marginRight: scale(5),
  },
  datePillText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    color: COLORS.primary,
  },
  luckyMetricsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  luckyMetricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricIconCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(6),
  },
  colorIconBg: {
    backgroundColor: '#F5F3FF',
  },
  numberIconBg: {
    backgroundColor: '#FEF3C7',
  },
  timeIconBg: {
    backgroundColor: '#ECFDF5',
  },
  metricLabel: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(11),
    color: '#64748B',
    marginBottom: verticalScale(3),
    textAlign: 'center',
  },
  metricValue: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13),
    color: '#0F172A',
    textAlign: 'center',
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  overviewIconCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  overviewTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    color: '#0F172A',
  },
  overviewText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(14),
    color: '#334155',
    lineHeight: moderateScale(22),
  },
  aspectsSection: {
    gap: verticalScale(12),
  },
  sectionHeaderTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    marginHorizontal: scale(2),
    marginBottom: verticalScale(2),
  },
  aspectCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(15),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  aspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  aspectHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aspectIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  aspectTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(5),
  },
  starIcon: {
    marginRight: scale(1),
  },
  ratingScoreText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(11),
    color: '#475569',
  },
  aspectText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    color: '#475569',
    lineHeight: moderateScale(21),
  },
  remedyCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  remedyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  remedyIconCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  remedyTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: '#92400E',
  },
  remedyText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: '#78350F',
    lineHeight: moderateScale(21),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
    paddingHorizontal: scale(20),
  },
  errorIcon: {
    marginBottom: verticalScale(12),
  },
  errorText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
  },
  retryIcon: {
    marginRight: scale(6),
  },
  retryButtonText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: COLORS.white,
  },
});
