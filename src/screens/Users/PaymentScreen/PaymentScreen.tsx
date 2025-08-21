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
    booking_Id,
  } = route.params as any;

  console.log('oute.params :: ', route.params);

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<any>({});
  const [location, setLocation] = useState<any>(null);

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

  // const buildBookingData = () => {
  //   let bookingData: any = {
  //     pooja: typeof poojaId === 'string' ? parseInt(poojaId, 10) : poojaId,
  //     pandit:
  //       typeof pandit === 'string'
  //         ? parseInt(pandit, 10)
  //         : pandit || panditjiData?.pandit_id,
  //     samagri_required: samagri_required,
  //     booking_date: booking_date,
  //     muhurat_time: muhurat_time,
  //     muhurat_type: muhurat_type,
  //     notes: notes,
  //   };

  //   if (
  //     address &&
  //     address !== '' &&
  //     address !== null &&
  //     address !== undefined
  //   ) {
  //     bookingData.address = address;
  //   } else if (tirth && tirth !== '' && tirth !== null && tirth !== undefined) {
  //     bookingData.tirth_place = tirth;
  //   }

  //   if (
  //     bookingData.address === '' ||
  //     bookingData.address === null ||
  //     bookingData.address === undefined
  //   ) {
  //     delete bookingData.address;
  //   }
  //   if (
  //     bookingData.tirth === '' ||
  //     bookingData.tirth === null ||
  //     bookingData.tirth === undefined
  //   ) {
  //     delete bookingData.tirth;
  //   }

  //   return bookingData;
  // };

  // const handleCreateRazorpayOrder = useCallback(
  //   async (bookingIdForOrder: string) => {
  //     if (razorpayOrderBookingId.current === bookingIdForOrder && orderId) {
  //       return {order_id: orderId};
  //     }
  //     if (razorpayOrderInProgress.current) {
  //       return null;
  //     }
  //     razorpayOrderInProgress.current = true;
  //     setIsLoading(true);
  //     try {
  //       const data: any = {
  //         booking_id: bookingIdForOrder,
  //       };
  //       if (usePoints) {
  //         data.amount_to_pay_from_wallet_input = getWalletBalance();
  //       }
  //       const response: any = await postCreateRazorpayOrder(data as any);
  //       if (response && response.data && response.data.order_id) {
  //         setOrderId(response.data.order_id);
  //         razorpayOrderBookingId.current = bookingIdForOrder;
  //         showSuccessToast('Razorpay order created successfully!');
  //         return response.data;
  //       } else {
  //         showErrorToast(
  //           response?.message || 'Failed to create Razorpay order.',
  //         );
  //         return null;
  //       }
  //     } catch (error: any) {
  //       console.error('error in create booking :: ', error?.response.data);
  //       showErrorToast(error?.message || 'Failed to create Razorpay order.');
  //       return null;
  //     } finally {
  //       setIsLoading(false);
  //       razorpayOrderInProgress.current = false;
  //     }
  //   },
  //   [orderId, showSuccessToast, showErrorToast],
  // );

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

  // const handleVerifyPayment = async ({
  //   booking_id,
  //   razorpay_payment_id,
  //   razorpay_order_id,
  //   razorpay_signature,
  // }: {
  //   booking_id: string;
  //   razorpay_payment_id: string;
  //   razorpay_order_id: string;
  //   razorpay_signature: string;
  // }) => {
  //   setIsLoading(true);
  //   try {
  //     const data: any = {
  //       booking_id,
  //       razorpay_payment_id,
  //       razorpay_order_id,
  //       razorpay_signature,
  //     };
  //     const response: any = await postVerrifyPayment(
  //       data,
  //       location.latitude,
  //       location.longitude,
  //     );
  //     if (response && response.data.success) {
  //       showSuccessToast('Payment verified successfully!');
  //       navigation.navigate('BookingSuccessfullyScreen', {
  //         booking: booking_id,
  //         panditjiData: panditjiData,
  //         selectManualPanitData: selectManualPanitData,
  //         panditName: panditName,
  //         panditImage: panditImage,
  //       });
  //     } else {
  //       showErrorToast(response?.message || 'Payment verification failed===>.');
  //     }
  //   } catch (error: any) {
  //     showErrorToast(error?.message || 'Payment verification failed------>.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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
        navigation.navigate('BookingSuccessfullyScreen', {
          booking: booking_id,
          panditjiData,
          selectManualPanitData,
          panditName,
          panditImage,
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

  // const handlePayment = async () => {
  //   const razorpayOrder = await handleCreateRazorpayOrder(booking_Id);
  //   if (!razorpayOrder || !razorpayOrder.order_id) {
  //     showErrorToast('Order ID not found. Please try again.');
  //     return;
  //   }

  //   const options: any = {
  //     description: 'Puja Booking Payment',
  //     image: 'https://your-logo-url.com/logo.png',
  //     currency: 'INR',
  //     key: 'rzp_test_birUVdrhV4Jm7l',
  //     amount: price * 100,
  //     name: 'PujaGuru App',
  //     order_id: razorpayOrder.order_id,
  //     prefill: {
  //       email: 'user@example.com',
  //       contact: '9999999999',
  //       name: 'User Name',
  //     },
  //     theme: {color: COLORS.primary},
  //   };

  //   RazorpayCheckout.open(options)
  //     .then(async (data: any) => {
  //       if (
  //         data &&
  //         data.razorpay_payment_id &&
  //         data.razorpay_order_id &&
  //         data.razorpay_signature &&
  //         booking_Id
  //       ) {
  //         await handleVerifyPayment({
  //           booking_id: booking_Id,
  //           razorpay_payment_id: data.razorpay_payment_id,
  //           razorpay_order_id: data.razorpay_order_id,
  //           razorpay_signature: data.razorpay_signature,
  //         });
  //       } else {
  //         showErrorToast('Payment verification data missing.');
  //       }
  //     })
  //     .catch((error: {code: any}) => {
  //       showErrorToast(`Payment failed: ${error.code}`);
  //     });
  // };

  // const handleConfirmBooking = async () => {
  //   if (!acceptTerms) {
  //     showErrorToast('Please accept the terms and conditions to proceed.');
  //     return;
  //   }

  //   const walletBalance = getWalletBalance();
  //   const totalPrice = Number(price) || 0;
  //   let amount = totalPrice * 100;
  //   if (usePoints) {
  //     const remaining = Math.max(totalPrice - walletBalance, 0);
  //     amount = remaining * 100;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const bookingData = buildBookingData();
  //     console.log('bookingData :: ', bookingData);

  //     const bookingResponse: any = await postBooking(bookingData as any);
  //     if (
  //       bookingResponse &&
  //       bookingResponse.data &&
  //       bookingResponse.data.status &&
  //       bookingResponse.data.data &&
  //       bookingResponse.data.data.id
  //     ) {
  //       const newBookingId = bookingResponse.data.data.id;
  //       setBookingId(newBookingId);

  //       let currentOrderId = orderId;
  //       if (
  //         !currentOrderId ||
  //         razorpayOrderBookingId.current !== newBookingId
  //       ) {
  //         const razorpayOrder = await handleCreateRazorpayOrder(newBookingId);
  //         if (!razorpayOrder || !razorpayOrder.order_id) {
  //           showErrorToast('Order ID not found. Please try again.');
  //           setIsLoading(false);
  //           return;
  //         }
  //         currentOrderId = razorpayOrder.order_id;
  //         setOrderId(currentOrderId);
  //         razorpayOrderBookingId.current = newBookingId;
  //       }
  //       await handlePayment(amount, newBookingId, currentOrderId!);
  //     } else {
  //       if (bookingResponse && bookingResponse.errors) {
  //         console.error('Error Booking', bookingResponse.errors);
  //       } else {
  //         showErrorToast(bookingResponse?.message || 'Booking failed.');
  //       }
  //     }
  //   } catch (error: any) {
  //     if (error?.response?.data) {
  //       console.log('Error Booking', error.response.data?.message);
  //     } else {
  //       showErrorToast(error?.message || 'Booking failed.');
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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
          email: 'user@example.com',
          contact: '9999999999',
          name: 'User Name',
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
      {panditName && (
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
