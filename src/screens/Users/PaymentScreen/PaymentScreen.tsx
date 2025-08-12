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
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {
  getPanditji,
  getWallet,
  postBooking,
  postCreateRazorpayOrder,
  postVerrifyPayment,
} from '../../../api/apiService';

const PaymentScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PaymentScreen'
  >;
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();

  const route = useRoute();
  const {
    poojaId,
    samagri_required,
    address,
    tirth,
    booking_date,
    muhurat_time,
    muhurat_type,
    notes,
    pandit,
    panditName,
    panditImage,
    puja_name,
    puja_image,
    price,
    selectAddress,
    panditjiData,
    selectManualPanitData,
  } = route.params as any;

  console.log('oute.params', route.params);

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: string;
    longitude: string;
  } | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  // const [panditData, setPanditjiData] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string | undefined>();
  const [walletData, setWalletData] = useState<any>({});

  const razorpayOrderInProgress = useRef(false);

  const razorpayOrderBookingId = useRef<string | null>(null);

  useEffect(() => {
    fetchWallet();
  }, []);

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

  // Helper to get wallet balance as number (default 0)
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

  const buildBookingData = () => {
    let bookingData: any = {
      pooja: typeof poojaId === 'string' ? parseInt(poojaId, 10) : poojaId,
      pandit:
        typeof pandit === 'string'
          ? parseInt(pandit, 10)
          : pandit || panditjiData?.pandit_id,
      samagri_required: samagri_required,
      booking_date: booking_date,
      muhurat_time: muhurat_time,
      muhurat_type: muhurat_type,
      notes: notes,
    };

    if (
      address &&
      address !== '' &&
      address !== null &&
      address !== undefined
    ) {
      bookingData.address = address;
    } else if (tirth && tirth !== '' && tirth !== null && tirth !== undefined) {
      bookingData.tirth_place = tirth;
    }

    if (
      bookingData.address === '' ||
      bookingData.address === null ||
      bookingData.address === undefined
    ) {
      delete bookingData.address;
    }
    if (
      bookingData.tirth === '' ||
      bookingData.tirth === null ||
      bookingData.tirth === undefined
    ) {
      delete bookingData.tirth;
    }

    return bookingData;
  };

  const handleCreateRazorpayOrder = useCallback(
    async (bookingIdForOrder: string) => {
      if (razorpayOrderBookingId.current === bookingIdForOrder && orderId) {
        return {order_id: orderId};
      }
      if (razorpayOrderInProgress.current) {
        return null;
      }
      razorpayOrderInProgress.current = true;
      setIsLoading(true);
      try {
        // Pass amount_to_pay_from_wallet_input if usePoints is true
        const data: any = {
          booking_id: bookingIdForOrder,
        };
        if (usePoints) {
          data.amount_to_pay_from_wallet_input = getWalletBalance();
        }
        const response: any = await postCreateRazorpayOrder(data as any);
        if (response && response.data && response.data.order_id) {
          setOrderId(response.data.order_id);
          razorpayOrderBookingId.current = bookingIdForOrder;
          showSuccessToast('Razorpay order created successfully!');
          return response.data;
        } else {
          showErrorToast(
            response?.message || 'Failed to create Razorpay order.',
          );
          return null;
        }
      } catch (error: any) {
        console.error('error in create booking :: ', error?.response.data);
        showErrorToast(error?.message || 'Failed to create Razorpay order.');
        return null;
      } finally {
        setIsLoading(false);
        razorpayOrderInProgress.current = false;
      }
    },
    [orderId, showSuccessToast, showErrorToast],
  );

  // Remove paymentMethods and related logic

  // suggestedPuja removed as per instruction

  const handleVerifyPayment = async ({
    booking_id,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  }: {
    booking_id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    setIsLoading(true);
    try {
      const data: any = {
        booking_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      };
      const response: any = await postVerrifyPayment(data);
      if (response && response.data.success) {
        showSuccessToast('Payment verified successfully!');
        navigation.navigate('BookingSuccessfullyScreen', {
          booking: booking_id,
          panditjiData: panditjiData,
          selectManualPanitData: selectManualPanitData,
          panditName: panditName,
          panditImage: panditImage,
        });
      } else {
        showErrorToast(response?.message || 'Payment verification failed===>.');
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Payment verification failed------>.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (
    amount: number,
    bookingIdForOrder: string,
    currentOrderId: string,
  ) => {
    let updatedOrderId = currentOrderId;
    if (
      !updatedOrderId ||
      razorpayOrderBookingId.current !== bookingIdForOrder
    ) {
      const razorpayOrder = await handleCreateRazorpayOrder(bookingIdForOrder);
      if (!razorpayOrder || !razorpayOrder.order_id) {
        showErrorToast('Order ID not found. Please try again.');
        return;
      }
      updatedOrderId = razorpayOrder.order_id;
      setOrderId(updatedOrderId);
      razorpayOrderBookingId.current = bookingIdForOrder;
    }

    const options: any = {
      description: 'Puja Booking Payment',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: 'rzp_test_birUVdrhV4Jm7l',
      amount: amount.toString(),
      name: 'PujaGuru App',
      order_id: updatedOrderId,
      prefill: {
        email: 'user@example.com',
        contact: '9999999999',
        name: 'User Name',
      },
      theme: {color: COLORS.primary},
    };

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        if (
          data &&
          data.razorpay_payment_id &&
          data.razorpay_order_id &&
          data.razorpay_signature &&
          bookingIdForOrder
        ) {
          await handleVerifyPayment({
            booking_id: bookingIdForOrder,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: updatedOrderId,
            razorpay_signature: data.razorpay_signature,
          });
        } else {
          showErrorToast('Payment verification data missing.');
        }
      })
      .catch((error: {code: any}) => {
        showErrorToast(`Payment failed: ${error.code}`);
      });
  };

  // Remove handlePaymentMethodSelect and selectedPaymentMethod logic

  const handleConfirmBooking = async () => {
    if (!acceptTerms) {
      showErrorToast('Please accept the terms and conditions to proceed.');
      return;
    }

    // Always use Razorpay for payment, no payment method selection
    // Calculate amount to pay: if usePoints, deduct wallet balance from price
    const walletBalance = getWalletBalance();
    const totalPrice = Number(price) || 0;
    let amount = totalPrice * 100; // Razorpay expects paise
    if (usePoints) {
      // If wallet balance is more than price, only pay the difference (never negative)
      const remaining = Math.max(totalPrice - walletBalance, 0);
      amount = remaining * 100;
    }

    setIsLoading(true);
    try {
      const bookingData = buildBookingData();
      const bookingResponse: any = await postBooking(bookingData as any);
      if (
        bookingResponse &&
        bookingResponse.data &&
        bookingResponse.data.status &&
        bookingResponse.data.data &&
        bookingResponse.data.data.id
      ) {
        const newBookingId = bookingResponse.data.data.id;
        setBookingId(newBookingId);

        let currentOrderId = orderId;
        if (
          !currentOrderId ||
          razorpayOrderBookingId.current !== newBookingId
        ) {
          const razorpayOrder = await handleCreateRazorpayOrder(newBookingId);
          if (!razorpayOrder || !razorpayOrder.order_id) {
            showErrorToast('Order ID not found. Please try again.');
            setIsLoading(false);
            return;
          }
          currentOrderId = razorpayOrder.order_id;
          setOrderId(currentOrderId);
          razorpayOrderBookingId.current = newBookingId;
        }
        await handlePayment(amount, newBookingId, currentOrderId!);
      } else {
        if (bookingResponse && bookingResponse.errors) {
          console.error('Error Booking', bookingResponse.errors);
        } else {
          showErrorToast(bookingResponse?.message || 'Booking failed.');
        }
      }
    } catch (error: any) {
      if (error?.response?.data) {
        console.log('Error Booking', error.response.data);
      } else {
        showErrorToast(error?.message || 'Booking failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Remove renderPaymentMethod

  // Remove suggestedPuja and its usage, so renderBookingData will use booking data from props/state

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
      <View style={styles.textContainer}>
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 12,
        }}>
        <Image
          source={{
            uri:
              selectManualPanitData?.image ||
              panditjiData?.profile_img ||
              panditImage ||
              'https://via.placeholder.com/150',
          }}
          style={styles.panditImage}
        />
        <Text style={styles.bookingDataText}>
          {panditjiData?.full_name ||
            selectManualPanitData?.name ||
            panditName ||
            'Panditji'}{' '}
          {'Panditji'}
        </Text>
      </View>
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
              {paddingBottom: verticalScale(32)}, // add extra padding for button
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
                // onPress={toggleExpand}
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
                  }}>
                  {/* <Octicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.pujaCardSubtext}
                  /> */}
                </View>
              </TouchableOpacity>
              {/* {isExpanded && ( */}
              <View style={styles.bookingDataContainer}>
                {renderBookingData()}
              </View>
              {/* )} */}
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
              onPress={handleConfirmBooking}
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
