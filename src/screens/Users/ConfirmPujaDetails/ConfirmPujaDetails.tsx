import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PrimaryButtonOutlined from '../../../components/PrimaryButtonOutlined';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { Images } from '../../../theme/Images';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import {
  getUpcomingPujaDetails,
  updateWaitingUser,
} from '../../../api/apiService';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import { useCommonToast } from '../../../common/CommonToast';
import { translateData } from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';
import PujaItemsModal from '../../../components/PujaItemsModal';

const ConfirmPujaDetails: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserHomeParamList,
    | 'PujaCancellationScreen'
    | 'UserChatScreen'
    | 'RateYourExperienceScreen'
    | 'FilteredPanditListScreen'
  >;
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { bookingId } = route.params as any;
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const [pujaDetails, setPujaDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isPujaItemsModalVisible, setIsPujaItemsModalVisible] = useState(false);
  const { showSuccessToast } = useCommonToast();

  const fetchPujaDetails = useCallback(async () => {
    try {
      if (!bookingId) {
        setPujaDetails(null);
        setLoading(false);
        return;
      }

      const cachedData = translationCacheRef.current.get(currentLanguage);
      if (cachedData && !refreshing) {
        setPujaDetails(cachedData);
        setLoading(false);
        return;
      }

      const details = await getUpcomingPujaDetails(bookingId.toString());

      const translatedData = await translateData(details, currentLanguage, [
        'pooja_name',
        'location_display',
        'muhurat_type',
        'pandit_arranged_items',
        'user_arranged_items',
        'address',
      ]);

      translationCacheRef.current.set(currentLanguage, translatedData);
      setPujaDetails(translatedData);
    } catch (error) {
      console.error(
        'Error fetching puja details in ConfirmPujaDetails:',
        error,
      );
      setPujaDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingId, currentLanguage, refreshing]);

  useEffect(() => {
    fetchPujaDetails();
  }, [bookingId, fetchPujaDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    translationCacheRef.current.delete(currentLanguage);
    fetchPujaDetails();
  }, [currentLanguage, fetchPujaDetails]);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
        );
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(currentLanguage || 'en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        }
      }
    } catch {}
    return dateStr;
  };

  const getPujaImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  // Handler for "I am waiting" (auto mode)
  const onWaitClick = async () => {
    setLoading(true);
    try {
      const response = await updateWaitingUser(bookingId?.toString());
      showSuccessToast(
        response?.message ||
          t('waiting_acknowledged', {
            defaultValue: 'Your request is active. We are notifying pandits!',
          }),
      );
    } catch (e) {
      console.log('Error in onWaitClick:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handler for "Choose Another Panditji" (manual mode)
  const onChoosePanditClick = () => {
    navigation.navigate('FilteredPanditListScreen', {
      booking_id: bookingId,
    });
  };

  const onCancelClick = () => {
    navigation.navigate('PujaCancellationScreen', { id: bookingId });
  };

  const pandit = pujaDetails?.assigned_pandit;
  const isPanditAssigned =
    pandit && typeof pandit === 'object' && pandit.pandit_name;
  const isAutoMode = pujaDetails?.assignment_mode === 1;

  const userItemsCount = Array.isArray(pujaDetails?.user_arranged_items)
    ? pujaDetails.user_arranged_items.length
    : 0;
  const panditItemsCount = Array.isArray(pujaDetails?.pandit_arranged_items)
    ? pujaDetails.pandit_arranged_items.length
    : 0;
  const totalItemsCount = userItemsCount + panditItemsCount;

  return (
    <View style={styles.screenContainer}>
      <CustomeLoader loading={loading && !refreshing} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />

      {/* Red Header Wrapper */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <UserCustomHeader
          title={t('puja_details', { defaultValue: 'Puja Details' })}
          showBackButton={true}
        />
        <View style={styles.headerCurveExtension} />
      </View>

      {/* Main Content Area */}
      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: moderateScale(16) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {pujaDetails && (
            <>
              {/* 1. Waiting for Approval Status Banner */}
              <View style={styles.statusBanner}>
                <View style={styles.statusBannerHeader}>
                  <View style={styles.pulseDotWrapper}>
                    <View style={styles.pulseDotCore} />
                  </View>
                  <Text style={styles.statusBannerTitle}>
                    {t('waiting_for_approval', {
                      defaultValue: 'Waiting for Approval',
                    })}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {pujaDetails.booking_status
                        ? pujaDetails.booking_status
                            .replace('_', ' ')
                            .toUpperCase()
                        : 'PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.statusBannerDesc}>
                  {isAutoMode
                    ? t('auto_mode_waiting_desc', {
                        defaultValue:
                          'We are finding and assigning the best verified Panditji nearby for your puja ceremony.',
                      })
                    : t('manual_mode_waiting_desc', {
                        defaultValue:
                          'Your booking request has been sent to Panditji. Waiting for their confirmation.',
                      })}
                </Text>

                <View style={styles.bookingRefRow}>
                  <Ionicons
                    name="receipt-outline"
                    size={moderateScale(14)}
                    color="#92400E"
                  />
                  <Text style={styles.bookingRefText}>
                    Booking #{bookingId}
                  </Text>
                </View>
              </View>

              {/* 2. Panditji Status Card */}
              {isPanditAssigned ? (
                <View style={styles.cardContainer}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardSectionLabel}>
                      {t('assigned_panditji', {
                        defaultValue: 'REQUESTED PANDITJI',
                      })}
                    </Text>
                    <View style={styles.awaitingChip}>
                      <Ionicons
                        name="time-outline"
                        size={moderateScale(12)}
                        color="#D97706"
                      />
                      <Text style={styles.awaitingChipText}>
                        Awaiting Response
                      </Text>
                    </View>
                  </View>

                  <View style={styles.panditProfileRow}>
                    {pandit.profile_img_url ? (
                      <Image
                        source={{ uri: pandit.profile_img_url }}
                        style={styles.panditAvatar}
                      />
                    ) : (
                      <View style={styles.panditAvatarFallback}>
                        <Ionicons
                          name="person"
                          size={moderateScale(24)}
                          color={COLORS.primary}
                        />
                      </View>
                    )}

                    <View style={styles.panditInfoCol}>
                      <Text style={styles.panditNameText} numberOfLines={1}>
                        {pandit.pandit_name}
                      </Text>
                      <Text style={styles.panditSubtext}>
                        {pandit.mobile
                          ? `+91 ${pandit.mobile}`
                          : 'Verified Panditji'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.cardContainer}>
                  <View style={styles.autoAssignRow}>
                    <View style={styles.autoAssignIconBadge}>
                      <Ionicons
                        name="sparkles"
                        size={moderateScale(22)}
                        color="#D97706"
                      />
                    </View>
                    <View style={styles.autoAssignInfo}>
                      <Text style={styles.autoAssignTitle}>
                        {isAutoMode
                          ? t('auto_assign_title', {
                              defaultValue: 'Auto Panditji Assignment',
                            })
                          : t('panditji_selection', {
                              defaultValue: 'Panditji Selection',
                            })}
                      </Text>
                      <Text style={styles.autoAssignSubtext}>
                        {isAutoMode
                          ? t('auto_assign_desc', {
                              defaultValue:
                                'A qualified Panditji will accept and be assigned shortly based on your location and selected muhurat.',
                            })
                          : t('manual_assign_desc', {
                              defaultValue:
                                'No Panditji is currently assigned. You can select another Panditji directly.',
                            })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 3. Puja Ceremony Details Card */}
              <View style={styles.cardContainer}>
                {/* Puja Header */}
                <View style={styles.pujaHeaderRow}>
                  <Image
                    source={
                      pujaDetails.pooja_image_url
                        ? { uri: getPujaImageUrl(pujaDetails.pooja_image_url) }
                        : Images.ic_app_logo
                    }
                    style={styles.pujaImage}
                  />
                  <View style={styles.pujaTitleCol}>
                    <Text style={styles.pujaTitleText} numberOfLines={2}>
                      {pujaDetails.pooja_name || t('puja')}
                    </Text>
                    <View style={styles.samagriBadgeRow}>
                      <View
                        style={[
                          styles.samagriBadge,
                          pujaDetails.samagri_required
                            ? styles.samagriBadgeActive
                            : styles.samagriBadgeInactive,
                        ]}
                      >
                        <Ionicons
                          name={
                            pujaDetails.samagri_required
                              ? 'checkmark-circle'
                              : 'close-circle-outline'
                          }
                          size={moderateScale(12)}
                          color={
                            pujaDetails.samagri_required ? '#15803D' : '#64748B'
                          }
                        />
                        <Text
                          style={[
                            styles.samagriBadgeText,
                            pujaDetails.samagri_required
                              ? styles.samagriBadgeTextActive
                              : styles.samagriBadgeTextInactive,
                          ]}
                        >
                          {pujaDetails.samagri_required
                            ? t('with_samagri', {
                                defaultValue: 'With Samagri',
                              })
                            : t('without_samagri', {
                                defaultValue: 'Without Samagri',
                              })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Details Grid */}
                <View style={styles.detailGrid}>
                  {/* Date */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCircle}>
                      <Ionicons
                        name="calendar-outline"
                        size={moderateScale(17)}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>
                        {t('date', { defaultValue: 'Date' })}
                      </Text>
                      <Text style={styles.detailValue}>
                        {formatDate(pujaDetails.booking_date)}
                      </Text>
                    </View>
                  </View>

                  {/* Time & Muhurat */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCircle}>
                      <Ionicons
                        name="time-outline"
                        size={moderateScale(17)}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>
                        {t('muhurat_time', { defaultValue: 'Muhurat Time' })}
                      </Text>
                      <View style={styles.muhuratRow}>
                        <Text style={styles.detailValue}>
                          {pujaDetails.muhurat_time ||
                            t('time_not_available', {
                              defaultValue: 'Time not set',
                            })}
                        </Text>
                        {pujaDetails.muhurat_type && (
                          <View style={styles.muhuratTypePill}>
                            <Text style={styles.muhuratTypePillText}>
                              {pujaDetails.muhurat_type}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Venue / Location */}
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconCircle}>
                      <Ionicons
                        name="location-outline"
                        size={moderateScale(17)}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>
                        {t('venue_address', {
                          defaultValue: 'Venue / Address',
                        })}
                      </Text>
                      <Text style={styles.detailValue} numberOfLines={3}>
                        {pujaDetails.address ||
                          pujaDetails.location_display ||
                          t('location_not_available', {
                            defaultValue: 'Location not specified',
                          })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 4. Puja Samagri & Items Checklist Card */}
              {totalItemsCount > 0 && (
                <View style={styles.cardContainer}>
                  <View style={styles.samagriCardHeader}>
                    <View style={styles.samagriIconBadge}>
                      <Ionicons
                        name="cube-outline"
                        size={moderateScale(20)}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.samagriHeaderCol}>
                      <Text style={styles.samagriCardTitle}>
                        {t('puja_samagri', {
                          defaultValue: 'Puja Items & Samagri',
                        })}
                      </Text>
                      <Text style={styles.samagriCardSubtitle}>
                        {totalItemsCount}{' '}
                        {t('items_prepared_for_ritual', {
                          defaultValue: 'items arranged for this ceremony',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemPillsRow}>
                    <View style={styles.itemPill}>
                      <Text style={styles.itemPillLabel}>
                        {t('panditji_items', {
                          defaultValue: 'Panditji Items',
                        })}
                        :
                      </Text>
                      <Text style={styles.itemPillCount}>
                        {panditItemsCount}
                      </Text>
                    </View>
                    <View style={styles.itemPill}>
                      <Text style={styles.itemPillLabel}>
                        {t('your_items', { defaultValue: 'Your Items' })}:
                      </Text>
                      <Text style={styles.itemPillCount}>{userItemsCount}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewChecklistButton}
                    onPress={() => setIsPujaItemsModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="list-outline"
                      size={moderateScale(18)}
                      color={COLORS.primary}
                    />
                    <Text style={styles.viewChecklistButtonText}>
                      {t('view_items_checklist', {
                        defaultValue: 'View Items Checklist',
                      })}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={moderateScale(16)}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* 5. Payment & Total Amount Card */}
              <View style={styles.cardContainer}>
                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentLabel}>
                      {t('total_amount', { defaultValue: 'Total Amount' })}
                    </Text>
                    <Text style={styles.paymentSubtext}>
                      {pujaDetails.samagri_required
                        ? t('includes_samagri_dakshina', {
                            defaultValue: 'Puja fee & Samagri included',
                          })
                        : t('puja_fee_only', {
                            defaultValue: 'Puja ceremony fee',
                          })}
                    </Text>
                  </View>

                  <View style={styles.paymentRightCol}>
                    <Text style={styles.paymentAmount}>
                      ₹{' '}
                      {pujaDetails.amount
                        ? parseFloat(pujaDetails.amount).toLocaleString(
                            'en-IN',
                            {
                              minimumFractionDigits: 0,
                            },
                          )
                        : '0'}
                    </Text>
                    {pujaDetails.payment_status === 'success' && (
                      <View style={styles.paidBadge}>
                        <Ionicons
                          name="checkmark"
                          size={moderateScale(11)}
                          color="#15803D"
                        />
                        <Text style={styles.paidBadgeText}>PAID</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Fixed Bottom Action Bar */}
      {!loading && pujaDetails && (
        <View style={styles.bottomDock}>
          {isAutoMode ? (
            <PrimaryButton
              title={t('i_am_waiting', { defaultValue: 'I Am Waiting' })}
              onPress={onWaitClick}
              style={styles.actionPrimaryButton}
              textStyle={styles.actionButtonText}
              disabled={loading}
            />
          ) : (
            <PrimaryButton
              title={t('choose_another_panditji', {
                defaultValue: 'Choose Another Panditji',
              })}
              onPress={onChoosePanditClick}
              style={styles.actionPrimaryButton}
              textStyle={styles.actionButtonText}
              disabled={loading}
            />
          )}

          <PrimaryButtonOutlined
            title={t('cancel', { defaultValue: 'Cancel' })}
            onPress={onCancelClick}
            style={styles.actionOutlineButton}
            textStyle={styles.actionOutlineButtonText}
            disabled={loading}
          />
        </View>
      )}

      {/* Puja Items Checklist Modal */}
      <PujaItemsModal
        visible={isPujaItemsModalVisible}
        onClose={() => setIsPujaItemsModalVisible(false)}
        userItems={pujaDetails?.user_arranged_items || []}
        panditjiItems={pujaDetails?.pandit_arranged_items || []}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(18),
    gap: moderateScale(14),
  },

  // Status Banner
  statusBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  pulseDotWrapper: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(8),
  },
  pulseDotCore: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#D97706',
  },
  statusBannerTitle: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#92400E',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#B45309',
    letterSpacing: 0.4,
  },
  statusBannerDesc: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#78350F',
    lineHeight: moderateScale(19),
    marginBottom: moderateScale(10),
  },
  bookingRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    paddingTop: moderateScale(6),
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  bookingRefText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#92400E',
  },

  // Base Card
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  cardSectionLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#64748B',
    letterSpacing: 0.6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(12),
  },

  // Pandit Card
  awaitingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  awaitingChipText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#D97706',
  },
  panditProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  panditAvatarFallback: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD4D8',
  },
  panditInfoCol: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  panditNameText: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  panditSubtext: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: moderateScale(2),
  },

  // Auto assign row
  autoAssignRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoAssignIconBadge: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  autoAssignInfo: {
    flex: 1,
  },
  autoAssignTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  autoAssignSubtext: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    lineHeight: moderateScale(18),
    marginTop: moderateScale(2),
  },

  // Puja Header Row
  pujaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pujaImage: {
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
  },
  pujaTitleCol: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  pujaTitleText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    lineHeight: moderateScale(22),
  },
  samagriBadgeRow: {
    flexDirection: 'row',
    marginTop: moderateScale(6),
  },
  samagriBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  samagriBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  samagriBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  samagriBadgeText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
  },
  samagriBadgeTextActive: {
    color: '#15803D',
  },
  samagriBadgeTextInactive: {
    color: '#64748B',
  },

  // Detail Grid
  detailGrid: {
    gap: moderateScale(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#1E293B',
    marginTop: moderateScale(2),
  },
  muhuratRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginTop: moderateScale(2),
  },
  muhuratTypePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  muhuratTypePillText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#2563EB',
  },

  // Samagri Card
  samagriCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  samagriIconBadge: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  samagriHeaderCol: {
    flex: 1,
  },
  samagriCardTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  samagriCardSubtitle: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: moderateScale(1),
  },
  itemPillsRow: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(12),
  },
  itemPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemPillLabel: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },
  itemPillCount: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  viewChecklistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
    backgroundColor: '#FFF1F2',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  viewChecklistButtonText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },

  // Payment Card
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  paymentSubtext: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: moderateScale(2),
  },
  paymentRightCol: {
    alignItems: 'flex-end',
    gap: moderateScale(4),
  },
  paymentAmount: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  paidBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#15803D',
  },

  // Fixed Bottom Dock
  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
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
  actionPrimaryButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    height: moderateScale(48),
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(6),
  },
  actionOutlineButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    height: moderateScale(48),
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: moderateScale(6),
  },
  actionButtonText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    lineHeight: moderateScale(17),
  },
  actionOutlineButtonText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#475569',
    textAlign: 'center',
    lineHeight: moderateScale(17),
  },
});

export default ConfirmPujaDetails;
