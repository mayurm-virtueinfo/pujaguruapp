import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { getPastBookings } from '../../../api/apiService';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';

const DEFAULT_PUJA_IMAGE =
  'https://as2.ftcdn.net/v2/jpg/06/68/18/97/1000_F_668189711_Esn6zh9PEetE727cyIc9U34NjQOS1b35.jpg';

const DEFAULT_PANDIT_AVATAR =
  'https://cdn.builder.io/api/v1/image/assets/TEMP/db9492299c701c6ca2a23d6de9fc258e7ec2b5fd?width=160';

const SAMAGRI_COLLAPSE_COUNT = 4;

type ItemType =
  | string
  | {
      name?: string;
      item_name?: string;
      quantity?: string | number;
      units?: string;
    };

type AssignedPanditType = {
  pandit_name?: string;
  profile_img_url?: string | null;
  phone?: string | null;
};

type PastBookingDetailsType = {
  id: number | string;
  pooja_name?: string;
  pooja_image_url?: string | null;
  booking_date?: string;
  muhurat_time?: string | null;
  muhurat_type?: string | null;
  tirth_place_name?: string | null;
  amount?: string | number;
  payment_status?: string | null;
  booking_status?: string;
  notes?: string | null;
  samagri_required?: boolean;
  address_details?: any;
  address?: string | null;
  location_display?: string | null;
  assigned_pandit?: AssignedPanditType | null;
  user_arranged_items?: ItemType[];
  pandit_arranged_items?: ItemType[];
};

