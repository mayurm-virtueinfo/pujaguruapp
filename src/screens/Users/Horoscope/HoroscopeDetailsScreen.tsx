import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
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

type HoroscopeDetailsRouteProp = RouteProp<
  UserProfileParamList,
  'HoroscopeDetailsScreen'
>;

const HoroscopeDetailsScreen = () => {
  const route = useRoute<HoroscopeDetailsRouteProp>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signKey, signName } = route.params;

  const [data, setData] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [signKey]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getDailyHoroscope(signKey);
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
      <View style={[styles.card, THEMESHADOW.shadow]}>
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
        onBackPress={() => navigation.goBack()}
      />
      {loading ? (
        <View style={[styles.content, { flex: 1 }]} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: inset.bottom + 20 },
          ]}
        >
          {data ? (
            <>
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

              <View style={[styles.overviewCard, THEMESHADOW.shadow]}>
                <Text style={styles.sectionTitle}>{t('Overview')}</Text>
                <Text style={styles.overviewText}>{data.overview}</Text>
              </View>

              {data.lucky_stats && (
                <View style={[styles.statsTable, THEMESHADOW.shadow]}>
                  <View
                    style={[
                      styles.tableRow,
                      { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
                    ]}
                  >
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
                  <View
                    style={[
                      styles.tableRow,
                      { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
                    ]}
                  >
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
              {renderSection(t('Health'), data.health, 'fitness-outline')}
              {renderSection(t('Wealth'), data.wealth, 'wallet-outline')}
              {renderSection(
                t('Occupation'),
                data.occupation,
                'briefcase-outline',
              )}
              {renderSection(t('Family'), data.family, 'home-outline')}

              {data.remedy && (
                <View style={[styles.remedyCard, THEMESHADOW.shadow]}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
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
            </>
          ) : (
            !loading && (
              <View style={styles.errorContainer}>
                <Text>Unable to fetch horoscope.</Text>
              </View>
            )
          )}
          <View style={{ height: 40 }} />
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
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  zodiacImage: {
    width: '100%',
    height: '100%',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  overviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 8,
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
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  tableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableIcon: {
    marginRight: 10,
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
    marginLeft: 20,
  },
  remedyCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
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
});
