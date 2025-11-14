import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
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

// Utility function: format string or array items to [{ name, quantity, units }]
function normalizeArrangedItems(arr: any) {
  if (Array.isArray(arr)) {
    // Array of strings: ['item1', 'item2']
    if (arr.every(item => typeof item === 'string')) {
      return arr.map(name => ({
        name: name,
        quantity: '',
        units: '',
      }));
    }
    // Already in [{ name, quantity, units }]
    if (arr.every(item => typeof item === 'object' && item.name)) {
      return arr;
    }
    // Fallback: array of numbers or mixed
    return arr.map(item => ({
      name: String(item),
      quantity: '',
      units: '',
    }));
  } else if (typeof arr === 'string' && arr) {
    // Single comma-separated string
    return arr.split(',').map((name: string) => ({
      name: name.trim(),
      quantity: '',
      units: '',
    }));
  }
  return [];
}

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
  const [originalPujaDetails, setOriginalPujaDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showSuccessToast } = useCommonToast();
  const [showMorePanditArranged, setShowMorePanditArranged] = useState(false);
  const [showMoreUserArranged, setShowMoreUserArranged] = useState(false);

  console.log('pujaDetails :: ', pujaDetails);

  const fetchPujaDetails = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setPujaDetails(cachedData);
        setLoading(false);
        return;
      }

      const details = await getUpcomingPujaDetails(bookingId?.toString());

      setOriginalPujaDetails(details);

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
      setPujaDetails(null);
      setOriginalPujaDetails(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, currentLanguage]);

  useEffect(() => {
    fetchPujaDetails();
  }, [bookingId, fetchPujaDetails]);

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

  const getPujaImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `https://pujapaath.com${url}`;
  };

  const renderArrangedItemsSection = () => {
    if (!pujaDetails) return null;

    const pandit_arranged_items_norm = normalizeArrangedItems(
      pujaDetails.pandit_arranged_items,
    );
    const user_arranged_items_norm = normalizeArrangedItems(
      pujaDetails.user_arranged_items,
    );

    const hasPanditItems = pandit_arranged_items_norm.length > 0;
    const hasUserItems = user_arranged_items_norm.length > 0;

    // If both are empty, show a fallback
    if (!hasPanditItems && !hasUserItems) {
      return (
        <View style={styles.arrangedItemsContainer}>
          <View style={[styles.arrangedSection, THEMESHADOW.shadow]}>
            <Text style={styles.arrangedSectionTitle}>
              {t('arranged_items')}
            </Text>
            <Text style={styles.noItemsText}>
              {t('no_items_available') || 'No items available'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.arrangedItemsContainer}>
        {/* Pandit Arranged Items */}
        <View style={[styles.arrangedSection, THEMESHADOW.shadow]}>
          <Text style={styles.arrangedSectionTitle}>
            {t('pandit_arranged_items')}
          </Text>
          <View style={styles.arrangedList}>
            {hasPanditItems ? (
              (showMorePanditArranged
                ? pandit_arranged_items_norm
                : pandit_arranged_items_norm.slice(0, 1)
              ).map((item: any, idx: number) => (
                <View key={`pandit-item-${idx}`} style={styles.arrangedItemRow}>
                  <View style={styles.redDot} />
                  <Text style={styles.arrangedItemName}>
                    {item.name}
                    {/* Only show " - qty unit" if quantity or units present */}
                    {item.quantity || item.units
                      ? ` - ${item.quantity ? item.quantity : ''}${
                          item.units ? ` ${item.units}` : ''
                        }`
                      : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>
                {t('no_pandit_items') || 'No Pandit arranged items'}
              </Text>
            )}
            {hasPanditItems && pandit_arranged_items_norm.length > 1 && (
              <TouchableOpacity
                onPress={() =>
                  setShowMorePanditArranged(!showMorePanditArranged)
                }
                style={{ paddingVertical: 6 }}
              >
                <Text
                  style={{
                    color: COLORS.primaryBackgroundButton,
                    fontFamily: Fonts.Sen_Medium,
                  }}
                >
                  {showMorePanditArranged
                    ? t('show_less') || 'Show Less'
                    : t('show_more') || 'Show More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User Arranged Items */}
        <View style={[styles.arrangedSection, THEMESHADOW.shadow]}>
          <Text style={styles.arrangedSectionTitle}>
            {t('user_arranged_items')}
          </Text>
          <View style={styles.arrangedList}>
            {hasUserItems ? (
              (showMoreUserArranged
                ? user_arranged_items_norm
                : user_arranged_items_norm.slice(0, 1)
              ).map((item: any, idx: number) => (
                <View key={`user-item-${idx}`} style={styles.arrangedItemRow}>
                  <View style={styles.redDot} />
                  <Text style={styles.arrangedItemName}>
                    {item.name}
                    {item.quantity || item.units
                      ? ` - ${item.quantity ? item.quantity : ''}${
                          item.units ? ` ${item.units}` : ''
                        }`
                      : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>
                {t('no_user_items') || 'No User arranged items'}
              </Text>
            )}
            {hasUserItems && user_arranged_items_norm.length > 1 && (
              <TouchableOpacity
                onPress={() => setShowMoreUserArranged(!showMoreUserArranged)}
                style={{ paddingVertical: 6 }}
              >
                <Text
                  style={{
                    color: COLORS.primaryBackgroundButton,
                    fontFamily: Fonts.Sen_Medium,
                  }}
                >
                  {showMoreUserArranged
                    ? t('show_less') || 'Show Less'
                    : t('show_more') || 'Show More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
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
                      ? { uri: getPujaImageUrl(pujaDetails.pooja_image_url) }
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
    if (!pandit || typeof pandit === 'string') return null;
    return (
      <View style={styles.totalContainer}>
        <View style={[styles.totalCard, THEMESHADOW.shadow]}>
          <View style={styles.totalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={{
                  uri:
                    pandit.profile_img_url ||
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
                }}
                style={styles.pujaIcon}
              />
              <Text style={styles.totalSubtext}>
                {pandit.pandit_name || t('panditji')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPanditjiSection = () => {
    if (!pujaDetails) return null;
    // Only show if no assigned_pandit or it is a "not assigned" string
    if (
      pujaDetails.assigned_pandit &&
      typeof pujaDetails.assigned_pandit !== 'string'
    )
      return null;
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

  // Handler for "I am waiting" (auto mode)
  const onWaitClick = async () => {
    setLoading(true);
    try {
      const response = await updateWaitingUser(bookingId?.toString());
      showSuccessToast(response?.message);
    } catch (e) {
      console.log('error in i am waiting button :: ', e);
    } finally {
      setLoading(false);
    }
  };

  // Handler for "Choose Another Panditji" (manual mode)
  const onChoosePanditClick = () => {
    if (!pujaDetails.assigned_pandit?.id) {
      navigation.navigate('FilteredPanditListScreen', {
        booking_id: bookingId,
      });
    } else {
      showSuccessToast(t('panditji_confirmation'));
    }
  };

  // Bottom action bar logic based on assignment_mode
  const renderBottomActions = () => {
    if (!pujaDetails) return null;

    // assignment_mode: 1 = auto, 2 = manual
    if (pujaDetails?.assignment_mode === 1) {
      // Auto mode: show "I am waiting"
      return (
        <View style={styles.bottomActionsContainer}>
          <PrimaryButton
            title={t('i_am_waiting') || 'I am waiting'}
            onPress={onWaitClick}
            style={styles.bottomPrimaryButton}
            textStyle={styles.bottomPrimaryButtonText}
            disabled={loading}
          />
          <PrimaryButtonOutlined
            title={t('cancel') || 'Cancel'}
            onPress={() => {
              navigation.navigate('PujaCancellationScreen', { id: bookingId });
            }}
            style={styles.bottomOutlinedButton}
            textStyle={styles.bottomOutlinedButtonText}
            disabled={loading}
          />
        </View>
      );
    } else if (pujaDetails?.assignment_mode === 2) {
      // Manual mode: show "Choose Another Panditji"
      return (
        <View style={styles.bottomActionsContainer}>
          <PrimaryButton
            title={t('choose_another_panditji') || 'Choose Another Panditji'}
            onPress={onChoosePanditClick}
            style={styles.bottomPrimaryButton}
            textStyle={styles.bottomPrimaryButtonText}
            disabled={loading}
          />
          <PrimaryButtonOutlined
            title={t('cancel') || 'Cancel'}
            onPress={() => {
              navigation.navigate('PujaCancellationScreen', { id: bookingId });
            }}
            style={styles.bottomOutlinedButton}
            textStyle={styles.bottomOutlinedButtonText}
            disabled={loading}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
          >
            {renderPanditDetails()}
            {renderPanditjiSection()}
            {renderPujaDetails()}
            {renderArrangedItemsSection()}
            {renderTotalAmount()}
          </ScrollView>
        </View>
        {!loading && renderBottomActions()}
      </View>
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
  },
  contentContainer: {
    flexGrow: 1,
    padding: moderateScale(24),
  },
  detailsContainer: {
    marginBottom: verticalScale(24),
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  detailsContent: {},
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
    color: COLORS.primary,
    flex: 1,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
  },
  // Arranged Items styles
  arrangedItemsContainer: {
    marginBottom: verticalScale(12),
  },
  arrangedSection: {
    marginBottom: verticalScale(12),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
  },
  arrangedSectionTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    // marginBottom: verticalScale(8),
  },
  arrangedList: {},
  arrangedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separatorColor,
  },

  arrangedItemName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    flex: 1,
    marginTop: 6,
  },
  arrangedItemQty: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    marginLeft: scale(10),
    minWidth: scale(60),
    textAlign: 'right',
  },
  // Bottom actions styles
  bottomActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(14),
    paddingTop: moderateScale(4),
    backgroundColor: COLORS.pujaBackground,
    gap: moderateScale(24),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomOutlinedButton: {
    flex: 1,
    marginRight: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  bottomPrimaryButton: {
    flex: 1,
    marginLeft: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  bottomOutlinedButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
  },
  bottomPrimaryButtonText: {
    textAlign: 'center',
  },
  redDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: COLORS.primary,
    marginRight: scale(10),
    marginLeft: 10,
    marginTop: 6,
  },
  noItemsText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    marginTop: verticalScale(6),
    textAlign: 'center',
  },
});

export default ConfirmPujaDetails;
