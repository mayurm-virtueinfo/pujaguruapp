import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import {
  COLORS,
  COMMON_CARD_STYLE,
  COMMON_LIST_STYLE,
} from '../../../theme/theme';
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

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ExpandableSection = ({
  title,
  expanded,
  onPress,
  items,
  emptyText,
}: {
  title: string;
  expanded: boolean;
  onPress: () => void;
  items: any[] | undefined;
  emptyText: string;
}) => {
  const normalizedItems = normalizeArrangedItems(items);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [expanded]);

  return (
    <View style={styles.expandableCard}>
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.headerCardTitle}>{title}</Text>
        <Octicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.black}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandableContent}>
          {!normalizedItems || normalizedItems.length === 0 ? (
            <Text style={styles.itemText}>{emptyText}</Text>
          ) : (
            normalizedItems.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                <View style={styles.itemRow}>
                  <View style={styles.itemMainContent}>
                    <Octicons
                      name="dot-fill"
                      size={12}
                      color={COLORS.black}
                      style={styles.bulletIcon}
                    />
                    <Text style={styles.itemNameText}>{item.name}</Text>
                  </View>
                  {item.quantity ? (
                    <Text style={styles.itemQuantityText}>
                      {`${item.quantity} ${item.units ?? ''}`.trim()}
                    </Text>
                  ) : null}
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      )}
    </View>
  );
};

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
  const [panditItemsExpanded, setPanditItemsExpanded] = useState(false);
  const [userItemsExpanded, setUserItemsExpanded] = useState(false);

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

  const renderPanditArrangedItems = () => {
    if (!pujaDetails) return null;
    const pandit_arranged_items_norm = normalizeArrangedItems(
      pujaDetails.pandit_arranged_items,
    );
    // If no items, we might still want to show the section if desired, but user previously hid if both empty.
    // Let's keep logic: check if ANY items exist overall, if so show sections.
    // But ExpandableSection handles empty state gracefully.
    // However, previous logic was: if BOTH empty, return null (in renderEmptyArrangedItems? No, current logic checks both).

    // Let's simplify: Always render section if it exists in data structure, or follow UI pattern.
    // PujaDetails rendering:
    /*
    <ExpandableSection
        title={t('pandit_arranged_items')}
        expanded={panditItemsExpanded}
        onPress={() => setPanditItemsExpanded(prev => !prev)}
        items={data?.pandit_arranged_items}
        emptyText="No items provided"
        testID="pandit-arranged-items-section"
    />
    */

    // We should check if we should render at all based on previous logic (if both empty, renderEmptyArrangedItems handles it).
    // The previous code had: if (!hasPanditItems && !hasUserItems) return null; inside each function which was weird.
    // Let's replicate strict behavior: if empty, show "No items" inside expandable?
    // User request: "similar with PujaDetailsScreen".
    // In PujaDetailsScreen, sections are always visible.

    return (
      <View style={styles.arrangedSection}>
        <ExpandableSection
          title={t('pandit_arranged_items')}
          expanded={panditItemsExpanded}
          onPress={() => setPanditItemsExpanded(prev => !prev)}
          items={pujaDetails.pandit_arranged_items}
          emptyText={t('no_pandit_items') || 'No items provided'}
        />
      </View>
    );
  };

  const renderUserArrangedItems = () => {
    if (!pujaDetails) return null;

    return (
      <View style={styles.arrangedSection}>
        <ExpandableSection
          title={t('user_arranged_items')}
          expanded={userItemsExpanded}
          onPress={() => setUserItemsExpanded(prev => !prev)}
          items={pujaDetails.user_arranged_items}
          emptyText={t('no_user_items') || 'No items required'}
        />
      </View>
    );
  };

  // renderEmptyArrangedItems logic: if both are shown via ExpandableSection, this might be redundant or we can remove it.
  // In PujaDetailsScreen, there is no "Empty Arranged Items" section. Each section handles its own empty state.
  // So we can return null here to effectively remove it, or remove the call in render.
  const renderEmptyArrangedItems = () => {
    return null;
  };

  const renderPujaDetails = () => {
    if (!pujaDetails) return null;
    return (
      <View style={styles.detailsCard}>
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
              {pujaDetails.muhurat_type ? ` (${pujaDetails.muhurat_type})` : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTotalAmount = () => {
    if (!pujaDetails) return null;
    return (
      <View style={styles.totalCard}>
        <View style={styles.totalContent}>
          <View style={{ gap: moderateScale(6) }}>
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
    );
  };

  const renderPanditDetails = () => {
    if (!pujaDetails) return null;
    const pandit = pujaDetails.assigned_pandit;
    if (!pandit || typeof pandit === 'string') return null;
    return (
      <View style={styles.totalCard}>
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
    );
  };

  const renderPanditjiSection = () => {
    if (!pujaDetails) return null;
    if (
      pujaDetails.assigned_pandit &&
      typeof pujaDetails.assigned_pandit !== 'string'
    )
      return null;
    return (
      <View style={styles.panditjiCard}>
        <View style={styles.panditjiContent}>
          <View style={styles.panditjiAvatarContainer}>
            <View style={styles.panditjiAvatar}>
              <MaterialIcons
                name="person"
                size={moderateScale(24)}
                color={COLORS.white}
              />
            </View>
          </View>
          <Text style={styles.panditjiText}>
            {t('panditji_will_be_assigned_soon')}
          </Text>
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
            {renderPanditArrangedItems()}
            {renderUserArrangedItems()}
            {renderEmptyArrangedItems()}
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
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(24),
    flexGrow: 1,
    gap: moderateScale(24),
  },
  detailsCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  detailsContent: {},
  detailRow: {
    ...COMMON_CARD_STYLE,
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
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  totalCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  totalContent: {
    ...COMMON_CARD_STYLE,
    justifyContent: 'space-between',
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
  panditjiCard: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  panditjiContent: {
    ...COMMON_CARD_STYLE,
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
  arrangedSection: {
    ...COMMON_LIST_STYLE,
    backgroundColor: COLORS.white,
  },
  expandableCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
  },
  headerCardTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  expandableContent: {
    paddingBottom: moderateScale(14),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(5),
  },
  itemMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  bulletIcon: {
    alignSelf: 'center',
  },
  itemNameText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    lineHeight: 22,
    flex: 1,
  },
  itemQuantityText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  itemText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
  },
  bottomActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(14),
    backgroundColor: COLORS.pujaBackground,
    gap: moderateScale(24),
  },
  bottomOutlinedButton: {
    flex: 1,
    borderRadius: moderateScale(10),
  },
  bottomPrimaryButton: {
    flex: 1,
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
});

export default ConfirmPujaDetails;