const PastBookingDetailsScreen = ({ navigation }: { navigation?: any }) => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { pujaId, id } = (route.params as any) || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] =
    useState<PastBookingDetailsType | null>(null);
  const [samagriExpand, setSamagriExpand] = useState<'user' | 'pandit' | null>(
    null,
  );
  const [heroImageError, setHeroImageError] = useState(false);
  const [panditImageError, setPanditImageError] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response: any = await getPastBookings();
      const data = response?.data;
      let matched: PastBookingDetailsType | null = null;
      if (data && Array.isArray(data)) {
        matched =
          data.find(item => String(item.id) === String(pujaId || id)) || null;
      }
      setBookingDetails(matched);
    } catch {
      setError(t('error_loading_data') || 'Error loading ceremony details');
      setBookingDetails(null);
    } finally {
      setLoading(false);
    }
  }, [pujaId, id, t]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const formatDateWithOrdinal = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
          const s = ['th', 'st', 'nd', 'rd'];
          const v = day % 100;
          const ordinal = s[(v - 20) % 10] || s[v] || s[0];
          return `${day}${ordinal} ${months[monthIndex]} ${year}`;
        }
      }

      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString('en-US', { month: 'long' });
      const year = dateObj.getFullYear();
      const s = ['th', 'st', 'nd', 'rd'];
      const v = day % 100;
      const ordinal = s[(v - 20) % 10] || s[v] || s[0];
      return `${day}${ordinal} ${month} ${year}`;
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
        bannerTitle: t('ceremony_completed') || 'Ceremony Completed',
        bannerSub:
          t('ceremony_completed_desc') ||
          'All sacred rituals concluded with divine Vedic blessings.',
      };
    }
    if (s.includes('cancel')) {
      return {
        label: t('cancelled') || 'Cancelled',
        textColor: '#DC2626',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        icon: 'close-circle' as const,
        bannerTitle: t('booking_cancelled') || 'Booking Cancelled',
        bannerSub:
          t('booking_cancelled_desc') || 'This ceremony booking was cancelled.',
      };
    }
    if (s.includes('reject')) {
      return {
        label: t('rejected') || 'Rejected',
        textColor: '#DC2626',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        icon: 'alert-circle' as const,
        bannerTitle: t('booking_rejected') || 'Booking Rejected',
        bannerSub:
          t('booking_rejected_desc') ||
          'This ceremony booking could not be accepted.',
      };
    }
    return {
      label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Archived',
      textColor: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      icon: 'bookmark' as const,
      bannerTitle: t('past_booking') || 'Past Ceremony',
      bannerSub:
        t('past_booking_desc') ||
        'Archived record of previously scheduled ritual.',
    };
  };

  const getPaymentBadge = (status?: string | null) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('success') || s.includes('paid') || s.includes('complete')) {
      return {
        label: t('paid') || 'Paid',
        textColor: '#059669',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        icon: 'checkmark-circle' as const,
      };
    }
    if (s.includes('pending')) {
      return {
        label: t('pending') || 'Pending',
        textColor: '#D97706',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        icon: 'time' as const,
      };
    }
    return {
      label: s ? s.charAt(0).toUpperCase() + s.slice(1) : t('paid') || 'Paid',
      textColor: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      icon: 'checkmark-circle' as const,
    };
  };

  const getAddressString = (addressData: any) => {
    if (!addressData) return '';
    if (typeof addressData === 'string') return addressData;
    if (typeof addressData === 'object' && addressData.full_address) {
      return addressData.full_address;
    }
    if (typeof addressData === 'object' && addressData.address_line1) {
      return [
        addressData.address_line1,
        addressData.address_line2,
        addressData.city,
        addressData.state,
      ]
        .filter(Boolean)
        .join(', ');
    }
    return '';
  };

  const flattenItems = (arr: any[] = []): ItemType[] => {
    if (!Array.isArray(arr)) return [];
    return arr.flat ? arr.flat().filter(Boolean) : arr.filter(Boolean);
  };

  const handleCallPandit = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <UserCustomHeader
          title={t('past_booking_details') || 'Ceremony Details'}
          showBackButton
          onBackPress={() => navigation?.goBack && navigation.goBack()}
        />
        <View style={styles.centered}>
          <View style={styles.errorIconCircle}>
            <Ionicons
              name="alert-circle"
              size={moderateScale(38)}
              color="#DC2626"
            />
          </View>
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBookingDetails}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#FFFFFF"
              style={styles.btnIconMargin}
            />
            <Text style={styles.retryButtonText}>{t('retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!bookingDetails && !loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <UserCustomHeader
          title={t('past_booking_details') || 'Ceremony Details'}
          showBackButton
          onBackPress={() => navigation?.goBack && navigation.goBack()}
        />
        <View style={styles.centered}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="document-text-outline"
              size={moderateScale(38)}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {t('no_item_available') || 'No Ceremony Details Found'}
          </Text>
          <Text style={styles.emptySubtext}>
            We could not locate this ceremony record.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack && navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>
              {t('go_back') || 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const {
    pooja_name,
    pooja_image_url,
    booking_date,
    muhurat_time,
    muhurat_type,
    tirth_place_name,
    amount,
    payment_status,
    notes,
    samagri_required,
    address_details,
    booking_status,
    assigned_pandit,
    user_arranged_items,
    pandit_arranged_items,
    address,
    location_display,
  } = bookingDetails || {};

  const userItems = flattenItems(user_arranged_items);
  const panditItems = flattenItems(pandit_arranged_items);
  const statusConfig = getStatusBadge(booking_status);
  const paymentConfig = getPaymentBadge(payment_status);
  const fullAddress =
    getAddressString(address_details) || location_display || address || '';

  const heroImageUri =
    heroImageError || !pooja_image_url ? DEFAULT_PUJA_IMAGE : pooja_image_url;

  const panditImageUri =
    panditImageError || !assigned_pandit?.profile_img_url
      ? DEFAULT_PANDIT_AVATAR
      : assigned_pandit.profile_img_url;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader
        title={t('past_booking_details') || 'Ceremony Details'}
        showBackButton
        onBackPress={() => navigation?.goBack && navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loaderPlaceholder} />
      ) : (
        <View style={styles.sheetContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Status Announcement Banner */}
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: statusConfig.bgColor,
                  borderColor: statusConfig.borderColor,
                },
              ]}
            >
              <View style={styles.statusBannerIconContainer}>
                <Ionicons
                  name={statusConfig.icon}
                  size={moderateScale(24)}
                  color={statusConfig.textColor}
                />
              </View>
              <View style={styles.statusBannerTextContainer}>
                <Text
                  style={[
                    styles.statusBannerTitle,
                    { color: statusConfig.textColor },
                  ]}
                >
                  {statusConfig.bannerTitle}
                </Text>
                <Text style={styles.statusBannerSubtitle}>
                  {statusConfig.bannerSub}
                </Text>
              </View>
            </View>

            {/* 2. Hero Puja Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroImageWrapper}>
                <Image
                  source={{ uri: heroImageUri }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={() => setHeroImageError(true)}
                />
                <View style={styles.heroOverlayBadgeRow}>
                  <View
                    style={[
                      styles.heroStatusPill,
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
                      style={styles.chipIconMargin}
                    />
                    <Text
                      style={[
                        styles.heroStatusPillText,
                        { color: statusConfig.textColor },
                      ]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroCardContent}>
                <Text style={styles.pujaTitle}>
                  {pooja_name || t('puja_name') || 'Sacred Ceremony'}
                </Text>
                {booking_date ? (
                  <View style={styles.heroDateRow}>
                    <Ionicons
                      name="calendar"
                      size={moderateScale(14)}
                      color={COLORS.primary}
                      style={styles.btnIconMargin}
                    />
                    <Text style={styles.heroDateText}>
                      {formatDateWithOrdinal(booking_date)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 3. Key Ceremony Metrics Grid */}
            <View style={styles.statsGrid}>
              {/* Date & Muhurat Card */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, styles.blueBg]}>
                  <Ionicons
                    name="time"
                    size={moderateScale(18)}
                    color="#2563EB"
                  />
                </View>
                <Text style={styles.statLabel}>
                  {t('muhurat') || 'Muhurat & Time'}
                </Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {muhurat_time || '-'}
                </Text>
                {muhurat_type ? (
                  <Text style={styles.statSubText} numberOfLines={1}>
                    {muhurat_type}
                  </Text>
                ) : null}
              </View>

              {/* Dakshina Amount Card */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, styles.greenBg]}>
                  <Ionicons
                    name="cash"
                    size={moderateScale(18)}
                    color="#059669"
                  />
                </View>
                <Text style={styles.statLabel}>
                  {t('amount') || 'Total Dakshina'}
                </Text>
                <Text
                  style={[styles.statValue, styles.greenText]}
                  numberOfLines={1}
                >
                  ₹{amount || '0'}
                </Text>
                <Text style={styles.statSubText} numberOfLines={1}>
                  {paymentConfig.label}
                </Text>
              </View>

              {/* Payment Status Card */}
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconCircle,
                    { backgroundColor: paymentConfig.bgColor },
                  ]}
                >
                  <Ionicons
                    name={paymentConfig.icon}
                    size={moderateScale(18)}
                    color={paymentConfig.textColor}
                  />
                </View>
                <Text style={styles.statLabel}>
                  {t('payment_status') || 'Payment'}
                </Text>
                <Text
                  style={[styles.statValue, { color: paymentConfig.textColor }]}
                  numberOfLines={1}
                >
                  {paymentConfig.label}
                </Text>
                <Text style={styles.statSubText} numberOfLines={1}>
                  {amount ? `₹${amount}` : '-'}
                </Text>
              </View>

              {/* Samagri Status Card */}
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconCircle,
                    samagri_required === true
                      ? styles.greenBg
                      : samagri_required === false
                      ? styles.warmAmberBg
                      : styles.neutralBg,
                  ]}
                >
                  <Ionicons
                    name="basket"
                    size={moderateScale(18)}
                    color={
                      samagri_required === true
                        ? '#059669'
                        : samagri_required === false
                        ? '#D97706'
                        : '#64748B'
                    }
                  />
                </View>
                <Text style={styles.statLabel}>
                  {t('samagri_required') || 'Samagri'}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    samagri_required === true
                      ? styles.greenText
                      : samagri_required === false
                      ? styles.amberDarkText
                      : styles.neutralDarkText,
                  ]}
                  numberOfLines={1}
                >
                  {samagri_required === true
                    ? t('Yes') || 'Provided'
                    : samagri_required === false
                    ? t('No') || 'Not Required'
                    : '-'}
                </Text>
                <Text style={styles.statSubText} numberOfLines={1}>
                  {userItems.length + panditItems.length > 0
                    ? `${userItems.length + panditItems.length} items total`
                    : 'Arrangement recorded'}
                </Text>
              </View>
            </View>

            {/* 4. Assigned Panditji Card */}
            {assigned_pandit && assigned_pandit.pandit_name ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Ionicons
                    name="person-circle"
                    size={moderateScale(18)}
                    color={COLORS.primary}
                    style={styles.btnIconMargin}
                  />
                  <Text style={styles.sectionCardTitle}>
                    {t('assigned_pandit') || 'Officiating Panditji'}
                  </Text>
                </View>

                <View style={styles.panditCardInner}>
                  <View style={styles.panditAvatarWrapper}>
                    <Image
                      source={{ uri: panditImageUri }}
                      style={styles.panditAvatar}
                      resizeMode="cover"
                      onError={() => setPanditImageError(true)}
                    />
                    <View style={styles.verifiedBadgeIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(16)}
                        color="#059669"
                      />
                    </View>
                  </View>

                  <View style={styles.panditDetails}>
                    <Text style={styles.panditName} numberOfLines={1}>
                      {assigned_pandit.pandit_name}
                    </Text>
                    <Text style={styles.panditRoleText}>
                      {t('vedic_pandit') || 'Verified Vedic Priest'}
                    </Text>
                    {assigned_pandit.phone ? (
                      <View style={styles.panditPhoneRow}>
                        <Ionicons
                          name="call-outline"
                          size={moderateScale(12)}
                          color="#64748B"
                          style={styles.chipIconMargin}
                        />
                        <Text style={styles.panditPhoneText}>
                          {assigned_pandit.phone}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {assigned_pandit.phone ? (
                    <TouchableOpacity
                      style={styles.callPanditBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallPandit(assigned_pandit.phone!)}
                    >
                      <Ionicons
                        name="call"
                        size={moderateScale(16)}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* 5. Venue & Address Card */}
            {(tirth_place_name || fullAddress) && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Ionicons
                    name="location-sharp"
                    size={moderateScale(18)}
                    color={COLORS.primary}
                    style={styles.btnIconMargin}
                  />
                  <Text style={styles.sectionCardTitle}>
                    {t('venue_details') || 'Ceremony Location & Venue'}
                  </Text>
                </View>

                {tirth_place_name ? (
                  <View style={styles.tirthRow}>
                    <View style={styles.tirthIconCircle}>
                      <Ionicons
                        name="business"
                        size={moderateScale(15)}
                        color="#D97706"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.tirthLabel}>
                        {t('temple_place') || 'Sacred Pilgrimage / Temple'}
                      </Text>
                      <Text style={styles.tirthValue}>{tirth_place_name}</Text>
                    </View>
                  </View>
                ) : null}

                {fullAddress ? (
                  <View style={styles.addressBox}>
                    <Ionicons
                      name="navigate-circle-outline"
                      size={moderateScale(16)}
                      color="#64748B"
                      style={styles.addressIcon}
                    />
                    <Text style={styles.addressText}>{fullAddress}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* 6. Samagri Arrangement Card */}
            {(userItems.length > 0 || panditItems.length > 0) && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <Ionicons
                    name="sparkles"
                    size={moderateScale(17)}
                    color={COLORS.primary}
                    style={styles.btnIconMargin}
                  />
                  <Text style={styles.sectionCardTitle}>
                    {t('items_arranged') || 'Samagri Arrangement'}
                  </Text>
                </View>

                {/* User Items */}
                {userItems.length > 0 && (
                  <View style={styles.samagriSubSection}>
                    <View style={styles.samagriSubHeader}>
                      <Text style={styles.samagriSubTitle}>
                        {t('user_will_arrange') || 'Items Arranged by You'}
                      </Text>
                      <View style={styles.samagriCountPill}>
                        <Text style={styles.samagriCountPillText}>
                          {userItems.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.samagriChipsRow}>
                      {(samagriExpand === 'user'
                        ? userItems
                        : userItems.slice(0, SAMAGRI_COLLAPSE_COUNT)
                      ).map((item, idx) => {
                        const name =
                          typeof item === 'string'
                            ? item
                            : item.name || item.item_name || '-';
                        return (
                          <View
                            key={`user-samagri-${idx}`}
                            style={styles.samagriChipUser}
                          >
                            <Ionicons
                              name="checkmark"
                              size={moderateScale(11)}
                              color={COLORS.primary}
                              style={styles.chipIconMargin}
                            />
                            <Text style={styles.samagriChipUserText}>
                              {name}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {userItems.length > SAMAGRI_COLLAPSE_COUNT && (
                      <TouchableOpacity
                        style={styles.expandToggleBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          setSamagriExpand(prev =>
                            prev === 'user' ? null : 'user',
                          )
                        }
                      >
                        <Text style={styles.expandToggleText}>
                          {samagriExpand === 'user'
                            ? t('show_less') || 'Show Less'
                            : `+${userItems.length - SAMAGRI_COLLAPSE_COUNT} ${
                                t('show_more') || 'more'
                              }`}
                        </Text>
                        <Ionicons
                          name={
                            samagriExpand === 'user'
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={moderateScale(13)}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Divider between samagri lists if both exist */}
                {userItems.length > 0 && panditItems.length > 0 && (
                  <View style={styles.samagriDivider} />
                )}

                {/* Pandit Items */}
                {panditItems.length > 0 && (
                  <View style={styles.samagriSubSection}>
                    <View style={styles.samagriSubHeader}>
                      <Text style={[styles.samagriSubTitle, styles.amberText]}>
                        {t('pandit_will_arrange') ||
                          'Items Arranged by Panditji'}
                      </Text>
                      <View style={[styles.samagriCountPill, styles.amberBg]}>
                        <Text
                          style={[
                            styles.samagriCountPillText,
                            styles.amberText,
                          ]}
                        >
                          {panditItems.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.samagriChipsRow}>
                      {(samagriExpand === 'pandit'
                        ? panditItems
                        : panditItems.slice(0, SAMAGRI_COLLAPSE_COUNT)
                      ).map((item, idx) => {
                        const name =
                          typeof item === 'string'
                            ? item
                            : item.name || item.item_name || '-';
                        return (
                          <View
                            key={`pandit-samagri-${idx}`}
                            style={styles.samagriChipPandit}
                          >
                            <Ionicons
                              name="sparkles"
                              size={moderateScale(10)}
                              color="#B45309"
                              style={styles.chipIconMargin}
                            />
                            <Text style={styles.samagriChipPanditText}>
                              {name}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {panditItems.length > SAMAGRI_COLLAPSE_COUNT && (
                      <TouchableOpacity
                        style={styles.expandToggleBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          setSamagriExpand(prev =>
                            prev === 'pandit' ? null : 'pandit',
                          )
                        }
                      >
                        <Text
                          style={[styles.expandToggleText, styles.amberText]}
                        >
                          {samagriExpand === 'pandit'
                            ? t('show_less') || 'Show Less'
                            : `+${
                                panditItems.length - SAMAGRI_COLLAPSE_COUNT
                              } ${t('show_more') || 'more'}`}
                        </Text>
                        <Ionicons
                          name={
                            samagriExpand === 'pandit'
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={moderateScale(13)}
                          color="#B45309"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 7. Special Notes Card */}
            {notes ? (
              <View style={styles.notesCard}>
                <View style={styles.notesHeaderRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={moderateScale(16)}
                    color="#D97706"
                    style={styles.btnIconMargin}
                  />
                  <Text style={styles.notesTitle}>
                    {t('notes') || 'Ceremony Notes'}
                  </Text>
                </View>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  loaderPlaceholder: {
    flex: 1,
    backgroundColor: '#F8F9FD',
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
    paddingBottom: moderateScale(20),
  },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    marginBottom: moderateScale(14),
  },
  statusBannerIconContainer: {
    marginRight: moderateScale(12),
  },
  statusBannerTextContainer: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    marginBottom: moderateScale(2),
  },
  statusBannerSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#475569',
    lineHeight: moderateScale(16),
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    marginBottom: moderateScale(14),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2.5,
  },
  heroImageWrapper: {
    width: '100%',
    height: moderateScale(170),
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadgeRow: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },
  heroStatusPillText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
  },
  heroCardContent: {
    padding: moderateScale(16),
  },
  pujaTitle: {
    fontSize: moderateScale(19),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(6),
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDateText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },

  // 2x2 Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(13),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  statIconCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  statLabel: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
    marginBottom: moderateScale(2),
  },
  statValue: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(2),
  },
  statSubText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
  },

  // General Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E8ECF2',
    marginBottom: moderateScale(14),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  sectionCardTitle: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },

  // Pandit Card
  panditCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditAvatarWrapper: {
    position: 'relative',
    marginRight: moderateScale(14),
  },
  panditAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#E2E8F0',
  },
  verifiedBadgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
  },
  panditDetails: {
    flex: 1,
  },
  panditName: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(2),
  },
  panditRoleText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
    marginBottom: moderateScale(4),
  },
  panditPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditPhoneText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  callPanditBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(10),
  },

  // Venue & Tirth
  tirthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tirthIconCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  tirthLabel: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#B45309',
  },
  tirthValue: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: '#78350F',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressIcon: {
    marginRight: moderateScale(8),
    marginTop: moderateScale(1),
  },
  addressText: {
    flex: 1,
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#334155',
    lineHeight: moderateScale(18),
  },

  // Samagri Card
  samagriSubSection: {
    marginBottom: moderateScale(6),
  },
  samagriSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  samagriSubTitle: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },
  samagriCountPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  samagriCountPillText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  samagriChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(7),
  },
  samagriChipUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
  },
  samagriChipUserText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
  },
  samagriChipPandit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(12),
  },
  samagriChipPanditText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#92400E',
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(3),
  },
  expandToggleText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    marginRight: moderateScale(3),
  },
  samagriDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: moderateScale(12),
  },

  // Notes Card
  notesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: moderateScale(16),
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  notesTitle: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#B45309',
  },
  notesText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#78350F',
    lineHeight: moderateScale(18),
  },

  // Centered error / empty states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FD',
    paddingHorizontal: moderateScale(24),
  },
  errorIconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  errorTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
  },
  retryButtonText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#FFFFFF',
  },
  emptyIconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: moderateScale(6),
  },
  emptySubtext: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  backButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  backButtonText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#334155',
  },
  btnIconMargin: {
    marginRight: moderateScale(6),
  },
  chipIconMargin: {
    marginRight: moderateScale(4),
  },
  blueBg: {
    backgroundColor: '#EFF6FF',
  },
  greenBg: {
    backgroundColor: '#ECFDF5',
  },
  greenText: {
    color: '#059669',
  },
  warmAmberBg: {
    backgroundColor: '#FFFBEB',
  },
  neutralBg: {
    backgroundColor: '#F1F5F9',
  },
  amberDarkText: {
    color: '#D97706',
  },
  neutralDarkText: {
    color: '#475569',
  },
  flex1: {
    flex: 1,
  },
  amberText: {
    color: '#B45309',
  },
  amberBg: {
    backgroundColor: '#FEF3C7',
  },
});

export default PastBookingDetailsScreen;
