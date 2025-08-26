import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {Images} from '../../../theme/Images';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';
import {getUpcomingPujaDetails} from '../../../api/apiService';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';

const ConfirmPujaDetails: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserHomeParamList,
    'PujaCancellationScreen' | 'UserChatScreen' | 'RateYourExperienceScreen'
  >;
  const route = useRoute();
  const {bookingId, search} = route.params as any;
  const {t} = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();

  const [pujaDetails, setPujaDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State for show more/less for arranged items
  const [showMorePanditArranged, setShowMorePanditArranged] = useState(false);
  const [showMoreUserArranged, setShowMoreUserArranged] = useState(false);

  useEffect(() => {
    fetchPujaDetails();
  }, [bookingId]);

  console.log('pujaDetails', pujaDetails);
  const fetchPujaDetails = async () => {
    setLoading(true);
    try {
      const details = await getUpcomingPujaDetails(bookingId?.toString());
      setPujaDetails(details);
    } catch (error) {
      setPujaDetails(null);
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

  const renderArrangedItemsSection = () => {
    if (!pujaDetails) return null;

    const {pandit_arranged_items, user_arranged_items} = pujaDetails;

    // Only show if at least one of the arrays has items
    if (
      (!Array.isArray(pandit_arranged_items) ||
        pandit_arranged_items.length === 0) &&
      (!Array.isArray(user_arranged_items) || user_arranged_items.length === 0)
    ) {
      return null;
    }

    return (
      <View style={styles.arrangedItemsContainer}>
        {/* Pandit Arranged Items */}
        {Array.isArray(pandit_arranged_items) &&
          pandit_arranged_items.length > 0 && (
            <View style={[styles.arrangedSection, THEMESHADOW.shadow]}>
              <Text style={styles.arrangedSectionTitle}>
                {t('pandit_arranged_items') || 'Pandit Arranged Items'}
              </Text>
              <View style={styles.arrangedList}>
                {(showMorePanditArranged
                  ? pandit_arranged_items
                  : pandit_arranged_items.slice(0, 1)
                ).map((item: any, idx: number) => (
                  <View
                    key={`pandit-item-${idx}`}
                    style={styles.arrangedItemRow}>
                    <Text style={styles.arrangedItemName}>{item.name}</Text>
                    <Text style={styles.arrangedItemQty}>
                      {item.quantity} {item.units}
                    </Text>
                  </View>
                ))}
                {pandit_arranged_items.length > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      setShowMorePanditArranged(!showMorePanditArranged)
                    }
                    style={{paddingVertical: 6}}>
                    <Text
                      style={{
                        color: COLORS.primaryBackgroundButton,
                        fontFamily: Fonts.Sen_Medium,
                      }}>
                      {showMorePanditArranged
                        ? t('show_less') || 'Show Less'
                        : t('show_more') || 'Show More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

        {/* User Arranged Items */}
        {Array.isArray(user_arranged_items) &&
          user_arranged_items.length > 0 && (
            <View style={[styles.arrangedSection, THEMESHADOW.shadow]}>
              <Text style={styles.arrangedSectionTitle}>
                {t('user_arranged_items') || 'Your Arranged Items'}
              </Text>
              <View style={styles.arrangedList}>
                {(showMoreUserArranged
                  ? user_arranged_items
                  : user_arranged_items.slice(0, 1)
                ).map((item: any, idx: number) => (
                  <View key={`user-item-${idx}`} style={styles.arrangedItemRow}>
                    <Text style={styles.arrangedItemName}>{item.name}</Text>
                    <Text style={styles.arrangedItemQty}>
                      {item.quantity} {item.units}
                    </Text>
                  </View>
                ))}
                {user_arranged_items.length > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      setShowMoreUserArranged(!showMoreUserArranged)
                    }
                    style={{paddingVertical: 6}}>
                    <Text
                      style={{
                        color: COLORS.primaryBackgroundButton,
                        fontFamily: Fonts.Sen_Medium,
                      }}>
                      {showMoreUserArranged
                        ? t('show_less') || 'Show Less'
                        : t('show_more') || 'Show More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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

  const renderCancelButton = () => (
    <PrimaryButton
      title={t('go_to_home')}
      onPress={() => {
        navigation.replace('UserHomeScreen');
      }}
      style={styles.cancelButton}
      textStyle={styles.cancelButtonText}
    />
  );

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
                {renderPanditDetails()}
                {renderPanditjiSection()}
                {renderPujaDetails()}
                {renderArrangedItemsSection()}
                {renderTotalAmount()}
                {search === 'true' && renderCancelButton()}
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
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
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(2),
    marginHorizontal: 14,
  },
  totalContainer: {
    // marginBottom: verticalScale(24),
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
    shadowColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
    letterSpacing: -0.15,
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
    justifyContent: 'space-between',
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
  },
  arrangedItemQty: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    marginLeft: scale(10),
    minWidth: scale(60),
    textAlign: 'right',
  },
});

export default ConfirmPujaDetails;
