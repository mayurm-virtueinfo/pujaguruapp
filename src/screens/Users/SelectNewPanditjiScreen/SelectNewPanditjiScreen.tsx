import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import AppConstant from '../../../utils/appConstant';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import {
  getNewPanditji,
  postNewPanditOffer,
  updateWaitingUser,
} from '../../../api/apiService';

interface PanditPricing {
  price_with_samagri?: string;
  price_without_samagri?: string;
  price_status?: string;
}

interface PanditjiRawItem {
  pandit_id: number | string;
  name: string;
  profile_image: string | null;
  pandit_address?: string;
  city?: string;
  distance_km?: number;
  languages?: string[];
  pricing?: PanditPricing;
}

interface PanditjiItem {
  id: string | number;
  pandit_id: string | number;
  name: string;
  image: string | null;
  city: string;
  address?: string;
  distance_km?: number;
  languages: string;
  pricing?: PanditPricing;
  isVerified?: boolean;
}

interface PanditjiResponse {
  success: boolean;
  message?: string;
  count?: number;
  pandits: PanditjiRawItem[];
}

const SelectNewPanditjiScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const route = useRoute();
  const { booking_id } = route.params as { booking_id: string | number };
  const navigation = useNavigation<StackNavigationProp<UserHomeParamList>>();

  const [searchText, setSearchText] = useState('');
  const [panditjiData, setPanditjiData] = useState<PanditjiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPanditId, setSelectedPanditId] = useState<
    string | number | null
  >(null);
  const [noPanditModalVisible, setNoPanditModalVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<
    Record<string | number, boolean>
  >({});

  const { showErrorToast, showSuccessToast } = useCommonToast();

  const fetchAllPanditji = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const locationStr = await AsyncStorage.getItem(AppConstant.LOCATION);
        let latitude = '';
        let longitude = '';
        if (locationStr) {
          try {
            const locObj = JSON.parse(locationStr);
            latitude = locObj.latitude || '';
            longitude = locObj.longitude || '';
          } catch (e) {
            console.log(
              'Error parsing location in SelectNewPanditjiScreen:',
              e,
            );
          }
        }

        const response = (await getNewPanditji(
          String(booking_id),
          latitude,
          longitude,
        )) as PanditjiResponse;

        if (response && response.success) {
          if (!response.pandits || response.pandits.length === 0) {
            setPanditjiData([]);
            setNoPanditModalVisible(true);
            return;
          }

          const mapped: PanditjiItem[] = response.pandits.map(item => ({
            id: item.pandit_id,
            pandit_id: item.pandit_id,
            name: item.name || 'Panditji',
            image: item.profile_image || null,
            city: item.city || '',
            address: item.pandit_address || '',
            distance_km: item.distance_km,
            languages: Array.isArray(item.languages)
              ? item.languages.join(', ')
              : '',
            pricing: item.pricing,
            isVerified: true,
          }));

          setPanditjiData(mapped);
        } else {
          showErrorToast(response?.message || 'Failed to fetch Panditji list');
        }
      } catch (error: any) {
        showErrorToast(error?.message || 'Failed to fetch Panditji list');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [booking_id, showErrorToast],
  );

  useEffect(() => {
    fetchAllPanditji();
    // Fetch only on mount or when booking_id changes
  }, [booking_id]);

  const onRefresh = useCallback(() => {
    fetchAllPanditji(true);
  }, [fetchAllPanditji]);

  // Client-side search filtering across Name, City, and Languages
  const filteredPandits = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return panditjiData;
    }
    return panditjiData.filter(item => {
      const matchName = (item.name || '').toLowerCase().includes(query);
      const matchCity = (item.city || '').toLowerCase().includes(query);
      const matchLang = (item.languages || '').toLowerCase().includes(query);
      return matchName || matchCity || matchLang;
    });
  }, [panditjiData, searchText]);

  const handlePanditjiSelect = (id: string | number) => {
    setSelectedPanditId(prev => (prev === id ? null : id));
  };

  const handleViewPanditProfile = (panditId: string | number) => {
    navigation.navigate('PanditDetailsScreen', {
      panditId: String(panditId),
      id: String(panditId),
    });
  };

  const handlePostPanditOffer = async () => {
    if (!selectedPanditId) {
      showErrorToast(t('please_select_panditji') || 'Please select a Panditji');
      return;
    }
    setIsLoading(true);
    try {
      const data = {
        booking_id: booking_id,
        pandit_id: selectedPanditId,
      };
      const response = await postNewPanditOffer(data);
      if (response && response.success) {
        showSuccessToast(
          response.message ||
            t('panditji_selected_successfully') ||
            'Panditji selected successfully',
        );
        navigation.replace('UserHomeScreen');
      } else {
        showErrorToast(
          response?.message ||
            t('something_went_wrong') ||
            'Something went wrong',
        );
      }
    } catch (error: any) {
      showErrorToast(
        error?.message || t('something_went_wrong') || 'Something went wrong',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToHome = async () => {
    try {
      setIsLoading(true);
      setNoPanditModalVisible(false);
      const response = await updateWaitingUser(booking_id);
      if (response && response.success) {
        showSuccessToast(response.message || 'Request submitted successfully');
      }
    } catch (error: any) {
      console.error('Error invoking updateWaitingUser:', error);
    } finally {
      setIsLoading(false);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'UserHomeScreen' }],
        }),
      );
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('UserHomeScreen');
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return 'PG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderSearchInput = () => (
    <View style={styles.searchCard}>
      <Ionicons
        name="search-outline"
        size={moderateScale(19)}
        color="#94A3B8"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={t('search_panditji', {
          defaultValue: 'Search Panditji by name or city...',
        })}
        placeholderTextColor="#94A3B8"
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        autoCorrect={false}
      />
      {searchText.trim().length > 0 && (
        <TouchableOpacity
          onPress={() => setSearchText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearSearchBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={moderateScale(18)}
            color="#94A3B8"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPanditjiItem = ({ item }: { item: PanditjiItem }) => {
    const isSelected = selectedPanditId === item.pandit_id;
    const hasImage = item.image && !imageErrors[item.id];
    const priceWithSamagri = item.pricing?.price_with_samagri;
    const priceWithoutSamagri = item.pricing?.price_without_samagri;
    const displayPrice = priceWithSamagri || priceWithoutSamagri;

    return (
      <TouchableOpacity
        style={[styles.panditCard, isSelected && styles.panditCardSelected]}
        onPress={() => handlePanditjiSelect(item.pandit_id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderRow}>
          {/* Avatar Container */}
          <View style={styles.avatarWrapper}>
            {hasImage ? (
              <Image
                source={{ uri: item.image as string }}
                style={styles.avatarImage}
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [item.id]: true }));
                }}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {getInitials(item.name)}
                </Text>
              </View>
            )}

            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons
                  name="verified"
                  size={moderateScale(15)}
                  color="#15803D"
                />
              </View>
            )}
          </View>

          {/* Details Column */}
          <View style={styles.detailsCol}>
            <View style={styles.nameRow}>
              <Text style={styles.panditName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            {/* Location */}
            {item.city ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={moderateScale(13)}
                  color={COLORS.primary}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.city}
                  {item.address ? ` • ${item.address}` : ''}
                </Text>
              </View>
            ) : null}

            {/* Languages */}
            {item.languages ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={moderateScale(12.5)}
                  color="#64748B"
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.languages}
                </Text>
              </View>
            ) : null}

            {/* Pricing info if available */}
            {displayPrice ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {t('estimated_dakshina', { defaultValue: 'Dakshina' })}:
                </Text>
                <Text style={styles.priceValue}>
                  ₹{' '}
                  {parseFloat(displayPrice).toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Radio Selection Icon */}
          <View style={styles.selectionCol}>
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(26)}
                color={COLORS.primary}
              />
            ) : (
              <Ionicons
                name="ellipse-outline"
                size={moderateScale(26)}
                color="#CBD5E1"
              />
            )}
          </View>
        </View>

        {/* Card Footer: View Profile link */}
        <View style={styles.cardFooterDivider} />
        <View style={styles.cardFooterRow}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => handleViewPanditProfile(item.pandit_id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={moderateScale(13)}
              color="#64748B"
            />
            <Text style={styles.viewProfileBtnText}>
              {t('view_profile', { defaultValue: 'View Profile & Reviews' })}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(13)}
              color="#64748B"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardSelectTag,
              isSelected && styles.cardSelectTagActive,
            ]}
            onPress={() => handlePanditjiSelect(item.pandit_id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cardSelectTagText,
                isSelected && styles.cardSelectTagTextActive,
              ]}
            >
              {isSelected
                ? t('selected', { defaultValue: 'Selected' })
                : t('tap_to_select', { defaultValue: 'Select' })}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name="search-outline"
          size={moderateScale(36)}
          color="#94A3B8"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {searchText.trim()
          ? t('no_matching_panditji', { defaultValue: 'No Matching Panditji' })
          : t('no_panditji_found', { defaultValue: 'No Panditji Available' })}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchText.trim()
          ? t('try_different_search', {
              defaultValue: 'Try searching with another name or city',
            })
          : t('no_pandit_available_sub', {
              defaultValue:
                'Currently no other Guruji is available for this location.',
            })}
      </Text>
      {searchText.trim().length > 0 && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setSearchText('')}
          activeOpacity={0.7}
        >
          <Text style={styles.clearFilterText}>
            {t('clear_search', { defaultValue: 'Clear Search' })}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNoPanditModal = () => (
    <Modal
      visible={noPanditModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalIconWrapper}>
            <Ionicons
              name="checkmark-done-circle"
              size={moderateScale(54)}
              color="#D97706"
            />
          </View>
          <Text style={styles.modalTitle}>
            {t('request_received', { defaultValue: 'Request Received!' })}
          </Text>
          <Text style={styles.modalMessage}>
            {t('admin_assign_msg', {
              defaultValue:
                "We couldn't match a Panditji in this area instantly, but don't worry! Our admin team will review your request and assign the best Panditji for you very soon.",
            })}
          </Text>
          <PrimaryButton
            title={t('ok', { defaultValue: 'Return to Home' })}
            onPress={handleNavigateToHome}
            style={styles.modalButton}
            textStyle={styles.modalButtonText}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.screenContainer}>
      <CustomeLoader loading={isLoading && !refreshing} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />

      {/* Red Header Wrapper with Curve Extension */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <UserCustomHeader
          title={t('select_panditji', { defaultValue: 'Select Panditji' })}
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <View style={styles.headerCurveExtension} />
      </View>

      {/* Main Sheet Container */}
      <View style={styles.sheetContainer}>
        {/* Search Bar */}
        {renderSearchInput()}

        {/* Info / Count Bar */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {t('available_gurujis', { defaultValue: 'Available Gurujis' })}{' '}
            <Text style={styles.sectionCountBadge}>
              ({filteredPandits.length})
            </Text>
          </Text>
          <View style={styles.bookingIdChip}>
            <Text style={styles.bookingIdChipText}>
              {t('booking_id', { defaultValue: 'Booking' })} #{booking_id}
            </Text>
          </View>
        </View>

        {/* Pandit List */}
        <FlatList
          data={filteredPandits}
          renderItem={renderPanditjiItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      </View>

      {/* Fixed Bottom Action Dock */}
      <View style={styles.bottomDock}>
        <PrimaryButton
          title={
            selectedPanditId
              ? t('confirm_panditji', {
                  defaultValue: 'Confirm & Request Panditji',
                })
              : t('select_panditji_prompt', {
                  defaultValue: 'Select a Panditji to Proceed',
                })
          }
          onPress={handlePostPanditOffer}
          disabled={!selectedPanditId || isLoading}
          style={StyleSheet.flatten([
            styles.actionButton,
            !selectedPanditId && styles.actionButtonDisabled,
          ])}
          textStyle={StyleSheet.flatten([
            styles.actionButtonText,
            !selectedPanditId && styles.actionButtonTextDisabled,
          ])}
        />
      </View>

      {renderNoPanditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerWrapper: {
    backgroundColor: COLORS.primaryBackground,
  },
  headerCurveExtension: {
    height: moderateScale(22),
    backgroundColor: COLORS.primaryBackground,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    marginTop: -moderateScale(22),
    overflow: 'hidden',
  },

  // Search Card
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(14),
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#1E293B',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: moderateScale(4),
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(18),
    marginBottom: moderateScale(10),
    marginTop: moderateScale(4),
  },
  sectionTitle: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  sectionCountBadge: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  bookingIdChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  bookingIdChipText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },

  // List Content
  listContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(20),
    gap: moderateScale(12),
  },

  // Pandit Card
  panditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  panditCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBFB',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
    marginRight: moderateScale(12),
  },
  avatarImage: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: '#D97706',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -moderateScale(2),
    bottom: -moderateScale(2),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(9),
    padding: moderateScale(1),
    borderWidth: 1,
    borderColor: '#DCFCE7',
    elevation: 2,
  },

  // Details Column
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(3),
  },
  panditName: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    flexShrink: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(2),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  distanceBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#2563EB',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  metaIcon: {
    marginRight: moderateScale(4),
  },
  metaText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    marginTop: moderateScale(4),
  },
  priceLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  priceValue: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },

  // Selection Column
  selectionCol: {
    paddingLeft: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card Footer
  cardFooterDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(10),
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: moderateScale(2),
  },
  viewProfileBtnText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  cardSelectTag: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    backgroundColor: '#F1F5F9',
  },
  cardSelectTagActive: {
    backgroundColor: '#FEE2E2',
  },
  cardSelectTagText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#475569',
  },
  cardSelectTagTextActive: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(50),
    paddingHorizontal: moderateScale(20),
  },
  emptyIconCircle: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
    marginBottom: moderateScale(14),
  },
  clearFilterButton: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  clearFilterText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },

  // Fixed Bottom Dock
  bottomDock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  actionButton: {
    borderRadius: moderateScale(12),
    height: moderateScale(48),
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
  },
  actionButtonTextDisabled: {
    color: '#94A3B8',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(22),
    padding: moderateScale(22),
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconWrapper: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  modalTitle: {
    fontSize: moderateScale(19),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  modalMessage: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  modalButton: {
    width: '100%',
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    marginTop: 0,
  },
  modalButtonText: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
  },
});

export default SelectNewPanditjiScreen;
