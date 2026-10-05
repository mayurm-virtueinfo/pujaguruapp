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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../theme/theme';
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
import Clipboard from '@react-native-clipboard/clipboard';

type PanditDataType = {
  id?: string | number;
  pandit_name?: string;
  profile_img_url?: string | null;
};

type ItemType = {
  name: string;
  quantity: number | string;
  units: string;
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
  user_arranged_items?: ItemType[];
  pandit_arranged_items?: ItemType[];
  assigned_pandit?: PanditDataType | null;
  booking_status?: string;
  verification_pin?: string;
  completion_pin?: string;
  amount?: string | number;
  payment_status?: string;
};

type ScreenNavigationProp = StackNavigationProp<
  UserPoojaListParamList,
  'PujaCancellationScreen' | 'UserChatScreen' | 'RateYourExperienceScreen'
>;

const UserPujaDetailsScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute();
  const { id } = (route.params as { id: string | number }) || {};
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();

  const [isPujaItemsModalVisible, setIsPujaItemsModalVisible] = useState(false);
  const [pujaDetails, setPujaDetails] = useState<PujaDetailsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);
  const [displayPin, setDisplayPin] = useState<{
    value: string;
    type: 'verification' | 'completion' | null;
  }>({ value: '', type: null });
  const [userDetails, setUserDetails] = useState<any>(null);
  const [wasNavigatedToReview, setWasNavigatedToReview] = useState(false);

  const currentLanguage = i18n.language;
  const { messages } = useWebSocket();
  const lastMessageIdRef = useRef<string | null>(null);

  const fetchUserDetails = async () => {
    try {
      const details = await getEditProfile();
      if (details && typeof details === 'object') {
        setUserDetails(details);
      }
    } catch {
      setUserDetails(null);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchInitialPujaDetails = async () => {
    try {
      if (!id) {
        setPujaDetails(null);
        setLoading(false);
        return;
      }
      const details: PujaDetailsType = await getUpcomingPujaDetails(String(id));
      if (!details || typeof details !== 'object') {
        setPujaDetails(null);
        setLoading(false);
        return;
      }
      const translatedDetails = (await translateData(details, currentLanguage, [
        'pooja_name',
        'location_display',
        'muhurat_type',
        'pandit_arranged_items',
        'user_arranged_items',
        'address',
      ])) as PujaDetailsType;

      const safePandit = translatedDetails?.assigned_pandit;
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
      setPujaDetails(translatedDetails);
    } catch (error) {
      console.error('Error fetching puja details:', error);
      setPujaDetails(null);
    } finally {
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
  }, [messages, id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
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

  const copyPinToClipboard = () => {
    if (!displayPin.value) return;
    Clipboard.setString(displayPin.value);
    setCopiedPin(true);
    setTimeout(() => {
      setCopiedPin(false);
    }, 2000);
  };

  const startChatConversation = async () => {
    if (!pujaDetails?.id) {
      Alert.alert(t('error'), t('no_booking_found'), [{ text: t('ok') }]);
      return;
    }
    const payload = {
      booking_id: pujaDetails.id,
    };
    setIsNavigating(true);
    try {
      const response = await postStartChat(payload);
      if (response?.data) {
        navigation.navigate('UserChatScreen', {
          booking_id: response.data.booking_id,
          pandit_name: response.data.other_participant_name,
          profile_img_url: response.data.other_participant_profile_img,
          pandit_id: response.data.other_participant_id,
        });
      }
    } catch (error) {
      console.log('failed_to_start_chat :: ', error);
    } finally {
      setIsNavigating(false);
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
      const userName = `${userDetails?.first_name ?? ''} ${
        userDetails?.last_name ?? ''
      }`.trim();
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
        `*🌸 ${t('puja_invitation')} 🌸*\n\n` +
        `${t('you_are_invited_to_join')} *${pujaName}*.\n\n` +
        `📅 *${t('date')}:* ${date}\n` +
        `⏰ *${t('time')}:* ${time}\n` +
        `📍 *${t('venue')}:* ${location}\n` +
        `🔗 *${t('google_map_link')}:* ${mapLink}\n\n` +
        `${t('looking_forward_to_your_presence')}\n\n` +
        `Sincerely\n` +
        `${userName || 'Family'}`;

      await Share.share({
        message: message,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // Completion navigation
  useEffect(() => {
    if (
      pujaDetails?.booking_status === 'completed' &&
      pujaDetails?.assigned_pandit
    ) {
      setTimeout(() => {
        navigation.navigate('RateYourExperienceScreen', {
          booking: pujaDetails.id,
          panditData: pujaDetails.assigned_pandit,
          panditjiData: pujaDetails.assigned_pandit,
          onGoBack: () => {
            setWasNavigatedToReview(true);
            fetchInitialPujaDetails();
          },
        });
      }, 100);
    }
  }, [pujaDetails?.booking_status, pujaDetails?.assigned_pandit]);

  useEffect(() => {
    if (wasNavigatedToReview) {
      fetchInitialPujaDetails();
      setWasNavigatedToReview(false);
    }
  }, [wasNavigatedToReview]);

  if (
    pujaDetails?.booking_status === 'completed' &&
    pujaDetails?.assigned_pandit
  ) {
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

  const isInProgress = pujaDetails?.booking_status === 'in_progress';
  const pandit = pujaDetails?.assigned_pandit;
  const isAccepted = pujaDetails?.booking_status === 'accepted';
  const totalItemsCount =
    (pujaDetails?.user_arranged_items?.length || 0) +
    (pujaDetails?.pandit_arranged_items?.length || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomeLoader loading={loading && !refreshing} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader title={t('puja_details')} showBackButton={true} />

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: inset.bottom + moderateScale(28) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {pujaDetails && (
            <>
              {/* 1. Dynamic Status Banner: In-Progress vs Upcoming */}
              {isInProgress ? (
                <View style={styles.inProgressBanner}>
                  <View style={styles.bannerHeaderRow}>
                    <View style={styles.livePulseDot}>
                      <View style={styles.livePulseCore} />
                    </View>
                    <Text style={styles.inProgressTitle}>
                      {t('puja_in_progress')}
                    </Text>
                  </View>
                  <Text style={styles.inProgressDesc}>
                    {t('performing_puja')} • {t('you_cannot_chat_during_puja')}
                  </Text>
                </View>
              ) : (
                <View style={styles.upcomingBanner}>
                  <View style={styles.bannerHeaderRow}>
                    <Ionicons
                      name="calendar"
                      size={16}
                      color="#2563EB"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.upcomingTitle}>
                      {t('puja_scheduled')}
                    </Text>
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedBadgeText}>
                        {pujaDetails.booking_status
                          ? pujaDetails.booking_status.toUpperCase()
                          : 'CONFIRMED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.upcomingDesc}>
                    {formatDate(pujaDetails.booking_date)} •{' '}
                    {pujaDetails.muhurat_time || ''}
                  </Text>
                </View>
              )}

              {/* 2. Security PIN Card: Start PIN vs Completion PIN */}
              {displayPin.value ? (
                <View
                  style={[
                    styles.pinCard,
                    isInProgress
                      ? styles.pinCardProgress
                      : styles.pinCardUpcoming,
                  ]}
                >
                  <View style={styles.pinHeaderRow}>
                    <View
                      style={[
                        styles.pinIconBadge,
                        isInProgress
                          ? styles.pinIconBadgeProgress
                          : styles.pinIconBadgeUpcoming,
                      ]}
                    >
                      <Ionicons
                        name={
                          displayPin.type === 'completion'
                            ? 'checkmark-done-circle'
                            : 'key'
                        }
                        size={18}
                        color={isInProgress ? '#D97706' : COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pinTitle}>
                        {displayPin.type === 'completion'
                          ? t('completion_pin')
                          : t('verification_pin')}
                      </Text>
                      <Text style={styles.pinSubtext}>
                        {displayPin.type === 'completion'
                          ? t('share_complete_pin_desc')
                          : t('share_start_pin_desc')}
                      </Text>
                    </View>
                  </View>

                  {/* 4-digit PIN Visual Display */}
                  <View style={styles.pinDigitRow}>
                    {displayPin.value.split('').map((char, index) => (
                      <View
                        key={index}
                        style={[
                          styles.pinDigitBox,
                          isInProgress
                            ? styles.pinDigitBoxProgress
                            : styles.pinDigitBoxUpcoming,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pinDigitText,
                            isInProgress
                              ? styles.pinDigitTextProgress
                              : styles.pinDigitTextUpcoming,
                          ]}
                        >
                          {char}
                        </Text>
                      </View>
                    ))}

                    <TouchableOpacity
                      onPress={copyPinToClipboard}
                      style={styles.copyBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={copiedPin ? 'checkmark' : 'copy-outline'}
                        size={16}
                        color={copiedPin ? '#059669' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.copyBtnText,
                          copiedPin && { color: '#059669' },
                        ]}
                      >
                        {copiedPin ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* 3. Puja Information Card */}
              <View style={styles.card}>
                <View style={styles.pujaHeaderRow}>
                  <Image
                    source={{
                      uri: getPujaImageUrl(pujaDetails?.pooja_image_url),
                    }}
                    style={styles.pujaImage}
                  />
                  <View style={styles.pujaHeaderInfo}>
                    <Text style={styles.pujaTitle} numberOfLines={2}>
                      {pujaDetails.pooja_name || t('puja')}
                    </Text>
                    {!!pujaDetails.muhurat_type && (
                      <View style={styles.muhuratChip}>
                        <Ionicons name="sparkles" size={11} color="#D97706" />
                        <Text style={styles.muhuratChipText}>
                          {pujaDetails.muhurat_type}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Date & Time */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('date')}</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(pujaDetails.booking_date) ||
                        t('date_not_available')}
                    </Text>
                  </View>
                </View>

                <View style={styles.innerDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('time')}</Text>
                    <Text style={styles.infoValue}>
                      {pujaDetails.muhurat_time || t('time_not_available')}
                    </Text>
                  </View>
                </View>

                <View style={styles.innerDivider} />

                {/* Venue / Address */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('venue')}</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>
                      {pujaDetails.location_display ||
                        pujaDetails.address ||
                        t('location_not_available')}
                    </Text>
                  </View>
                </View>

                {/* Samagri items row if required */}
                {pujaDetails.samagri_required && (
                  <>
                    <View style={styles.innerDivider} />
                    <TouchableOpacity
                      style={styles.samagriRow}
                      onPress={handlePujaItemsPress}
                      activeOpacity={0.7}
                    >
                      <View style={styles.samagriLeft}>
                        <View style={styles.samagriIconBox}>
                          <Ionicons
                            name="list-outline"
                            size={16}
                            color="#7C3AED"
                          />
                        </View>
                        <View>
                          <Text style={styles.samagriTitle}>
                            {t('puja_items_list')}
                          </Text>
                          {totalItemsCount > 0 && (
                            <Text style={styles.samagriSub}>
                              {totalItemsCount} items arranged
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.samagriRightPill}>
                        <Text style={styles.samagriRightText}>
                          {t('view_puja_items')}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={15}
                          color="#7C3AED"
                        />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* 4. Assigned Panditji Section */}
              {pandit ? (
                <View style={styles.card}>
                  <View style={styles.panditRow}>
                    <Image
                      source={{
                        uri: getPanditImageUrl(pandit.profile_img_url),
                      }}
                      style={styles.panditImage}
                    />
                    <View style={styles.panditInfo}>
                      <Text style={styles.panditLabel}>{t('panditji')}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (pandit.id !== undefined && pandit.id !== null) {
                            // @ts-ignore
                            navigation.navigate('PanditDetailsScreen', {
                              panditId: pandit.id,
                            });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.panditName}>
                          {pandit.pandit_name || t('panditji')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Chat Action Button */}
                    <TouchableOpacity
                      onPress={isInProgress ? undefined : startChatConversation}
                      disabled={isInProgress || isNavigating}
                      style={[
                        styles.chatBtn,
                        isInProgress && styles.chatBtnDisabled,
                      ]}
                      activeOpacity={0.7}
                    >
                      {isNavigating ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                      ) : (
                        <ChatIcon width={22} height={22} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* If in progress, show explanatory note why chat is disabled */}
                  {isInProgress && (
                    <View style={styles.chatDisabledNotice}>
                      <Ionicons
                        name="information-circle"
                        size={14}
                        color="#94A3B8"
                      />
                      <Text style={styles.chatDisabledText}>
                        {t('you_cannot_chat_during_puja')}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.unassignedCard}>
                  <View style={styles.unassignedIconBox}>
                    <Ionicons name="person-outline" size={20} color="#64748B" />
                  </View>
                  <Text style={styles.unassignedText}>
                    {t('panditji_will_be_assigned_soon')}
                  </Text>
                </View>
              )}

              {/* 5. Total Amount & Payment Summary */}
              <View style={styles.card}>
                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.amountLabel}>{t('total_amount')}</Text>
                    <Text style={styles.amountValue}>
                      ₹{' '}
                      {pujaDetails.amount
                        ? Number(pujaDetails.amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                          })
                        : '0'}
                    </Text>
                  </View>

                  <View style={styles.paidBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#059669"
                    />
                    <Text style={styles.paidBadgeText}>
                      {pujaDetails.payment_status === 'success'
                        ? 'PAID'
                        : (pujaDetails.payment_status || 'PAID').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 6. Action Buttons: Upcoming vs In-Progress */}
              <View style={styles.actionsContainer}>
                {isInProgress ? (
                  // When In-Progress: Cannot cancel, puja is live
                  <View style={styles.inProgressNoticeBox}>
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color="#D97706"
                    />
                    <Text style={styles.inProgressNoticeText}>
                      {t('cannot_cancel_in_progress')}
                    </Text>
                  </View>
                ) : (
                  // When Upcoming: Invite Guest & Cancel
                  <>
                    {isAccepted && (
                      <PrimaryButton
                        title={t('invite_guest')}
                        onPress={handleInviteGuest}
                        disabled={isNavigating}
                        style={styles.inviteButton}
                      />
                    )}

                    <TouchableOpacity
                      onPress={handleCancelBooking}
                      disabled={isNavigating}
                      style={styles.cancelBookingBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#DC2626"
                      />
                      <Text style={styles.cancelBookingText}>
                        {t('cancel_booking')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* Puja Items Modal */}
      {pujaDetails && (
        <PujaItemsModal
          visible={isPujaItemsModalVisible}
          onClose={handleModalClose}
          userItems={pujaDetails.user_arranged_items || []}
          panditjiItems={pujaDetails.pandit_arranged_items || []}
        />
      )}
    </SafeAreaView>
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
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
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
    paddingTop: moderateScale(16),
  },

  // Status Banners
  inProgressBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  upcomingBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  livePulseDot: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(8),
  },
  livePulseCore: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#DC2626',
  },
  inProgressTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  inProgressDesc: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#991B1B',
  },
  upcomingTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  confirmedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    marginLeft: 'auto',
  },
  confirmedBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1D4ED8',
  },
  upcomingDesc: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#3B82F6',
  },

  // Security PIN Card
  pinCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: moderateScale(14),
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pinCardUpcoming: {
    borderColor: '#FFE4E6',
  },
  pinCardProgress: {
    borderColor: '#FEF3C7',
  },
  pinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  pinIconBadge: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  pinIconBadgeUpcoming: {
    backgroundColor: '#FFF1F2',
  },
  pinIconBadgeProgress: {
    backgroundColor: '#FEF3C7',
  },
  pinTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
  },
  pinSubtext: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: 2,
  },
  pinDigitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginTop: moderateScale(4),
  },
  pinDigitBox: {
    width: moderateScale(44),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  pinDigitBoxUpcoming: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  pinDigitBoxProgress: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE68A',
  },
  pinDigitText: {
    fontSize: moderateScale(22),
    fontFamily: Fonts.Sen_Bold,
  },
  pinDigitTextUpcoming: {
    color: COLORS.primary,
  },
  pinDigitTextProgress: {
    color: '#D97706',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    marginLeft: 'auto',
    gap: 4,
  },
  copyBtnText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },

  // Base Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: '#EDF2F7',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pujaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pujaImage: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(14),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pujaHeaderInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  pujaTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
  },
  muhuratChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
    alignSelf: 'flex-start',
    marginTop: moderateScale(4),
    gap: 4,
  },
  muhuratChipText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#D97706',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(14),
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: moderateScale(42),
    marginVertical: moderateScale(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(3),
  },
  infoIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textPrimary,
    marginTop: 1,
  },

  // Samagri Row
  samagriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    padding: moderateScale(10),
    borderRadius: moderateScale(14),
    marginTop: moderateScale(6),
  },
  samagriLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  samagriIconBox: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(10),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  samagriTitle: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#6D28D9',
  },
  samagriSub: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#7C3AED',
  },
  samagriRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  samagriRightText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: '#7C3AED',
  },

  // Pandit Card
  panditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditImage: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FFE4E6',
  },
  panditInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  panditLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },
  panditName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  chatBtn: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  chatBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.45,
  },
  chatDisabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: moderateScale(8),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(10),
    gap: 6,
  },
  chatDisabledText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    flex: 1,
  },

  // Unassigned Pandit Card
  unassignedCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  unassignedIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  unassignedText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
    flex: 1,
  },

  // Payment Row
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },
  amountValue: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paidBadgeText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#059669',
  },

  // Bottom Actions
  actionsContainer: {
    marginTop: moderateScale(8),
    gap: moderateScale(12),
  },
  inviteButton: {
    borderRadius: moderateScale(14),
    backgroundColor: COLORS.primaryBackgroundButton,
    height: moderateScale(48),
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  cancelBookingText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#DC2626',
  },
  inProgressNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: moderateScale(12),
    borderRadius: moderateScale(14),
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  inProgressNoticeText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#B45309',
    flex: 1,
  },
});

export default UserPujaDetailsScreen;
