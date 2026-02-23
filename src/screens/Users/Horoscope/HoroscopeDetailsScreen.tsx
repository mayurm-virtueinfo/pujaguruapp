import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import {
  COLORS,
  COMMON_CARD_STYLE,
  COMMON_LIST_STYLE,
  THEMESHADOW,
} from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {
  HoroscopeResponse,
  HoroscopeDetailedStats,
  getDailyHoroscope,
} from '../../../api/apiService';
import { Images } from '../../../theme/Images';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomeLoader from '../../../components/CustomeLoader';
import { translateText } from '../../../utils/TranslateData';

import { StackNavigationProp } from '@react-navigation/stack';
import { moderateScale } from 'react-native-size-matters';

type HoroscopeDetailsRouteProp = RouteProp<
  UserProfileParamList,
  'HoroscopeDetailsScreen'
>;

type HoroscopeDetailsNavigationProp = StackNavigationProp<
  UserProfileParamList,
  'HoroscopeDetailsScreen'
>;

const HoroscopeDetailsScreen = () => {
  const route = useRoute<HoroscopeDetailsRouteProp>();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const { signKey, signName } = route.params;

  const [data, setData] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Map<string, HoroscopeResponse>>(new Map());

  useEffect(() => {
    fetchData();
  }, [signKey, currentLanguage]);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderRating = (rating: number) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={COLORS.primary}
          />
        ))}
      </View>
    );
  };

  const renderSection = (
    title: string,
    details: HoroscopeDetailedStats | undefined,
    icon: string,
  ) => {
    if (!details) return null;
    return (
      <View style={[styles.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons
              name={icon}
              size={24}
              color={COLORS.primary}
              style={styles.cardIcon}
            />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          {renderRating(details.rating)}
        </View>
        <Text style={styles.cardText}>{details.text}</Text>
      </View>
    );
  };

  const inset = useSafeAreaInsets();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('HoroscopeScreen');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <CustomeLoader loading={loading} />
      <UserCustomHeader
        title={signName}
        showBackButton
        onBackPress={handleBackPress}
      />
      <View style={styles.backgroundOverlay} />
      {loading ? (
        <View style={styles.loadingContainer} />
      ) : (
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={[
            styles.content,
            styles.scrollContentContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {data ? (
            <View style={styles.mainContent}>
              {/* Top Section */}
              <View style={styles.topSection}>
                <View style={styles.iconWrapper}>
                  <Image
                    source={getZodiacIcon(signKey)}
                    style={styles.zodiacImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.dateText}>{data.date}</Text>
              </View>

              {/* Overview Section */}
              <View style={styles.overviewCard}>
                <Text style={styles.sectionTitle}>{t('Overview')}</Text>
                <Text style={styles.overviewText}>{data.overview}</Text>
              </View>

              {/* Lucky Stats Section */}
              {data.lucky_stats && (
                <View style={styles.statsTable}>
                  <View style={[styles.tableRow, styles.tableRowDivider]}>
                    <View style={styles.tableLeft}>
                      <Ionicons
                        name="color-palette-outline"
                        size={18}
                        color={COLORS.primary}
                        style={styles.tableIcon}
                      />
                      <Text style={styles.tableLabel}>{t('lucky_color')}</Text>
                    </View>
                    <Text style={styles.tableValue}>
                      {data.lucky_stats.color}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowDivider]}>
                    <View style={styles.tableLeft}>
                      <Ionicons
                        name="dice-outline"
                        size={18}
                        color={COLORS.primary}
                        style={styles.tableIcon}
                      />
                      <Text style={styles.tableLabel}>{t('lucky_number')}</Text>
                    </View>
                    <Text style={styles.tableValue}>
                      {data.lucky_stats.number}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <View style={styles.tableLeft}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={COLORS.primary}
                        style={styles.tableIcon}
                      />
                      <Text style={styles.tableLabel}>{t('good_time')}</Text>
                    </View>
                    <Text style={styles.tableValue}>
                      {data.lucky_stats.good_time}
                    </Text>
                  </View>
                </View>
              )}
              {/* Health, Wealth, Occupation, Family Sections */}
              {renderSection(t('Health'), data.health, 'fitness-outline')}
              {renderSection(t('Wealth'), data.wealth, 'wallet-outline')}
              {renderSection(
                t('Occupation'),
                data.occupation,
                'briefcase-outline',
              )}
              {renderSection(t('Family'), data.family, 'home-outline')}

              {/* Remedy Section */}
              {data.remedy && (
                <View style={styles.remedyCard}>
                  <View style={styles.remedyHeader}>
                    <Ionicons
                      name="leaf-outline"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.remedyTitle}> {t('Remedy')}</Text>
                  </View>

                  <Text style={styles.remedyText}>{data.remedy}</Text>
                </View>
              )}
            </View>
          ) : (
            !loading && (
              <View style={styles.errorContainer}>
                <Text>Unable to fetch horoscope.</Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default HoroscopeDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    padding: moderateScale(24),
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
  },
  topSection: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  zodiacImage: {
    width: '100%',
    height: '100%',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  overviewCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(15),
    paddingVertical: moderateScale(14),
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: moderateScale(12),
  },
  overviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(15),
    paddingVertical: moderateScale(14),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: moderateScale(8),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsTable: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
    borderRadius: 15,
  },
  tableRow: {
    ...COMMON_CARD_STYLE,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableIcon: {
    marginRight: moderateScale(10),
  },
  tableLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  remedyCard: {
    ...COMMON_LIST_STYLE,
    paddingVertical: moderateScale(14),
    backgroundColor: COLORS.primary,
    borderRadius: moderateScale(15),
  },
  remedyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  remedyText: {
    fontSize: 14,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: '50%',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    zIndex: -1,
  },
  loadingContainer: {
    padding: 20,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  mainContent: {
    gap: 24,
  },
  tableRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});
