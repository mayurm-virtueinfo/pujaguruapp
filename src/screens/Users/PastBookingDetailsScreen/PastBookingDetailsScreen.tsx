import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { getPastBookings } from '../../../api/apiService';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';

const { width: screenWidth } = Dimensions.get('window');

// Helper: how many items previewed when collapsed
const SAMAGRI_COLLAPSE_COUNT = 3;

const PastBookingDetailsScreen = ({ navigation }: { navigation?: any }) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { pujaId, id } = (route.params as any) || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  // "showMore" state: 'user', 'pandit', or null (only one expanded at a time)
  const [samagriExpand, setSamagriExpand] = useState<null | 'user' | 'pandit'>(
    null,
  );
  console.log("bookingDetails",bookingDetails);
  
useEffect(() => {
    fetchBookingDetails();
  }, []);
  // Fetch Booking Details (by pujaId/id)
  const fetchBookingDetails = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response: any = await getPastBookings();
      
      let data = response?.data;
      let matched;
      if (data && Array.isArray(data)) {
        matched = data.find(item => String(item.id) === String(pujaId || id));
      }
      
      setBookingDetails(matched || null);
    } catch (err) {
      setError(t('error_loading_data') || 'Error loading data');
      setBookingDetails(null);
    } finally {
      setLoading(false);
    }
  }, [pujaId, t]);

  // Date formatting helper
  const formatDateWithOrdinal = (dateString: string) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const s = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    const ordinal = s[(v - 20) % 10] || s[v] || s[0];
    return `${day}${ordinal} ${month}`;
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    if (!status) return COLORS.textSecondary;
    if (
      status.toLowerCase().includes('success') ||
      status.toLowerCase().includes('completed')
    ) {
      return COLORS.success || '#2ecc71';
    }
    if (status.toLowerCase().includes('pending')) {
      return COLORS.warning || '#f1c40f';
    }
    if (
      status.toLowerCase().includes('fail') ||
      status.toLowerCase().includes('cancel')
    ) {
      return COLORS.error || '#e74c3c';
    }
    return COLORS.textSecondary;
  };

  // Readable address
  const getAddressString = (address: any) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address.full_address)
      return address.full_address;
    return '';
  };

  // Item array helpers
  const flattenItems = (arr: any[] = []) => {
    if (!Array.isArray(arr)) return [];
    return arr.flat ? arr.flat().filter(Boolean) : arr.filter(Boolean);
  };

  // Loader
  // if (loading) {
  //   return (
  //     <View style={styles.centered}>
  //       <CustomeLoader loading={loading} />
  //     </View>
  //   );
  // }
  // Error
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  // Not found
  if (!bookingDetails && !loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>
          {t('no_item_available') || 'No details found.'}
        </Text>
      </View>
    );
  }

  // Data destructure for past booking
  const {
    pooja_name,
    pooja_image_url,
    booking_date,
    muhurat_time,
    muhurat_type,
    tirth_place_name,
    amount,
    booking_user_name,
    booking_user_img,
    booking_user_mobile,
    payment_status,
    notes,
    samagri_required,
    address_details,
    booking_status,
    assigned_pandit,
    user_arranged_items,
    pandit_arranged_items,
    address, // fallback
    location_display, // fallback
  } = bookingDetails || {};

  // Items
  const userItems = flattenItems(user_arranged_items);
  const panditItems = flattenItems(pandit_arranged_items);

  // SamagriList UI modeled after ConfirmPujaDetails
  function SamagriList({
    label,
    items,
    isExpanded,
    onToggle,
    isPandit,
    testID,
  }: {
    label: string;
    items: any[];
    isExpanded: boolean;
    onToggle: () => void;
    isPandit?: boolean;
    testID?: string;
  }) {
    const showCollapse = items.length > SAMAGRI_COLLAPSE_COUNT;
    const shownItems = isExpanded
      ? items
      : items.slice(0, SAMAGRI_COLLAPSE_COUNT);
    return (
      <View style={{ marginBottom: moderateScale(12) }}>
        <Text
          style={[
            styles.samagriListLabel,
            isPandit
              ? styles.samagriListLabelPandit
              : styles.samagriListLabelUser,
          ]}
        >
          {label}
        </Text>
        {items && items.length > 0 ? (
          <>
            <View style={styles.samagriListItemsWrapper} testID={testID}>
              {shownItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.samagriChip,
                    isPandit
                      ? styles.samagriChipPandit
                      : styles.samagriChipUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.samagriChipText,
                      isPandit
                        ? { color: COLORS.gray }
                        : { color: COLORS.primary },
                    ]}
                  >
                    {typeof item === 'string'
                      ? item
                      : item.name ?? item.item_name ?? '-'}
                  </Text>
                </View>
              ))}
              {showCollapse && (
                <TouchableOpacity
                  onPress={onToggle}
                  style={styles.samagriShowMoreBtn}
                >
                  <Text
                    style={styles.samagriShowMoreText}
                    testID={testID ? `${testID}-show-toggle` : undefined}
                  >
                    {isExpanded
                      ? t('Show Less') || 'Show Less'
                      : t('Show More') || 'Show More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.samagriNoItem}>
            {t('no_items_found') || 'No items found.'}
          </Text>
        )}
      </View>
    );
  }

  // Show samagri expanded details - now "show more/less" for user and pandit, only one at a time
  function renderSamagriExpandable() {
    return (
      <View style={[styles.card, THEMESHADOW.shadow]}>
        <Text style={styles.sectionHeader}>
          {t('items_arranged') || 'Samagri Arrangement'}
        </Text>
        {samagri_required === true ? (
          <>
            <SamagriList
              label={t('user_will_arrange') || 'You will arrange'}
              items={userItems}
              isExpanded={samagriExpand === 'user'}
              onToggle={() =>
                setSamagriExpand(prev => (prev === 'user' ? null : 'user'))
              }
              isPandit={false}
              testID="user-samagri"
            />
            <SamagriList
              label={t('pandit_will_arrange') || 'Pandit will arrange'}
              items={panditItems}
              isExpanded={samagriExpand === 'pandit'}
              onToggle={() =>
                setSamagriExpand(prev => (prev === 'pandit' ? null : 'pandit'))
              }
              isPandit={true}
              testID="pandit-samagri"
            />
            {userItems.length === 0 && panditItems.length === 0 && (
              <Text style={styles.samagriNoArrangement}>
                {t('no_arrangement_info') || 'No arrangement info available'}
              </Text>
            )}
          </>
        ) : samagri_required === false ? (
          <>
            <Text style={styles.narrativeInfo}>
              {t('samagri_not_required_note') ||
                'Samagri is not required. Pandit and user arranged items as below.'}
            </Text>
            <SamagriList
              label={t('user_will_arrange') || 'You will arrange'}
              items={userItems}
              isExpanded={samagriExpand === 'user'}
              onToggle={() =>
                setSamagriExpand(prev => (prev === 'user' ? null : 'user'))
              }
              isPandit={false}
              testID="user-samagri"
            />
            <SamagriList
              label={t('pandit_will_arrange') || 'Pandit will arrange'}
              items={panditItems}
              isExpanded={samagriExpand === 'pandit'}
              onToggle={() =>
                setSamagriExpand(prev => (prev === 'pandit' ? null : 'pandit'))
              }
              isPandit={true}
              testID="pandit-samagri"
            />
            {userItems.length === 0 && panditItems.length === 0 && (
              <Text style={styles.samagriNoArrangement}>
                {t('no_arrangement_info') || 'No arrangement info available'}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.samagriNoArrangement}>
            {t('samagri_arrangement_not_specified') ||
              'Samagri arrangement not specified.'}
          </Text>
        )}
      </View>
    );
  }

  // Large Card, as in reference
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading} />
      <UserCustomHeader
        title={t('past_booking_details') || 'Completed Puja Details'}
        showBackButton
        onBackPress={() => navigation?.goBack && navigation.goBack()}
      />
      {
        loading ? (<View style={{flex:1,backgroundColor:COLORS.white}}></View>): (<ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero image */}
        <Image
          source={
            pooja_image_url
              ? { uri: pooja_image_url }
              : {
                  uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/db9492299c701c6ca2a23d6de9fc258e7ec2b5fd?width=160',
                }
          }
          style={[
            styles.heroImage,
            { width: screenWidth, height: verticalScale(200) },
          ]}
          resizeMode="stretch"
        />
        <View
          style={{
            flex: 1,
            paddingHorizontal: moderateScale(24),
            paddingTop: verticalScale(24),
          }}
        >
          <Text style={styles.pujaTitle}>{pooja_name || t('Puja Name')}</Text>
          {/* Booking Info Card */}
          <View style={[styles.card, THEMESHADOW.shadow]}>
            <View style={styles.cardInner}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('date')}</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithOrdinal(booking_date) || '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('amount')}</Text>
                <Text style={[styles.detailValue, { color: COLORS.success }]}>
                  ₹{amount || '0'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('muhurat')}</Text>
                <Text style={styles.detailValue}>
                  {muhurat_type && `(${muhurat_type})`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('muhurat_time')}</Text>
                <Text style={styles.detailValue}>{muhurat_time || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('temple')}</Text>
                <Text style={styles.detailValue}>
                  {tirth_place_name || '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('samagri_required')}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        samagri_required === true
                          ? COLORS.success
                          : samagri_required === false
                          ? COLORS.error
                          : COLORS.textPrimary,
                    },
                  ]}
                >
                  {samagri_required === true
                    ? t('Yes')
                    : samagri_required === false
                    ? t('No')
                    : '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('payment_status')}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getStatusColor(payment_status) },
                  ]}
                >
                  {payment_status
                    ? payment_status.charAt(0).toUpperCase() +
                      payment_status.slice(1)
                    : '-'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('booking_status')}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getStatusColor(booking_status) },
                  ]}
                >
                  {booking_status
                    ? booking_status.charAt(0).toUpperCase() +
                      booking_status.slice(1)
                    : '-'}
                </Text>
              </View>
              {notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>{t('notes')}</Text>
                  <Text style={styles.notesValue}>{notes}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pandit Details Card (if exists) */}
          {assigned_pandit && assigned_pandit.pandit_name ? (
            <View style={[styles.userCard, THEMESHADOW.shadow]}>
              <Image
                source={
                  assigned_pandit.profile_img_url
                    ? { uri: assigned_pandit.profile_img_url }
                    : {
                        uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/db9492299c701c6ca2a23d6de9fc258e7ec2b5fd?width=160',
                      }
                }
                style={styles.userImage}
                resizeMode="cover"
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {assigned_pandit.pandit_name}
                </Text>
                {assigned_pandit.phone ? (
                  <Text style={styles.userMobile}>{assigned_pandit.phone}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Samagri Arrangement - show more/less controlled per type, only one expanded at a time */}
          {renderSamagriExpandable()}

          {/* Address Card */}
          {(address_details || location_display || address) && (
            <View style={[styles.addressCard, THEMESHADOW.shadow]}>
              <Text style={styles.addressLabel}>{t('Address Details')}</Text>
              <Text style={styles.addressValue}>
                {getAddressString(address_details) ||
                  location_display ||
                  address ||
                  '-'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>)
      }
    </View>
  );
};

export default PastBookingDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: {
    color: COLORS.error || 'red',
    fontSize: 16,
    fontFamily: Fonts.Sen_Medium,
  },
  notFoundText: {
    color: COLORS.gray || '#888',
    fontSize: 16,
    fontFamily: Fonts.Sen_Medium,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingBottom: verticalScale(32),
  },
  heroImage: {
    width: '100%',
    height: verticalScale(200),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    backgroundColor: COLORS.backGroundSecondary,
  },
  pujaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(20),
  },
  cardInner: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: Fonts.Sen_Medium,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: Fonts.Sen_SemiBold,
  },
  notesContainer: {
    backgroundColor: COLORS.backGroundSecondary,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Fonts.Sen_Medium,
  },
  notesValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '400',
    fontFamily: Fonts.Sen_Regular,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(20),
    gap: 12,
  },
  userImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backGroundSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: Fonts.Sen_SemiBold,
  },
  userMobile: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: Fonts.Sen_Regular,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(20),
  },
  addressLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Fonts.Sen_Medium,
  },
  addressValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '400',
    fontFamily: Fonts.Sen_Regular,
  },
  sectionHeader: {
    fontSize: 16.5,
    color: COLORS.primary,
    fontFamily: Fonts.Sen_SemiBold,
    marginBottom: moderateScale(7),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: 15,
    color: COLORS.primary,
    marginBottom: moderateScale(4),
    letterSpacing: 0.23,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: moderateScale(27),
    marginHorizontal: -2,
    alignItems: 'center',
  },
  itemTagYou: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginRight: moderateScale(6),
    marginBottom: moderateScale(5),
  },
  itemTagYouText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
  },
  itemTagPandit: {
    backgroundColor: COLORS.gray + '15',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginRight: moderateScale(6),
    marginBottom: moderateScale(5),
  },
  itemTagPanditText: {
    color: COLORS.gray,
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
  },
  infoText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14.5,
    color: COLORS.gray,
    marginTop: moderateScale(4),
    marginLeft: moderateScale(2),
  },
  narrativeInfo: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: 13.5,
    color: COLORS.gray,
    marginTop: moderateScale(6),
    marginBottom: 4,
    marginLeft: moderateScale(1),
    letterSpacing: 0,
    lineHeight: 19,
  },
  showMoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(2),
  },

  // Add styles for ConfirmPujaDetails-style chips/list
  samagriListLabel: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: 15.25,
    marginBottom: moderateScale(4),
    letterSpacing: 0.23,
    color: COLORS.primary,
  },
  samagriListLabelUser: {
    color: COLORS.primary,
  },
  samagriListLabelPandit: {
    color: COLORS.gray,
  },
  samagriListItemsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: -2,
    minHeight: moderateScale(27),
  },
  samagriChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: moderateScale(6),
    marginBottom: moderateScale(5),
    backgroundColor: COLORS.primary + '15',
  },
  samagriChipUser: {
    backgroundColor: COLORS.primary + '15',
  },
  samagriChipPandit: {
    backgroundColor: COLORS.gray + '15',
  },
  samagriChipText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
  },
  samagriShowMoreBtn: {
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(2),
    justifyContent: 'center',
  },
  samagriShowMoreText: {
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  samagriNoItem: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14.5,
    color: COLORS.gray,
    marginTop: moderateScale(4),
    marginLeft: moderateScale(2),
  },
  samagriNoArrangement: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14.5,
    color: COLORS.gray,
    marginTop: moderateScale(8),
    marginLeft: moderateScale(2),
  },
});
