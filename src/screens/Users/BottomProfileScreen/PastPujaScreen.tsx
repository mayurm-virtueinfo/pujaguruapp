import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getPastBookings } from '../../../api/apiService';
import { COLORS } from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import Fonts from '../../../theme/fonts';
import CustomeLoader from '../../../components/CustomeLoader';
import { translateData } from '../../../utils/TranslateData';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

const DEFAULT_PUJA_IMAGE =
  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';

type PastBookingType = {
  id: number;
  pooja_name: string;
  pooja_image_url?: string;
  booking_status: string;
  booking_date: string;
  muhurat_time?: string;
  muhurat_type?: string;
  amount?: string | number;
  tirth_place_name?: string;
  address?: string;
  location_display?: string;
  assigned_pandit?: {
    pandit_name?: string;
    profile_img_url?: string;
    phone?: string;
  };
};

type FilterType = 'all' | 'completed' | 'cancelled';

type ScreenNavigationProps = StackNavigationProp<
  UserProfileParamList,
  'PastBookingDetailsScreen'
>;

const PastPujaScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProps>();
  const insets = useSafeAreaInsets();

  const [pastBookings, setPastBookings] = useState<PastBookingType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, PastBookingType[]>>(new Map());

  const fetchPastBookings = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }

        if (!isRefresh) {
          const cachedData = translationCacheRef.current.get(currentLanguage);
          if (cachedData) {
            setPastBookings(cachedData);
            setLoading(false);
            return;
          }
        }

        const response: any = await getPastBookings();
        const dataArray = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        if (dataArray && dataArray.length > 0) {
          const translated: any = await translateData(
            dataArray,
            currentLanguage,
            ['pooja_name', 'booking_status'],
          );
          const finalData = translated || dataArray;
          translationCacheRef.current.set(currentLanguage, finalData);
          setPastBookings(finalData);
        } else {
          setPastBookings([]);
        }
      } catch (error) {
        console.error('Error fetching past bookings:', error);
        setPastBookings([]);
      } finally {
        setLoading(false);
      }
    },
    [currentLanguage],
  );

  useEffect(() => {
    fetchPastBookings();
  }, [fetchPastBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    translationCacheRef.current.delete(currentLanguage);
    await fetchPastBookings(true);
    setRefreshing(false);
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleExplorePujas = () => {
    try {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('UserPoojaListNavigator' as any);
        return;
      }
    } catch {}
    navigation.navigate('BottomUserProfileScreen' as any);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
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
          const suffix =
            day === 1 || day === 21 || day === 31
              ? 'st'
              : day === 2 || day === 22
              ? 'nd'
              : day === 3 || day === 23
              ? 'rd'
              : 'th';
          return `${day}${suffix} ${months[monthIndex]} ${year}`;
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      const suffix =
        day === 1 || day === 21 || day === 31
          ? 'st'
          : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
          ? 'rd'
          : 'th';
      return `${day}${suffix} ${month} ${year}`;
    } catch {
      return dateString || '';
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('complete') || s.includes('success')) {
      return {
        label: t('completed') || 'Completed',
        textColor: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        icon: 'checkmark-circle' as const,
      };
    }
    if (s.includes('cancel')) {
      return {
        label: t('cancelled') || 'Cancelled',
        textColor: '#DC2626',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        icon: 'close-circle' as const,
      };
    }
    if (s.includes('reject')) {
      return {
        label: t('rejected') || 'Rejected',
        textColor: '#DC2626',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        icon: 'alert-circle' as const,
      };
    }
    if (s.includes('pending') || s.includes('panding')) {
      return {
        label: t('pending') || 'Pending',
        textColor: '#D97706',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        icon: 'time' as const,
      };
    }
    return {
      label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Past',
      textColor: '#475569',
      bgColor: '#F1F5F9',
      borderColor: '#E2E8F0',
      icon: 'bookmark' as const,
    };
  };

  const counts = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    pastBookings.forEach(item => {
      const s = item.booking_status?.toLowerCase() || '';
      if (s.includes('complete') || s.includes('success')) {
        completed++;
      } else if (s.includes('cancel') || s.includes('reject')) {
        cancelled++;
      }
    });
    return {
      all: pastBookings.length,
      completed,
      cancelled,
    };
  }, [pastBookings]);

  const filteredBookings = useMemo(() => {
    return pastBookings.filter(item => {
      const s = item.booking_status?.toLowerCase() || '';
      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'completed' &&
          (s.includes('complete') || s.includes('success'))) ||
        (selectedFilter === 'cancelled' &&
          (s.includes('cancel') || s.includes('reject')));

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const nameMatch = item.pooja_name?.toLowerCase().includes(q);
      const panditMatch = item.assigned_pandit?.pandit_name
        ?.toLowerCase()
        .includes(q);
      const dateMatch = item.booking_date?.toLowerCase().includes(q);

      return nameMatch || panditMatch || dateMatch;
    });
  }, [pastBookings, selectedFilter, searchQuery]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading && !refreshing} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader title={t('past_bookings')} showBackButton={true} />

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
          {pastBookings.length > 0 ? (
            <>
              {/* Header stats banner */}
              <View style={styles.listHeaderRow}>
                <View style={styles.listHeaderLeft}>
                  <Text style={styles.listHeaderTitle}>
                    {t('past_bookings') || 'Past Ceremonies'}
                  </Text>
                  <Text style={styles.listHeaderSubtitle}>
                    {t('view_past_details_info') ||
                      'Review your completed rituals & ceremony history'}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {pastBookings.length}{' '}
                    {pastBookings.length === 1 ? 'Puja' : 'Pujas'}
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search-outline"
                  size={moderateScale(18)}
                  color="#94A3B8"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={
                    t('search_puja') || 'Search ceremony or pandit...'
                  }
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={moderateScale(18)}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    selectedFilter === 'all' && styles.filterTabActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === 'all' && styles.filterTabTextActive,
                    ]}
                  >
                    {t('all') || 'All'}
                  </Text>
                  <View
                    style={[
                      styles.filterTabBadge,
                      selectedFilter === 'all' && styles.filterTabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabBadgeText,
                        selectedFilter === 'all' &&
                          styles.filterTabBadgeTextActive,
                      ]}
                    >
                      {counts.all}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    selectedFilter === 'completed' && styles.filterTabActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter('completed')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === 'completed' &&
                        styles.filterTabTextActive,
                    ]}
                  >
                    {t('completed') || 'Completed'}
                  </Text>
                  <View
                    style={[
                      styles.filterTabBadge,
                      selectedFilter === 'completed' &&
                        styles.filterTabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabBadgeText,
                        selectedFilter === 'completed' &&
                          styles.filterTabBadgeTextActive,
                      ]}
                    >
                      {counts.completed}
                    </Text>
                  </View>
                </TouchableOpacity>

                {counts.cancelled > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.filterTab,
                      selectedFilter === 'cancelled' && styles.filterTabActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedFilter('cancelled')}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        selectedFilter === 'cancelled' &&
                          styles.filterTabTextActive,
                      ]}
                    >
                      {t('cancelled') || 'Cancelled'}
                    </Text>
                    <View
                      style={[
                        styles.filterTabBadge,
                        selectedFilter === 'cancelled' &&
                          styles.filterTabBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabBadgeText,
                          selectedFilter === 'cancelled' &&
                            styles.filterTabBadgeTextActive,
                        ]}
                      >
                        {counts.cancelled}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Cards List */}
              {filteredBookings.length > 0 ? (
                filteredBookings.map((item, index) => {
                  const statusConfig = getStatusBadge(item.booking_status);
                  const imageUrl =
                    imageErrors[item.id] || !item.pooja_image_url
                      ? DEFAULT_PUJA_IMAGE
                      : item.pooja_image_url;

                  return (
                    <TouchableOpacity
                      key={`${item.id}-${index}`}
                      style={styles.card}
                      activeOpacity={0.88}
                      onPress={() => {
                        navigation.navigate('PastBookingDetailsScreen', {
                          pujaId: item.id,
                        });
                      }}
                    >
                      {/* Top Row: Date Pill & Status Badge */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.datePill}>
                          <Ionicons
                            name="calendar-outline"
                            size={moderateScale(12)}
                            color="#475569"
                            style={styles.datePillIcon}
                          />
                          <Text style={styles.datePillText}>
                            {formatDate(item.booking_date)}
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

                      {/* Main Row: Thumbnail + Info */}
                      <View style={styles.cardMainRow}>
                        <View style={styles.imageWrapper}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.pujaImage}
                            resizeMode="cover"
                            onError={() => handleImageError(item.id)}
                          />
                        </View>

                        <View style={styles.pujaDetails}>
                          <Text style={styles.pujaName} numberOfLines={1}>
                            {item.pooja_name}
                          </Text>

                          {item.assigned_pandit?.pandit_name ? (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="person-outline"
                                size={moderateScale(12.5)}
                                color="#64748B"
                                style={styles.metaIcon}
                              />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {item.assigned_pandit.pandit_name}
                              </Text>
                            </View>
                          ) : null}

                          {item.muhurat_time ? (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="time-outline"
                                size={moderateScale(12.5)}
                                color="#64748B"
                                style={styles.metaIcon}
                              />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {item.muhurat_time}
                              </Text>
                            </View>
                          ) : null}

                          {item.tirth_place_name || item.address ? (
                            <View style={styles.metaRow}>
                              <Ionicons
                                name="location-outline"
                                size={moderateScale(12.5)}
                                color="#64748B"
                                style={styles.metaIcon}
                              />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {item.tirth_place_name || item.address}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Footer Row */}
                      <View style={styles.cardFooter}>
                        <View style={styles.footerLeft}>
                          {item.amount ? (
                            <View style={styles.amountBadge}>
                              <Text style={styles.amountLabel}>
                                {t('dakshina') || 'Dakshina'}:
                              </Text>
                              <Text style={styles.amountValue}>
                                {' '}
                                ₹{item.amount}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.bookingIdText}>
                              ID: #{item.id}
                            </Text>
                          )}
                        </View>

                        <View style={styles.viewDetailsButton}>
                          <Text style={styles.viewDetailsText}>
                            {t('view_details') || 'View Details'}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={moderateScale(14)}
                            color={COLORS.primary}
                            style={styles.arrowIcon}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                /* Filtered empty state */
                <View style={styles.filterEmptyContainer}>
                  <View style={styles.filterEmptyIconCircle}>
                    <Ionicons
                      name="search-outline"
                      size={moderateScale(32)}
                      color="#94A3B8"
                    />
                  </View>
                  <Text style={styles.filterEmptyTitle}>
                    {t('no_matching_bookings') || 'No Bookings Found'}
                  </Text>
                  <Text style={styles.filterEmptySubtitle}>
                    {searchQuery.trim()
                      ? `No ceremonies match "${searchQuery}"`
                      : 'No past ceremonies found in this category'}
                  </Text>
                  <TouchableOpacity
                    style={styles.resetFilterButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.resetFilterText}>
                      {t('clear_filter') || 'Reset Filters'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
                  {t('no_item_available') || 'No Past Bookings'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {t('no_past_pujas_desc') ||
                    'You have not completed any pujas yet. Explore available ceremonies and invite auspicious blessings into your life.'}
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
    paddingBottom: moderateScale(40),
  },

  // Header Banner
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(14),
    paddingHorizontal: moderateScale(4),
  },
  listHeaderLeft: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  listHeaderTitle: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(2),
  },
  listHeaderSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    lineHeight: moderateScale(16),
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

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(Platform.OS === 'ios' ? 9 : 3),
    marginBottom: moderateScale(14),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#0F172A',
    padding: 0,
  },

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    gap: moderateScale(8),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6.5),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#64748B',
    marginRight: moderateScale(6),
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(1.5),
    borderRadius: moderateScale(10),
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterTabBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#64748B',
  },
  filterTabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Puja Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(15),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2.5,
  },

  // Card Top Row
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePillIcon: {
    marginRight: moderateScale(5),
  },
  datePillText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#334155',
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

  // Card Main Row
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
    marginBottom: moderateScale(4),
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
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
    flex: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(13),
    paddingTop: moderateScale(11),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLeft: {
    flex: 1,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  amountValue: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  bookingIdText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#94A3B8',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
    paddingLeft: moderateScale(8),
  },
  viewDetailsText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    marginRight: moderateScale(2),
  },
  arrowIcon: {
    marginTop: moderateScale(1),
  },

  // Filter Empty State
  filterEmptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: moderateScale(20),
  },
  filterEmptyIconCircle: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  filterEmptyTitle: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(4),
  },
  filterEmptySubtitle: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  resetFilterButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  resetFilterText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#334155',
  },

  // Full Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
    paddingHorizontal: moderateScale(24),
  },
  emptyIconCircle: {
    width: moderateScale(84),
    height: moderateScale(84),
    borderRadius: moderateScale(42),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(18),
  },
  emptyTitle: {
    fontSize: moderateScale(17),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
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
    elevation: 4,
  },
  exploreButtonIcon: {
    marginRight: moderateScale(8),
  },
  exploreButtonText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
  },
});

export default PastPujaScreen;
