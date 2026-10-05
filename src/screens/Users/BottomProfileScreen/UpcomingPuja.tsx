import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getUpcomingPujas, PujaItem } from '../../../api/apiService';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { translateData } from '../../../utils/TranslateData';

const DEFAULT_PUJA_IMAGE =
  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';

type NavigationProp = StackNavigationProp<
  UserProfileParamList,
  'UpcomingPuja'
>;

const formatBookingDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
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
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

const getStatusBadge = (status?: string) => {
  const s = status?.toLowerCase() || 'accepted';
  if (s === 'accepted' || s === 'confirmed' || s === 'completed') {
    return {
      label: 'Confirmed',
      textColor: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      icon: 'checkmark-circle' as const,
    };
  }
  if (s === 'in_progress' || s === 'ongoing') {
    return {
      label: 'In Progress',
      textColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      icon: 'sync-circle' as const,
    };
  }
  return {
    label: s.charAt(0).toUpperCase() + s.slice(1),
    textColor: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: 'time' as const,
  };
};

const UpcomingPuja: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, PujaItem[]>>(new Map());

  const fetchUpcomingPujas = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }

        if (!isRefresh) {
          const cachedData = translationCacheRef.current.get(currentLanguage);
          if (cachedData) {
            setPujas(cachedData);
            setLoading(false);
            return;
          }
        }

        const response: any = await getUpcomingPujas();
        const dataArray: PujaItem[] = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        const translated: any = await translateData(
          dataArray,
          currentLanguage,
          ['pooja_name', 'when_is_pooja'],
        );

        const finalData = (translated as PujaItem[]) || dataArray || [];
        translationCacheRef.current.set(currentLanguage, finalData);
        setPujas(finalData);
      } catch (error) {
        console.error('Error fetching upcoming puja data:', error);
        setPujas([]);
      } finally {
        setLoading(false);
      }
    },
    [currentLanguage],
  );

  useEffect(() => {
    fetchUpcomingPujas();
  }, [fetchUpcomingPujas]);

  const onRefresh = async () => {
    setRefreshing(true);
    translationCacheRef.current.delete(currentLanguage);
    await fetchUpcomingPujas(true);
    setRefreshing(false);
  };

  const handleExplorePujas = () => {
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('UserPoojaListNavigator' as any);
        return;
      }
    } catch {}
    navigation.navigate('BottomUserProfileScreen');
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading && !refreshing} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader title={t('upcoming_puja')} showBackButton={true} />

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {pujas.length > 0 ? (
            <>
              {/* Header stats banner */}
              <View style={styles.listHeaderRow}>
                <View style={styles.listHeaderLeft}>
                  <Text style={styles.listHeaderTitle}>
                    {t('upcoming_pujas') || 'Upcoming Ceremonies'}
                  </Text>
                  <Text style={styles.listHeaderSubtitle}>
                    {t('view_upcoming_details_info') ||
                      'Review your booked rituals & preparation schedule'}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {pujas.length} {pujas.length === 1 ? 'Puja' : 'Pujas'}
                  </Text>
                </View>
              </View>

              {/* Cards List */}
              {pujas.map(puja => {
                const isToday =
                  puja.when_is_pooja?.trim().toLowerCase() === 'today';
                const statusConfig = getStatusBadge(puja.booking_status);
                const imageUrl =
                  imageErrors[puja.id] || !puja.pooja_image_url
                    ? DEFAULT_PUJA_IMAGE
                    : puja.pooja_image_url;

                return (
                  <TouchableOpacity
                    key={puja.id}
                    activeOpacity={0.88}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: String(puja.id),
                      })
                    }
                  >
                    {/* Top Row: Urgent/When Tag + Status Badge */}
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.timeBadge,
                          isToday
                            ? styles.todayBadge
                            : styles.normalTimeBadge,
                        ]}
                      >
                        <Ionicons
                          name={isToday ? 'flame' : 'calendar-outline'}
                          size={moderateScale(12)}
                          color={isToday ? '#D97706' : '#2563EB'}
                          style={styles.timeBadgeIcon}
                        />
                        <Text
                          style={[
                            styles.timeBadgeText,
                            isToday
                              ? styles.todayBadgeText
                              : styles.normalTimeBadgeText,
                          ]}
                        >
                          {puja.when_is_pooja ||
                            formatBookingDate(puja.booking_date)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusConfig.bgColor,
                            borderColor: statusConfig.borderColor,
                          },
                        ]}
                      >
                        <Ionicons
                          name={statusConfig.icon}
                          size={moderateScale(12)}
                          color={statusConfig.textColor}
                          style={styles.statusBadgeIcon}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusConfig.textColor },
                          ]}
                        >
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Row: Image + Puja Details */}
                    <View style={styles.cardMainRow}>
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.pujaImage}
                          resizeMode="cover"
                          onError={() => handleImageError(puja.id)}
                        />
                      </View>

                      <View style={styles.pujaDetails}>
                        <Text style={styles.pujaName} numberOfLines={1}>
                          {puja.pooja_name}
                        </Text>

                        {puja.muhurat_time ? (
                          <View style={styles.metaRow}>
                            <Ionicons
                              name="time-outline"
                              size={moderateScale(13)}
                              color="#64748B"
                              style={styles.metaIcon}
                            />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {puja.muhurat_time}
                            </Text>
                          </View>
                        ) : null}

                        <View style={styles.metaRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={moderateScale(13)}
                            color="#64748B"
                            style={styles.metaIcon}
                          />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {formatBookingDate(puja.booking_date) ||
                              puja.when_is_pooja}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Address Snippet */}
                    {puja.address ? (
                      <View style={styles.addressContainer}>
                        <Ionicons
                          name="location-sharp"
                          size={moderateScale(13)}
                          color={COLORS.primary}
                          style={styles.addressIcon}
                        />
                        <Text style={styles.addressText} numberOfLines={1}>
                          {puja.address}
                        </Text>
                      </View>
                    ) : null}

                    {/* Footer Action */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardFooterText}>
                        {t('view_details') || 'View Details'}
                      </Text>
                      <View style={styles.footerArrowButton}>
                        <Ionicons
                          name="chevron-forward"
                          size={moderateScale(14)}
                          color={COLORS.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            !loading && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="calendar-outline"
                    size={moderateScale(42)}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {t('no_upcoming_pujas') || 'No Upcoming Pujas'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {t('no_upcoming_pujas_desc') ||
                    'You have no scheduled pujas at the moment. Explore available ceremonies and invite blessings into your home.'}
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  activeOpacity={0.85}
                  onPress={handleExplorePujas}
                >
                  <Ionicons
                    name="flame"
                    size={moderateScale(16)}
                    color={COLORS.white}
                    style={styles.exploreButtonIcon}
                  />
                  <Text style={styles.exploreButtonText}>
                    {t('pooja_list') || 'Explore Pujas'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(110),
  },

  // List Header Row
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(16),
    paddingHorizontal: moderateScale(4),
  },
  listHeaderLeft: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  listHeaderTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(2),
  },
  listHeaderSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(14),
    alignSelf: 'center',
  },
  countBadgeText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#334155',
  },

  // Puja Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(15),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    // Shadow iOS
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    // Elevation Android
    elevation: 2.5,
  },

  // Top Row (Badges)
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  todayBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  normalTimeBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  timeBadgeIcon: {
    marginRight: moderateScale(4),
  },
  timeBadgeText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
  },
  todayBadgeText: {
    color: '#EA580C',
  },
  normalTimeBadgeText: {
    color: '#2563EB',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(3.5),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  statusBadgeIcon: {
    marginRight: moderateScale(4),
  },
  statusBadgeText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
  },

  // Middle Row
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: moderateScale(66),
    height: moderateScale(66),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pujaImage: {
    width: '100%',
    height: '100%',
  },
  pujaDetails: {
    flex: 1,
    marginLeft: moderateScale(14),
    justifyContent: 'center',
  },
  pujaName: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(5),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  metaIcon: {
    marginRight: moderateScale(5),
  },
  metaText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
    flex: 1,
  },

  // Address
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    marginTop: moderateScale(12),
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  addressIcon: {
    marginRight: moderateScale(6),
  },
  addressText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: moderateScale(12),
    paddingTop: moderateScale(10),
  },
  cardFooterText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  footerArrowButton: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: moderateScale(60),
    paddingHorizontal: moderateScale(24),
  },
  emptyIconCircle: {
    width: moderateScale(84),
    height: moderateScale(84),
    borderRadius: moderateScale(42),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(18),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(25),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreButtonIcon: {
    marginRight: moderateScale(6),
  },
  exploreButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
  },
});

export default UpcomingPuja;
