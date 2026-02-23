import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, scale } from 'react-native-size-matters';
import {
  COLORS,
  COMMON_CARD_STYLE,
  COMMON_LIST_STYLE,
} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PujaItemsModal from '../../../components/PujaItemsModal';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { Images } from '../../../theme/Images';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import { useTranslation } from 'react-i18next';
import {
  getUpcomingPujaDetails,
  postStartChat,
  getEditProfile,
} from '../../../api/apiService';
import { translateData, translateText } from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';
import { useWebSocket } from '../../../context/WebSocketContext';
import ChatIcon from '../../../assets/svg/chat.svg';

type PanditDataType = {
  id?: string | number;
  pandit_name?: string;
  profile_img_url?: string | null;
};

type PujaDetailsType = {
  id?: number | string;
  pooja_name?: string;
  pooja_image_url?: string | null;
  location_display?: string;
  address?: string;
  booking_date?: string | null;
  muhurat_time?: string | null;
  muhurat_type?: string | null;
  samagri_required?: boolean;
  user_arranged_items?: any[];
  pandit_arranged_items?: any[];
  assigned_pandit?: PanditDataType | null;
  booking_status?: string;
  verification_pin?: string;
  completion_pin?: string;
  amount?: string | number;
};

const UserPujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PujaCancellationScreen' | 'UserChatScreen' | 'RateYourExperienceScreen'
  >;

  const route = useRoute();
  const { id } = (route.params as { id: string | number }) || {};
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();

  const [isPujaItemsModalVisible, setIsPujaItemsModalVisible] = useState(false);
  const [pujaDetails, setPujaDetails] = useState<PujaDetailsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [displayPin, setDisplayPin] = useState<{
    value: string;
    type: 'verification' | 'completion' | null;
  }>({ value: '', type: null });
  const [userDetails, setUserDetails] = useState<any>(null);

  const [initialLoaded, setInitialLoaded] = useState(false);

  const [wasNavigatedToReview, setWasNavigatedToReview] = useState(false);

  const currentLanguage = i18n.language;

  const { messages } = useWebSocket();
  console.log('webSocket messages in UserPujaDetailsScreen :: ', messages);

  const lastMessageIdRef = useRef<string | null>(null);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const details = await getEditProfile();
      if (!details || typeof details !== 'object') {
        setUserDetails(null);
        setLoading(false);
        return;
      }
      setUserDetails(details);
    } catch (error) {
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchInitialPujaDetails = async () => {
    setLoading(true);
    try {
      if (!id) {
        setPujaDetails(null);
        setInitialLoaded(true);
        setLoading(false);
        return;
      }
      const details: PujaDetailsType = await getUpcomingPujaDetails(String(id));
      if (!details || typeof details !== 'object') {
        setPujaDetails(null);
        setInitialLoaded(true);
        setLoading(false);
        return;
      }
      const translatedDetails = await translateData(details, currentLanguage, [
        'pooja_name',
        'location_display',
        'muhurat_type',
        'pandit_arranged_items',
        'user_arranged_items',
        'address',
      ]);
      let safePandit =
        translatedDetails && typeof translatedDetails === 'object'
          ? (translatedDetails as PujaDetailsType).assigned_pandit
          : undefined;
      if (
        safePandit &&
        typeof safePandit === 'object' &&
        typeof safePandit.pandit_name === 'string'
      ) {
        safePandit.pandit_name = await translateText(
          safePandit.pandit_name,
          currentLanguage,
        );
      }
      setPujaDetails(translatedDetails as PujaDetailsType);
    } catch (error) {
      setPujaDetails(null);
    } finally {
      setInitialLoaded(true);
      setLoading(false);
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length === 0) return;

    const latest = messages[messages.length - 1];
    const messageKey = JSON.stringify(latest);

    if (lastMessageIdRef.current === messageKey) return;
    lastMessageIdRef.current = messageKey;

    const { type, action, booking_id } = latest;

    if (type === 'booking_update' && String(booking_id) === String(id)) {
      console.log(`🔔 Booking #${booking_id} ${action}`);

      setTimeout(() => {
        fetchInitialPujaDetails();
      }, 1000);
    }
  }, [messages, id, fetchInitialPujaDetails]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setInitialLoaded(false);

    fetchInitialPujaDetails().then(() => {
      if (!isMounted) return;
    });

    return () => {
      isMounted = false;
    };
  }, [currentLanguage, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialPujaDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    // Pin value update based on booking status
    if (!pujaDetails) {
      setDisplayPin({ value: '', type: null });
      return;
    }
    let pinVal = '';
    let pinType: 'verification' | 'completion' | null = null;
    if (
      pujaDetails.booking_status === 'in_progress' &&
      pujaDetails.completion_pin
    ) {
      pinVal = pujaDetails.completion_pin;
      pinType = 'completion';
    } else if (
      ['accepted', 'confirmed', 'pending'].includes(
        pujaDetails.booking_status ?? '',
      ) &&
      pujaDetails.verification_pin
    ) {
      pinVal = pujaDetails.verification_pin;
      pinType = 'verification';
    }
    setDisplayPin({ value: pinVal, type: pinType });
  }, [pujaDetails]);

  const handlePujaItemsPress = () => {
    setIsPujaItemsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsPujaItemsModalVisible(false);
  };

  const startChatConversation = async () => {
    if (!pujaDetails?.id) {
      Alert.alert(t('error'), t('no_booking_found'), [{ text: t('ok') }]);
      return;
    }
    const payload = {
      booking_id: pujaDetails.id,
    };
    setLoading(true);
    try {
      const response = await postStartChat(payload);
      if (response?.data) {
        navigation.navigate('UserChatScreen', {
          booking_id: response.data.booking_id,
          pandit_name: response.data.other_participant_name,
          profile_img_url: response.data.other_participant_profile_img,
          pandit_id: response.data.other_participant_id,
        });
      } else {
        console.log('failed_to_start_chat :: ', response);
      }
    } catch (error) {
      console.log('failed_to_start_chat :: ', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
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
    } catch {
      return dateStr ?? '';
    }
  };

  const getPanditImageUrl = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return Images.ic_app_logo;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  const getPujaImageUrl = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return Images.ic_app_logo;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  const renderPujaDetails = () => {
    if (!pujaDetails || typeof pujaDetails !== 'object') return null;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsCard}>
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <View style={styles.detailRowContent}>
                <Image
                  source={{
                    uri: getPujaImageUrl(pujaDetails?.pooja_image_url),
                  }}
                  style={styles.pujaIcon}
                />
                <Text style={styles.pujaTitle}>
                  {pujaDetails.pooja_name || t('puja')}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <MaterialIcons
                name="location-on"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText} numberOfLines={2}>
                {pujaDetails.location_display ||
                  pujaDetails.address ||
                  t('location_not_available')}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <MaterialIcons
                name="event"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {formatDate(pujaDetails.booking_date) ||
                  t('date_not_available')}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <MaterialIcons
                name="access-time"
                size={scale(24)}
                color={COLORS.pujaCardSubtext}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>
                {pujaDetails.muhurat_time
                  ? `${pujaDetails.muhurat_time} ${
                      pujaDetails.muhurat_type
                        ? `(${pujaDetails.muhurat_type})`
                        : ''
                    }`
                  : t('time_not_available')}
              </Text>
            </View>

            <View style={styles.separator} />

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
                    onPress={handlePujaItemsPress}
                    accessible
                    accessibilityLabel={t('view_puja_items')}
                  >
                    <MaterialIcons
                      name="visibility"
                      size={scale(20)}
                      color={COLORS.primaryBackgroundButton}
                    />
                  </TouchableOpacity>
                </View>
                {displayPin.value && <View style={styles.separator} />}
              </>
            ) : null}

            {displayPin.value && (
              <View style={styles.detailRow}>
                <Image
                  source={Images.ic_pin}
                  style={[
                    styles.detailIcon,
                    { width: moderateScale(20), height: moderateScale(16) },
                  ]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.detailText,
                    {
                      color:
                        displayPin.type === 'completion'
                          ? COLORS.primaryBackgroundButton
                          : COLORS.primaryTextDark,
                      fontFamily: Fonts.Sen_SemiBold,
                    },
                  ]}
                >
                  {displayPin.type === 'verification'
                    ? `${displayPin.value}: ${t('verification_pin')}`
                    : displayPin.type === 'completion'
                    ? `${displayPin.value}: ${t('completion_pin')}`
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
        <View style={styles.totalCard}>
          <View style={styles.totalContent}>
            <View style={{ gap: 6 }}>
              <Text style={styles.totalLabel}>{t('total_amount')}</Text>
              <Text style={styles.totalSubtext}>
                {pujaDetails.pooja_name || t('puja')}
              </Text>
            </View>
            <View>
              <Text style={styles.totalAmount}>
                ₹{' '}
                {pujaDetails.amount
                  ? Number(pujaDetails.amount).toLocaleString('en-IN', {
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
    if (!pandit || typeof pandit !== 'object') return null;

    const isInProgress = pujaDetails.booking_status === 'in_progress';

    return (
      <View style={styles.totalContainer}>
        <View style={styles.totalCard}>
          <View style={styles.totalContent}>
            {/* Left section: pandit info */}
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              {pandit?.profile_img_url && (
                <Image
                  source={{ uri: getPanditImageUrl(pandit?.profile_img_url) }}
                  style={styles.pujaIcon}
                />
              )}
              <View style={{ flex: 1, marginLeft: scale(12) }}>
                <TouchableOpacity
                  onPress={() => {
                    if (pandit.id !== undefined && pandit.id !== null) {
                      // @ts-ignore
                      navigation.navigate('PanditDetailsScreen', {
                        panditId: pandit.id,
                      });
                    }
                  }}
                  accessible
                  accessibilityLabel={t('view_pandit_details')}
                >
                  <Text style={styles.totalSubtext}>
                    {pandit.pandit_name || t('panditji')}
                  </Text>
                </TouchableOpacity>

                {pujaDetails.booking_status === 'in_progress' && (
                  <Text
                    style={{
                      color: COLORS.pujaCardSubtext,
                      fontSize: moderateScale(12),
                      marginTop: 4,
                      fontFamily: Fonts.Sen_Medium,
                    }}
                  >
                    {t('you_cannot_chat_during_puja')}
                  </Text>
                )}
              </View>
            </View>

            {/* Right section: chat icon */}
            <TouchableOpacity
              onPress={isInProgress ? undefined : startChatConversation}
              accessible
              accessibilityLabel={t('start_chat')}
              disabled={isInProgress || isNavigating}
              style={{ opacity: isInProgress ? 0.4 : 1 }}
            >
              {isNavigating ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primaryBackgroundButton}
                />
              ) : (
                <ChatIcon />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPanditjiSection = () => {
    if (!pujaDetails) return null;
    if (pujaDetails.assigned_pandit) return null;
    return (
      <View style={styles.panditjiContainer}>
        <View style={styles.panditjiCard}>
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
    if (pujaDetails?.booking_status === 'in_progress') {
      Alert.alert(t('cannot_cancel'), t('cannot_cancel_in_progress'), [
        { text: t('ok') },
      ]);
      return;
    }
    if (pujaDetails?.booking_status === 'completed') {
      Alert.alert(t('cannot_cancel'), t('cannot_cancel_completed'), [
        { text: t('ok') },
      ]);
      return;
    }
    navigation.navigate('PujaCancellationScreen', { id });
  };

  const handleInviteGuest = async () => {
    try {
      if (!pujaDetails) return;

      const pujaName = pujaDetails.pooja_name || t('puja');
      const userName = userDetails?.first_name + ' ' + userDetails?.last_name;
      const date =
        formatDate(pujaDetails.booking_date) || t('date_not_available');
      const time = pujaDetails.muhurat_time || t('time_not_available');
      const location =
        pujaDetails.location_display ||
        pujaDetails.address ||
        t('location_not_available');

      const mapLink = `https://maps.google.com/?q=${encodeURIComponent(
        location,
      )}`;

      const message =
        `*🌸${t('puja_invitation')}🌸*\n\n` +
        `${t('you_are_invited_to_join')} *${pujaName}*.\n\n` +
        `📅 *${t('date')}:* ${date}\n` +
        `⏰ *${t('time')}:* ${time}\n` +
        `📍 *${t('venue')}:* ${location}\n` +
        `🔗 *${t('google_map_link')}:* ${mapLink}\n\n` +
        `${t('looking_forward_to_your_presence')}\n\n` +
        `Sincerely\n` +
        `${userName} & Family`;

      await Share.share({
        message: message,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const renderInviteGuestButton = () => {
    if (pujaDetails?.booking_status !== 'accepted') return null;
    return (
      <PrimaryButton
        title={t('invite_guest')}
        onPress={handleInviteGuest}
        disabled={isNavigating}
        style={styles.inviteButton}
      />
    );
  };

  const renderCancelButton = () => (
    <PrimaryButton
      title={t('cancel_booking')}
      onPress={handleCancelBooking}
      disabled={
        pujaDetails?.booking_status === 'in_progress' ||
        pujaDetails?.booking_status === 'completed' ||
        isNavigating
      }
    />
  );

  // Important: navigation logic for RateYourExperienceScreen
  useEffect(() => {
    if (
      pujaDetails?.booking_status === 'completed' &&
      pujaDetails?.assigned_pandit
    ) {
      console.log(
        'Navigating to RateYourExperienceScreen - bookingId:',
        pujaDetails.id,
        'panditjiData:',
        pujaDetails.assigned_pandit,
      );
      setTimeout(() => {
        navigation.navigate('RateYourExperienceScreen', {
          booking: pujaDetails.id,
          panditData: pujaDetails.assigned_pandit,
          panditjiData: pujaDetails.assigned_pandit,
          onGoBack: () => {
            setWasNavigatedToReview(true);
            fetchInitialPujaDetails();
            console.log('Returned from RateYourExperienceScreen');
          },
        });
      }, 100);
    }
  }, [isNavigating, pujaDetails?.booking_status, pujaDetails?.assigned_pandit]);

  useEffect(() => {
    if (wasNavigatedToReview) {
      console.log(
        'Trigger: wasNavigatedToReview is true, fetchInitialPujaDetails',
      );
      fetchInitialPujaDetails();
      setWasNavigatedToReview(false);
    }
  }, [wasNavigatedToReview]);

  if (
    pujaDetails?.booking_status === 'completed' &&
    pujaDetails?.assigned_pandit
  ) {
    console.log('Showing completion loader before navigation');
    return (
      <View style={styles.loaderContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primaryBackground}
        />
        <UserCustomHeader title={t('puja_details')} showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primaryBackgroundButton}
          />
          <Text style={styles.loadingText}>{t('processing_completion')}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <CustomeLoader loading={loading} />
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primaryBackground}
        />
        <UserCustomHeader title={t('puja_details')} showBackButton={true} />
        <View style={styles.flexGrow}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primaryBackgroundButton}
                colors={[COLORS.primaryBackground]}
              />
            }
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.groupsContainer}>
              {renderPujaDetails()}
              {renderTotalAmount()}
              {renderPanditDetails()}
              {renderPanditjiSection()}
            </View>
            {loading ? null : (
              <>
                {renderInviteGuestButton()}
                {renderCancelButton()}
              </>
            )}
          </ScrollView>
        </View>

        {/* Android Modal */}
        {Platform.OS !== 'ios' && pujaDetails && (
          <PujaItemsModal
            visible={isPujaItemsModalVisible}
            onClose={handleModalClose}
            userItems={pujaDetails?.user_arranged_items || []}
            panditjiItems={pujaDetails?.pandit_arranged_items || []}
          />
        )}
      </SafeAreaView>

      {/* iOS Modal */}
      {Platform.OS === 'ios' && pujaDetails && (
        <PujaItemsModal
          visible={isPujaItemsModalVisible}
          onClose={handleModalClose}
          userItems={pujaDetails?.user_arranged_items || []}
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
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(16),
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  flexGrow: {
    flexGrow: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  contentContainer: {
    flexGrow: 1,
    padding: moderateScale(24),
  },
  groupsContainer: {
    gap: moderateScale(24),
  },
  detailsContainer: {},
  detailsCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  detailsContent: {},
  detailRow: {
    ...COMMON_CARD_STYLE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pujaIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(14),
  },
  pujaTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  detailIcon: {
    marginRight: moderateScale(14),
    width: moderateScale(24),
  },
  detailText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  viewButton: {},
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  totalContainer: {},
  totalCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  totalContent: {
    ...COMMON_CARD_STYLE,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  totalAmount: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  totalSubtext: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  panditjiContainer: {},
  panditjiCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  panditjiContent: {
    ...COMMON_CARD_STYLE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditjiAvatarContainer: {
    marginRight: moderateScale(14),
  },
  panditjiAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.pujaCardSubtext,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panditjiText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    flex: 1,
  },
  inviteButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginTop: moderateScale(24),
  },
});

export default UserPujaDetailsScreen;
