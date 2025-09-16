import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PujaItemsModal from '../../../components/PujaItemsModal';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {Images} from '../../../theme/Images';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {useTranslation} from 'react-i18next';
import {getUpcomingPujaDetails, postStartChat} from '../../../api/apiService';

const UserPujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PujaCancellationScreen' | 'UserChatScreen' | 'RateYourExperienceScreen'
  >;
  const route = useRoute();
  const {id} = route.params as any;
  const {t} = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();
  const [isPujaItemsModalVisible, setIsPujaItemsModalVisible] = useState(false);

  const [pujaDetails, setPujaDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Track the previous booking status to detect changes
  const prevBookingStatus = useRef<string | null>(null);
  // Track if we've navigated to RateYourExperienceScreen for this booking
  const hasNavigatedToRate = useRef(false);

  // Track if we've already handled the in-progress pin logic
  const hasHandledInProgressPin = useRef(false);
  // Polling controls
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  console.log('pujaDetails :: ', pujaDetails);

  // Helper to reload puja details
  const fetchPujaDetails = async (options?: {silent?: boolean}) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const details = await getUpcomingPujaDetails(id?.toString());
      setPujaDetails(details);
    } catch (error) {
      setPujaDetails(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPujaDetails();
      // Reset navigation flag and previous booking status when screen is focused
      hasNavigatedToRate.current = false;
      prevBookingStatus.current = null;
      hasHandledInProgressPin.current = false;
      // Start polling while focused
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
      pollingTimerRef.current = setInterval(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
          await fetchPujaDetails({silent: true});
        } finally {
          isFetchingRef.current = false;
        }
      }, 5000);

      // Cleanup on unfocus
      return () => {
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      };
    }, [id]),
  );

  // Effect to handle status changes
  useEffect(() => {
    if (
      pujaDetails &&
      pujaDetails.booking_status &&
      pujaDetails.assigned_pandit
    ) {
      // 1. If booking_status is 'completed' and we haven't navigated yet, navigate to RateYourExperienceScreen
      if (
        pujaDetails.booking_status === 'completed' &&
        !hasNavigatedToRate.current
      ) {
        hasNavigatedToRate.current = true;
        navigation.navigate('RateYourExperienceScreen', {
          booking: pujaDetails.id,
          panditjiData: pujaDetails.assigned_pandit,
        });
      }

      // 2. If booking_status changed from 'accepted' to 'in_progress', reload details to get completion pin
      if (
        prevBookingStatus.current === 'accepted' &&
        pujaDetails.booking_status === 'in_progress' &&
        !hasHandledInProgressPin.current
      ) {
        hasHandledInProgressPin.current = true;
        // Refetch details to get the completion pin
        fetchPujaDetails();
      }

      // Update previous booking status for next render
      prevBookingStatus.current = pujaDetails.booking_status;
    }
    // Stop polling on terminal states to avoid unnecessary network calls
    if (
      pujaDetails &&
      ['completed', 'cancelled', 'rejected'].includes(
        pujaDetails.booking_status,
      )
    ) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    }
  }, [pujaDetails?.booking_status, pujaDetails?.assigned_pandit, navigation]);

  const handlePujaItemsPress = () => {
    setIsPujaItemsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsPujaItemsModalVisible(false);
  };

  const startChatConversation = async () => {
    const payload = {
      booking_id: pujaDetails?.id,
    };
    setLoading(true);
    try {
      const response = await postStartChat(payload);
      if (response) {
        console.log('response for start chat :: ', response);

        navigation.navigate('UserChatScreen', {
          booking_id: response?.data?.booking_id,
          pandit_name: response?.data?.other_participant_name,
          profile_img_url: response?.data?.other_participant_profile_img,
          pandit_id: response?.data?.other_participant_id,
        });
      }
    } catch (error) {
      console.error('Error starting chat :: ', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getPanditImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  const getPujaImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  const renderPujaDetails = () => {
    if (!pujaDetails) return null;
    return (
      <View style={styles.detailsContainer}>
        <View style={[styles.detailsCard, THEMESHADOW.shadow]}>
          <View style={styles.detailsContent}>
            {/* Puja Name & Image */}
            <View style={styles.detailRow}>
              <View style={styles.detailRowContent}>
                <Image
                  source={
                    pujaDetails.pooja_image_url
                      ? {uri: getPujaImageUrl(pujaDetails.pooja_image_url)}
                      : Images.ic_app_logo
                  }
                  style={styles.pujaIcon}
                />
                <Text style={styles.pujaTitle}>
                  {pujaDetails.pooja_name || t('puja')}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Location Section */}
            <View style={styles.detailRow}>
              <MaterialIcons
                name="location-on"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {pujaDetails.location_display || t('location_not_available')}
              </Text>
            </View>

            <View style={styles.separator} />

            {/* Date Section */}
            <View style={styles.detailRow}>
              <MaterialIcons
                name="event"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {formatDate(pujaDetails.booking_date)}
              </Text>
            </View>

            <View style={styles.separator} />

            {/* Time Section */}
            <View style={styles.detailRow}>
              <MaterialIcons
                name="access-time"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {pujaDetails.muhurat_time
                  ? pujaDetails.muhurat_time
                  : t('time_not_available')}
                {pujaDetails.muhurat_type
                  ? ` (${pujaDetails.muhurat_type})`
                  : ''}
              </Text>
            </View>

            <View style={styles.separator} />

            {/* Puja Items Section */}
            {pujaDetails.samagri_required ? (
              <>
                <View style={styles.detailRow}>
                  <MaterialIcons
                    name="list"
                    size={scale(24)}
                    color={COLORS.pujaCardSubtext}
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText}>{t('puja_items_list')}</Text>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={handlePujaItemsPress}>
                    <MaterialIcons
                      name="visibility"
                      size={scale(20)}
                      color={COLORS.primaryBackgroundButton}
                    />
                  </TouchableOpacity>
                </View>
                {(pujaDetails.verification_pin ||
                  pujaDetails.completion_pin) && (
                  <View style={styles.separator} />
                )}
              </>
            ) : null}

            {/* Pin Section */}
            {(pujaDetails.verification_pin || pujaDetails.completion_pin) && (
              <View style={styles.detailRow}>
                <Image
                  source={Images.ic_pin}
                  style={[
                    styles.detailIcon,
                    {width: scale(20), height: scale(16)},
                  ]}
                  resizeMode="contain"
                />
                <Text style={styles.detailText}>
                  {pujaDetails.booking_status !== 'in_progress' &&
                  pujaDetails.verification_pin
                    ? `${pujaDetails.verification_pin}: ${t(
                        'verification_pin',
                      )}`
                    : pujaDetails.completion_pin
                    ? `${pujaDetails.completion_pin}: ${t('completion_pin')}`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTotalAmount = () => {
    if (!pujaDetails) return null;
    return (
      <View style={styles.totalContainer}>
        <View style={[styles.totalCard, THEMESHADOW.shadow]}>
          <View style={styles.totalContent}>
            <View style={{gap: 6}}>
              <Text style={styles.totalLabel}>{t('total_amount')}</Text>
              <Text style={styles.totalSubtext}>
                {pujaDetails.pooja_name || t('puja')}
              </Text>
            </View>
            <View>
              <Text style={styles.totalAmount}>
                ₹{' '}
                {pujaDetails.amount
                  ? parseFloat(pujaDetails.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                    })
                  : '0'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPanditDetails = () => {
    if (!pujaDetails) return null;
    const pandit = pujaDetails.assigned_pandit;
    if (!pandit) return null;
    return (
      <View style={styles.totalContainer}>
        <View style={[styles.totalCard, THEMESHADOW.shadow]}>
          <View style={styles.totalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                source={
                  pandit.profile_img_url
                    ? {uri: getPanditImageUrl(pandit.profile_img_url)}
                    : Images.ic_app_logo
                }
                style={styles.pujaIcon}
              />
              <Text style={styles.totalSubtext}>
                {pandit.pandit_name || t('panditji')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                startChatConversation();
              }}>
              <Image
                source={Images.ic_message}
                style={{width: scale(20), height: scale(20)}}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPanditjiSection = () => {
    if (!pujaDetails) return null;
    // Only show if no assigned_pandit
    if (pujaDetails.assigned_pandit) return null;
    return (
      <View style={styles.panditjiContainer}>
        <View style={[styles.panditjiCard, THEMESHADOW.shadow]}>
          <View style={styles.panditjiContent}>
            <View style={styles.panditjiAvatarContainer}>
              <View style={styles.panditjiAvatar}>
                <MaterialIcons
                  name="person"
                  size={scale(24)}
                  color={COLORS.white}
                />
              </View>
            </View>
            <Text style={styles.panditjiText}>
              {t('panditji_will_be_assigned_soon')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handleCancelBooking = () => {
    navigation.navigate('PujaCancellationScreen', {id: id});
  };
  const renderCancelButton = () => (
    <PrimaryButton
      title={t('cancel_booking')}
      onPress={handleCancelBooking}
      style={styles.cancelButton}
      textStyle={styles.cancelButtonText}
    />
  );

  // Show modal outside SafeAreaView for iOS, inside for others
  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primaryBackground}
        />
        <UserCustomHeader title={t('puja_details')} showBackButton={true} />
        <View style={styles.flexGrow}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 40,
                }}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primaryBackgroundButton}
                />
              </View>
            ) : (
              <>
                {renderPujaDetails()}
                {renderTotalAmount()}
                {renderPanditDetails()}
                {renderPanditjiSection()}
                {renderCancelButton()}
              </>
            )}
          </ScrollView>
        </View>
        {Platform.OS !== 'ios' && pujaDetails && (
          <PujaItemsModal
            visible={isPujaItemsModalVisible}
            onClose={handleModalClose}
            userItems={pujaDetails?.user_arranged_items || []}
            panditjiItems={pujaDetails?.pandit_arranged_items || []}
          />
        )}
      </SafeAreaView>
      {Platform.OS === 'ios' && pujaDetails && (
        <PujaItemsModal
          visible={isPujaItemsModalVisible}
          onClose={handleModalClose}
          userItems={pujaDetails?.user_arranged_item || []}
          panditjiItems={pujaDetails?.pandit_arranged_items || []}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  flexGrow: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    // overflow: 'hidden',
  },
  contentContainer: {
    flexGrow: 1,
    padding: moderateScale(24),
    // paddingBottom: verticalScale(100),
  },
  detailsContainer: {
    marginBottom: verticalScale(24),
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  detailsContent: {
    // padding: moderateScale(14),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: verticalScale(14),
    minHeight: verticalScale(48),
  },
  detailRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pujaIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(14),
  },
  pujaTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  detailIcon: {
    marginRight: scale(14),
    width: scale(24),
  },
  detailText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  viewButton: {
    padding: scale(8),
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(2),
    marginHorizontal: 14,
  },
  totalContainer: {
    marginBottom: verticalScale(24),
  },
  totalCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  totalContent: {
    padding: moderateScale(14),
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  totalAmount: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  totalSubtext: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  panditjiContainer: {
    marginBottom: verticalScale(24),
  },
  panditjiCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  panditjiContent: {
    padding: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(68),
  },
  panditjiAvatarContainer: {
    marginRight: scale(14),
  },
  panditjiAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.pujaCardSubtext,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panditjiText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    letterSpacing: -0.333,
    flex: 1,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
    letterSpacing: -0.15,
  },
});

export default UserPujaDetailsScreen;
