import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import CustomModal from '../../../components/CustomModal';
import { getAddress, deleteAddress } from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import { translateData } from '../../../utils/TranslateData';

export interface Address {
  id: number;
  name: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  phone_number: string;
  city: number;
  city_name?: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

type AddressFilterType = 'all' | 'home' | 'office' | 'other';

const AddressesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showSuccessToast, showErrorToast } = useCommonToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [originalAddresses, setOriginalAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<AddressFilterType>('all');

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, Address[]>>(new Map());

  const showErrorToastRef = useRef(showErrorToast);
  const showSuccessToastRef = useRef(showSuccessToast);
  useEffect(() => {
    showErrorToastRef.current = showErrorToast;
    showSuccessToastRef.current = showSuccessToast;
  });

  const fetchAddressData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);

        const cachedData = translationCacheRef.current.get(currentLanguage);
        if (cachedData && !isRefresh) {
          setAddresses(cachedData);
          setLoading(false);
          return;
        }

        const response: any = await getAddress();
        if (response?.data && Array.isArray(response.data)) {
          setOriginalAddresses(response.data);

          const translated: any = await translateData(
            response.data,
            currentLanguage,
            [
              'address_type',
              'address_line1',
              'address_line2',
              'city',
              'state',
              'name',
            ],
          );
          const finalData = translated || response.data || [];
          translationCacheRef.current.set(currentLanguage, finalData);
          setAddresses(finalData);
        } else {
          setAddresses([]);
          setOriginalAddresses([]);
        }
      } catch {
        setAddresses([]);
        setOriginalAddresses([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentLanguage],
  );

  useEffect(() => {
    fetchAddressData();
  }, [fetchAddressData]);

  useFocusEffect(
    useCallback(() => {
      translationCacheRef.current.delete(currentLanguage);
      fetchAddressData();
    }, [fetchAddressData, currentLanguage]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    translationCacheRef.current.delete(currentLanguage);
    await fetchAddressData(true);
  }, [fetchAddressData, currentLanguage]);

  // Counts for filter pills
  const typeCounts = useMemo(() => {
    let home = 0;
    let office = 0;
    let other = 0;

    addresses.forEach(addr => {
      const type = (addr.address_type || '').toLowerCase();
      if (type.includes('home')) home++;
      else if (type.includes('office') || type.includes('work')) office++;
      else other++;
    });

    return { home, office, other };
  }, [addresses]);

  // Filtered & searched addresses
  const filteredAddresses = useMemo(() => {
    return addresses.filter(addr => {
      const type = (addr.address_type || '').toLowerCase();
      if (activeFilter === 'home' && !type.includes('home')) return false;
      if (
        activeFilter === 'office' &&
        !type.includes('office') &&
        !type.includes('work')
      )
        return false;
      if (
        activeFilter === 'other' &&
        (type.includes('home') ||
          type.includes('office') ||
          type.includes('work'))
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (addr.name || '').toLowerCase();
        const line1 = (addr.address_line1 || '').toLowerCase();
        const line2 = (addr.address_line2 || '').toLowerCase();
        const city = (addr.city_name || '').toLowerCase();
        const state = (addr.state || '').toLowerCase();
        const pin = (addr.pincode || '').toLowerCase();
        const phone = (addr.phone_number || '').toLowerCase();

        return (
          name.includes(q) ||
          line1.includes(q) ||
          line2.includes(q) ||
          city.includes(q) ||
          state.includes(q) ||
          pin.includes(q) ||
          phone.includes(q)
        );
      }
      return true;
    });
  }, [addresses, activeFilter, searchQuery]);

  const handleEdit = (address: Address) => {
    const original =
      originalAddresses.find(a => a.id === address.id) || address;
    navigation.navigate('AddAddressScreen', {
      addressToEdit: original,
    });
  };

  const handleDeletePress = (address: Address) => {
    const original =
      originalAddresses.find(a => a.id === address.id) || address;
    setSelectedAddress(original);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedAddress) return;
    setDeleteModalVisible(false);
    setLoading(true);
    try {
      await deleteAddress({ id: selectedAddress.id });
      translationCacheRef.current.delete(currentLanguage);
      await fetchAddressData();
      showSuccessToastRef.current(
        t('address_deleted_successfully') || 'Address deleted successfully',
      );
    } catch {
      showErrorToastRef.current(
        t('failed_to_delete_address') || 'Failed to delete address',
      );
    } finally {
      setLoading(false);
      setSelectedAddress(null);
    }
  };

  const getAddressIconConfig = (type?: string) => {
    const norm = (type || '').toLowerCase();
    if (norm.includes('home')) {
      return {
        icon: 'home' as const,
        color: '#DC2626',
        bgColor: '#FEE2E2',
        badgeBg: '#FEF2F2',
        badgeBorder: '#FECACA',
        badgeText: '#B91C1C',
      };
    }
    if (norm.includes('office') || norm.includes('work')) {
      return {
        icon: 'business' as const,
        color: '#0284C7',
        bgColor: '#E0F2FE',
        badgeBg: '#F0F9FF',
        badgeBorder: '#BAE6FD',
        badgeText: '#0369A1',
      };
    }
    return {
      icon: 'location' as const,
      color: '#EA580C',
      bgColor: '#FFEDD5',
      badgeBg: '#FFF7ED',
      badgeBorder: '#FED7AA',
      badgeText: '#C2410C',
    };
  };

  const formatAddressString = (addr: Address) => {
    return [
      addr.address_line1,
      addr.address_line2,
      addr.city_name,
      addr.state,
      addr.pincode,
    ]
      .filter(Boolean)
      .join(', ');
  };

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader
        title={t('address') || 'Address'}
        showBackButton={true}
        // showCirclePlusButton={true}
        // onPlusPress={() => navigation.navigate('AddAddressScreen')}
      />
      <CustomeLoader loading={loading} />

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Header Summary & Quick Add */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryTitleGroup}>
              <Ionicons
                name="location-sharp"
                size={moderateScale(18)}
                color={COLORS.primary}
                style={styles.marginRight6}
              />
              <Text style={styles.savedAddressesTitle}>
                {addresses.length} {t('saved_addresses') || 'Saved Addresses'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.quickAddButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddAddressScreen')}
            >
              <Ionicons
                name="add-circle"
                size={moderateScale(16)}
                color={COLORS.primary}
                style={styles.marginRight4}
              />
              <Text style={styles.quickAddButtonText}>
                {t('add_address') || 'Add New'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input (visible if more than 1 address) */}
          {addresses.length > 1 && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={moderateScale(18)}
                color="#94A3B8"
                style={styles.marginRight8}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_addresses') || 'Search addresses...'}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={moderateScale(18)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Filter Pills */}
          {addresses.length > 2 && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeFilter === 'all' && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  {t('all') || 'All'} ({addresses.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeFilter === 'home' && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter('home')}
              >
                <Ionicons
                  name="home"
                  size={moderateScale(13)}
                  color={activeFilter === 'home' ? '#FFFFFF' : '#DC2626'}
                  style={styles.marginRight4}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === 'home' && styles.filterPillTextActive,
                  ]}
                >
                  {t('home') || 'Home'} ({typeCounts.home})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeFilter === 'office' && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter('office')}
              >
                <Ionicons
                  name="business"
                  size={moderateScale(13)}
                  color={activeFilter === 'office' ? '#FFFFFF' : '#0284C7'}
                  style={styles.marginRight4}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === 'office' && styles.filterPillTextActive,
                  ]}
                >
                  {t('office') || 'Office'} ({typeCounts.office})
                </Text>
              </TouchableOpacity>

              {typeCounts.other > 0 && (
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeFilter === 'other' && styles.filterPillActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter('other')}
                >
                  <Ionicons
                    name="location"
                    size={moderateScale(13)}
                    color={activeFilter === 'other' ? '#FFFFFF' : '#EA580C'}
                    style={styles.marginRight4}
                  />
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === 'other' && styles.filterPillTextActive,
                    ]}
                  >
                    {t('other') || 'Other'} ({typeCounts.other})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Address Cards List */}
          {filteredAddresses.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="location-outline"
                  size={moderateScale(42)}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || activeFilter !== 'all'
                  ? t('no_matching_addresses') || 'No Matching Addresses'
                  : t('no_addresses_found') || 'No Saved Addresses'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || activeFilter !== 'all'
                  ? t('try_adjusting_search') ||
                    'Try adjusting your search terms or filter.'
                  : t('add_address_desc') ||
                    'Save your home or pilgrimage address for smooth ceremony scheduling.'}
              </Text>

              {searchQuery || activeFilter !== 'all' ? (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>
                    {t('reset_filters') || 'Reset Filters'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('AddAddressScreen')}
                >
                  <Ionicons
                    name="add"
                    size={moderateScale(18)}
                    color="#FFFFFF"
                    style={styles.marginRight6}
                  />
                  <Text style={styles.emptyAddBtnText}>
                    {t('add_new_address') || 'Add New Address'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.cardsList}>
              {filteredAddresses.map(address => {
                const iconConfig = getAddressIconConfig(address.address_type);
                const fullAddress = formatAddressString(address);

                return (
                  <View key={`addr-${address.id}`} style={styles.addressCard}>
                    {/* Top Row: Icon, Name, Type Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.cardIconBox,
                          { backgroundColor: iconConfig.bgColor },
                        ]}
                      >
                        <Ionicons
                          name={iconConfig.icon}
                          size={moderateScale(18)}
                          color={iconConfig.color}
                        />
                      </View>

                      <View style={styles.cardTitleCol}>
                        <Text style={styles.addressName} numberOfLines={1}>
                          {address.name || t('address') || 'Ceremony Address'}
                        </Text>
                        {address.address_type ? (
                          <View
                            style={[
                              styles.typePill,
                              {
                                backgroundColor: iconConfig.badgeBg,
                                borderColor: iconConfig.badgeBorder,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typePillText,
                                { color: iconConfig.badgeText },
                              ]}
                            >
                              {address.address_type}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Address Body */}
                    <View style={styles.addressBodyRow}>
                      <Ionicons
                        name="location-outline"
                        size={moderateScale(16)}
                        color="#64748B"
                        style={styles.bodyIconMargin}
                      />
                      <Text style={styles.addressBodyText}>{fullAddress}</Text>
                    </View>

                    {/* Phone Row */}
                    {address.phone_number ? (
                      <View style={styles.phoneRow}>
                        <Ionicons
                          name="call-outline"
                          size={moderateScale(14)}
                          color="#059669"
                          style={styles.bodyIconMargin}
                        />
                        <Text style={styles.phoneText}>
                          {address.phone_number}
                        </Text>
                      </View>
                    ) : null}

                    {/* Card Actions Footer */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        activeOpacity={0.7}
                        onPress={() => handleEdit(address)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={moderateScale(15)}
                          color="#2563EB"
                          style={styles.marginRight4}
                        />
                        <Text style={styles.editActionText}>
                          {t('edit') || 'Edit'}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.actionDivider} />

                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        activeOpacity={0.7}
                        onPress={() => handleDeletePress(address)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={moderateScale(15)}
                          color="#DC2626"
                          style={styles.marginRight4}
                        />
                        <Text style={styles.deleteActionText}>
                          {t('delete') || 'Delete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <CustomModal
        visible={deleteModalVisible}
        title={`${t('delete') || 'Delete'} ${t('address') || 'Address'}`}
        message={
          t('are_you_sure_you_want_to_delete_address') ||
          'Are you sure you want to delete this address?'
        }
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
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
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(30),
  },

  // Summary & Add Header
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(14),
  },
  summaryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedAddressesTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
  },
  quickAddButtonText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },

  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(42),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: moderateScale(4),
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(16),
    flexWrap: 'wrap',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.Sen_Bold,
  },

  // Cards List
  cardsList: {
    gap: moderateScale(12),
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  cardIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  cardTitleCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  addressName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  typePill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
  },
  typePillText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    textTransform: 'capitalize',
  },

  // Address text & details
  addressBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(6),
  },
  bodyIconMargin: {
    marginRight: moderateScale(8),
    marginTop: moderateScale(2),
  },
  addressBodyText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#334155',
    lineHeight: moderateScale(18),
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  phoneText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#059669',
  },

  // Actions Footer
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: moderateScale(10),
    marginTop: moderateScale(4),
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(4),
  },
  editActionText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#2563EB',
  },
  actionDivider: {
    width: 1,
    height: moderateScale(16),
    backgroundColor: '#E2E8F0',
  },
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(4),
  },
  deleteActionText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#DC2626',
  },

  // Empty State
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(26),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: moderateScale(10),
  },
  emptyIconCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(18),
  },
  resetFilterBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetFilterBtnText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#2563EB',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(14),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyAddBtnText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#FFFFFF',
  },

  // Margin Helpers
  marginRight4: {
    marginRight: moderateScale(4),
  },
  marginRight6: {
    marginRight: moderateScale(6),
  },
  marginRight8: {
    marginRight: moderateScale(8),
  },
});

export default AddressesScreen;
