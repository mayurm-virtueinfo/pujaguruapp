import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import PrimaryButton from '../../../components/PrimaryButton';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Images} from '../../../theme/Images';
import Octicons from 'react-native-vector-icons/Octicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useCommonToast} from '../../../common/CommonToast';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import RazorpayCheckout from 'react-native-razorpay';
import {
  getWallet,
  postBooking,
  postCreateRazorpayOrder,
  postVerrifyPayment,
} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';

const PaymentScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PaymentScreen'
  >;
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

  const route = useRoute();
  // Accept both camelCase and snake_case for panditName/panditImage
  const {
    booking_date,
    muhurat_time,
    muhurat_type,
    notes,
    pandit,
    panditName,
    pandit_name,
    panditImage,
    pandit_image,
    puja_name,
    puja_image,
    price,
    selectAddress,
    panditjiData,
    selectManualPanitData,
    booking_Id,
  } = route.params as any;

  // Prefer camelCase, fallback to snake_case
  const displayPanditName =
    panditName ||
    pandit_name ||
    selectManualPanitData?.name ||
    panditjiData?.full_name ||
    '';
  const displayPanditImage =
    selectManualPanitData?.image ||
    panditjiData?.profile_img ||
    panditImage ||
    pandit_image ||
    'https://via.placeholder.com/150';

  console.log('oute.params :: ', route.params);

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<any>({});
  const [location, setLocation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await AsyncStorage.getItem(AppConstant.CURRENT_USER);
        if (user) {
          // You can parse and use the user object as needed
          // Example: setCurrentUser(JSON.parse(user));
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error fetching CURRENT_USER:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const razorpayOrderInProgress = useRef(false);

  const razorpayOrderBookingId = useRef<string | null>(booking_Id);

  useEffect(() => {
    fetchLocation();
    fetchWallet();
  }, []);

  const fetchLocation = async () => {
    try {
      const location = await AsyncStorage.getItem(AppConstant.LOCATION);
      if (location) {
        const parsedLocation = JSON.parse(location);
        setLocation(parsedLocation);
      }
    } catch (error) {
      console.error('Error fetching  location ::', error);
    }
  };

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: any = await getWallet();
      if (data.success) {
        setWalletData(data.data);
      }
    } catch (error: any) {
      showErrorToast(error.response.data.message);
      console.log('error of wallet :: ', error.response.data);
      setWalletData({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWalletBalance = () => {
    if (
      walletData &&
      (typeof walletData.balance === 'number' ||
        typeof walletData.balance === 'string')
    ) {
      return Number(walletData.balance) || 0;
    }
    return 0;
  };

  const handleCreateRazorpayOrder = useCallback(
    async (bookingIdForOrder: string) => {
      if (razorpayOrderBookingId.current === bookingIdForOrder && orderId) {
        return {order_id: orderId};
      }

      if (razorpayOrderInProgress.current) {
        throw new Error('Order creation already in progress');
      }

      razorpayOrderInProgress.current = true;
      setIsLoading(true);

      try {
        const requestData: any = {
          booking_id: bookingIdForOrder,
          ...(usePoints && {
            amount_to_pay_from_wallet_input: getWalletBalance(),
          }),
        };

        const response: any = await postCreateRazorpayOrder(requestData);

        if (response?.data?.order_id) {
          setOrderId(response.data.order_id);
          razorpayOrderBookingId.current = bookingIdForOrder;
          showSuccessToast('Order created successfully!');
          return response.data;
        } else {
          throw new Error(
            response?.message || 'Failed to create Razorpay order',
          );
        }
      } catch (error: any) {
        console.error('Order creation error:', error);
        showErrorToast(error?.message || 'Failed to create Razorpay order');
        throw error;
      } finally {
        setIsLoading(false);
        razorpayOrderInProgress.current = false;
      }
    },
    [orderId, usePoints, showSuccessToast, showErrorToast, getWalletBalance],
  );

  const handleVerifyPayment = async (paymentData: any) => {
    const {
      booking_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = paymentData;

    setIsLoading(true);
    try {
      const verificationData = {
        booking_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      };

      const response = await postVerrifyPayment(
        verificationData,
        location?.latitude,
        location?.longitude,
      );

      if (response?.data?.success) {
        showSuccessToast('Payment verified successfully!');

        // Navigate to success screen
        navigation.navigate('SearchPanditScreen', {
          booking_id: booking_id,
        });
      } else {
        throw new Error(response?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      showErrorToast(error?.message || 'Payment verification failed');
      throw error; // Re-throw to handle in calling function
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!acceptTerms) {
      showErrorToast('Please accept the terms and conditions to proceed.');
      return;
    }

    try {
      // Step 1: Create Razorpay order
      const razorpayOrder = await handleCreateRazorpayOrder(booking_Id);

      if (!razorpayOrder?.order_id) {
        showErrorToast('Unable to create payment order. Please try again.');
        return;
      }

      // Step 2: Configure Razorpay options
      const razorpayOptions = {
        description: 'Puja Booking Payment',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: 'rzp_test_birUVdrhV4Jm7l',
        amount: price * 100,
        name: 'PujaGuru App',
        order_id: razorpayOrder.order_id,
        prefill: {
          email: currentUser.email,
          contact: currentUser.mobile,
          name: `${currentUser.first_name}${currentUser.last_name}`,
        },
        theme: {color: COLORS.primary},
      };

      // Step 3: Open Razorpay checkout
      const paymentResult = await RazorpayCheckout.open(razorpayOptions);

      // Step 4: Verify payment
      if (
        paymentResult?.razorpay_payment_id &&
        paymentResult?.razorpay_order_id &&
        paymentResult?.razorpay_signature
      ) {
        await handleVerifyPayment({
          booking_id: booking_Id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_signature: paymentResult.razorpay_signature,
        });
      } else {
        showErrorToast('Payment data incomplete. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment process error:', error);

      if (error.code === 'payment_cancelled') {
        showErrorToast('Payment cancelled by user');
      } else if (error.code === 'payment_failed') {
        showErrorToast('Payment failed. Please try again.');
      } else {
        showErrorToast(error?.message || 'Payment process failed');
      }
    }
  };

  // --- REWRITE: Show pandit name and image if any pandit is present ---
  const renderBookingData = () => (
    <View style={styles.bookingDataItem}>
      <View style={styles.textContainer}>
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: scale(14),
          }}>
          <Octicons name="location" size={20} color={COLORS.pujaCardSubtext} />
        </View>
        <View>
          <Text style={styles.bookingDataText}>{selectAddress}</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: scale(14),
          }}>
          <Octicons name="calendar" size={20} color={COLORS.pujaCardSubtext} />
        </View>
        <View>
          <Text style={styles.bookingDataText}>{booking_date}</Text>
        </View>
      </View>

      <View
        style={[
          styles.textContainer,
          !(displayPanditName || displayPanditImage) && {
            borderBottomWidth: 0,
          },
        ]}>
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: scale(14),
          }}>
          <Octicons name="clock" size={20} color={COLORS.pujaCardSubtext} />
        </View>
        <View>
          <Text style={styles.bookingDataText}>{muhurat_time}</Text>
        </View>
      </View>
      {/* Show pandit info if any of the possible pandit fields are present */}
      {(displayPanditName || displayPanditImage) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 12,
          }}>
          <Image
            source={{
              uri: displayPanditImage,
            }}
            style={styles.panditImage}
          />
          <Text style={styles.bookingDataText}>
            {displayPanditName ? displayPanditName : 'Panditji'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.contentContainer}>
        <UserCustomHeader title={t('payment')} showBackButton={true} />
        <View style={styles.flex1}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContentContainer,
              {paddingBottom: verticalScale(32)},
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            scrollEventThrottle={16}>
            {/* Total Amount Section */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <View style={styles.totalInfo}>
                  <Text style={styles.totalAmountLabel}>
                    {t('total_amount')}
                  </Text>
                  <Text style={styles.pujaName}>{puja_name}</Text>
                </View>
                <View style={styles.amoutContainer}>
                  <Text style={styles.totalAmount}>₹ {price}</Text>
                </View>
              </View>
            </View>

            {/* Use Points Section */}
            <View style={styles.pointsSection}>
              <View style={styles.pointsRow}>
                <View style={styles.pointsLeft}>
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      onPress={() => setUsePoints(!usePoints)}
                      style={styles.customCheckbox}>
                      {usePoints && (
                        <MaterialIcons
                          name="check"
                          size={18}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.pointsLabel}>
                    {t('use_available_points')}
                  </Text>
                </View>
                <View style={styles.pointsRight}>
                  <Image source={Images.ic_coin} style={styles.pointsIcon} />
                  <Text style={styles.pointsValue}>{walletData.balance}</Text>
                </View>
              </View>
            </View>

            {/* Booking Data Section (was Suggested Puja Section) */}
            <View style={styles.suggestedSection}>
              <TouchableOpacity
                style={styles.suggestedPujaRow}
                activeOpacity={0.7}>
                <View style={styles.suggestedLeft}>
                  <View style={styles.pujaImageContainer}>
                    <Image
                      source={{uri: puja_image}}
                      style={styles.pujaImage}
                    />
                  </View>
                  <Text style={styles.suggestedPujaName}>{puja_name}</Text>
                </View>
                <View
                  style={{
                    height: 24,
                    width: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}></View>
              </TouchableOpacity>
              <View style={styles.bookingDataContainer}>
                {renderBookingData()}
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsSection}>
              <View style={styles.termsRow}>
                <FontAwesome
                  name={acceptTerms ? 'check-square-o' : 'square-o'}
                  size={24}
                  color={acceptTerms ? COLORS.primary : COLORS.borderColor}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                />
                <Text style={styles.termsText}>
                  {t('accept_terms_and_conditions')}
                </Text>
              </View>
            </View>
          </ScrollView>
          <View
            style={[
              styles.fixedButtonContainer,
              {paddingBottom: inset.bottom || (Platform.OS === 'ios' ? 16 : 8)},
            ]}>
            <PrimaryButton
              title={t('confirm_booking')}
              onPress={handlePayment}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
    padding: 18,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  totalSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginBottom: verticalScale(20),
    marginHorizontal: scale(4),
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  totalAmountLabel: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  pujaName: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    marginTop: verticalScale(4),
  },
  totalAmount: {
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  amoutContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pointsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginBottom: verticalScale(20),
    marginHorizontal: scale(4),
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: scale(12),
    padding: scale(4),
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: COLORS.inputBoder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  pointsLabel: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  pointsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {width: 18, height: 18, marginRight: 4},
  pointsValue: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  // paymentMethodsSection and related styles can be kept or removed, but not used in render
  paymentMethodsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginBottom: verticalScale(20),
    marginHorizontal: scale(4),
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(4),
  },
  paymentMethodText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  radioButton: {
    padding: scale(4),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(8),
  },
  suggestedSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
    marginHorizontal: scale(4),
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 12,
  },
  suggestedPujaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pujaImageContainer: {
    marginRight: scale(14),
  },
  pujaImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  suggestedPujaName: {
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  bookingDataContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.separatorColor,
    marginTop: 12,
  },
  bookingDataItem: {
    flex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: COLORS.separatorColor,
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  bookingDataText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  panditImage: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: scale(14),
    backgroundColor: COLORS.inputBoder,
  },
  termsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginBottom: verticalScale(24),
    marginHorizontal: scale(4),
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flex: 1,
    alignSelf: 'center',
  },
  buttonContainer: {
    height: 46,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  fixedButtonContainer: {
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: 18,
    paddingTop: 8,
    // position: 'absolute', // not needed, use flex layout
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
});

export default PaymentScreen;
