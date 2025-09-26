import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  BackHandler,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import PrimaryButton from '../../../components/PrimaryButton';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
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
  postCreateRazorpayOrder,
  postVerrifyPayment,
  getRefundPolicy,
} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';

// Import WebView for HTML rendering
import {WebView} from 'react-native-webview';

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
    AutoModeSelection,
    auto,
  } = route.params as any;

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

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<any>({});
  const [location, setLocation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);

  // Refund Policy Modal State
  const [refundPolicyVisible, setRefundPolicyVisible] = useState(false);
  const [refundPolicyContent, setRefundPolicyContent] = useState<string>('');
  const [refundPolicyLoading, setRefundPolicyLoading] = useState(false);

  // Cash on option state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'online' | 'cod'
  >('online');

  // New: Only allow payment method selection if usePoints is false or wallet covers the amount
  const walletBalanceForCalc =
    walletData &&
    (typeof walletData.balance === 'number' ||
      typeof walletData.balance === 'string')
      ? Number(walletData.balance) || 0
      : 0;
  const baseAmount = Number(price) || 0;
  const taxAmount = 0;
  const grossAmount = Number((baseAmount + taxAmount).toFixed(2));
  const walletUseAmountCalc = usePoints
    ? Math.min(grossAmount, walletBalanceForCalc)
    : 0;
  const payableAmount = Number(
    Math.max(grossAmount - walletUseAmountCalc, 0).toFixed(2),
  );
  const canSelectPaymentMethod = !(
    usePoints && walletBalanceForCalc >= grossAmount
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await AsyncStorage.getItem(AppConstant.CURRENT_USER);
        if (user) {
          try {
            const parsed = JSON.parse(user);
            setCurrentUser(parsed);
          } catch (e) {
            setCurrentUser(null);
          }
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

  // Prevent navigating back while payment is in progress
  useEffect(() => {
    const beforeRemove = navigation.addListener('beforeRemove', e => {
      if (!isProcessingPayment && !loading) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Payment in progress',
        'Are you sure you want to cancel the payment?',
        [
          {text: 'Stay', style: 'cancel'},
          {
            text: 'Cancel Payment',
            style: 'destructive',
            onPress: () => {
              setIsProcessingPayment(false);
              setIsLoading(false);
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isProcessingPayment && !loading) {
        return false;
      }
      Alert.alert(
        'Payment in progress',
        'Are you sure you want to cancel the payment?',
        [
          {text: 'Stay', style: 'cancel'},
          {
            text: 'Cancel Payment',
            style: 'destructive',
            onPress: () => {
              setIsProcessingPayment(false);
              setIsLoading(false);
              navigation.goBack();
            },
          },
        ],
      );
      return true;
    });

    return () => {
      beforeRemove();
      backSub.remove();
    };
  }, [navigation, isProcessingPayment, loading]);

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

  // Amount calculations simplified to base amount only (no platform fees)
  // (already done above for baseAmount, grossAmount, walletBalanceForCalc, walletUseAmountCalc, payableAmount)

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
        const walletBalance = getWalletBalance();
        const walletUseAmount = usePoints
          ? Math.min(grossAmount, walletBalance)
          : 0;
        const requestData: any = {
          booking_id: bookingIdForOrder,
          latitude: location?.latitude,
          longitude: location?.longitude,
          is_cos: selectedPaymentMethod === 'cod',
          ...(walletUseAmount > 0 && {
            amount_to_pay_from_wallet_input: walletUseAmount,
          }),
          ...(selectedPaymentMethod === 'cod' && {
            payment_mode: 'cod',
          }),
        };

        const response: any = await postCreateRazorpayOrder(requestData);
        if (response?.data?.order_id || response?.data?.booking_id) {
          setOrderId(response.data.order_id || response?.data?.booking_id);
          razorpayOrderBookingId.current = bookingIdForOrder;
          showSuccessToast('Order created successfully!');
          return response.data;
        } else {
          throw new Error(
            response?.message || 'Failed to create Razorpay order',
          );
        }
      } catch (error: any) {
        showErrorToast(error?.message || 'Failed to create Razorpay order');
        throw error;
      } finally {
        setIsLoading(false);
        razorpayOrderInProgress.current = false;
      }
    },
    [
      orderId,
      usePoints,
      showSuccessToast,
      showErrorToast,
      getWalletBalance,
      selectedPaymentMethod,
    ],
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

      const response: any = await postVerrifyPayment(
        verificationData,
        location?.latitude,
        location?.longitude,
      );

      if (response?.data?.success) {
        showSuccessToast('Payment verified successfully!');

        if (AutoModeSelection == true) {
          navigation.navigate('SearchPanditScreen', {
            booking_id: booking_id,
          });
        } else {
          navigation.navigate('BookingSuccessfullyScreen', {
            booking: booking_id,
            panditjiData,
            selectManualPanitData,
            panditName,
            panditImage,
            auto,
          });
        }
      } else {
        throw new Error(response?.message || 'Payment verification failed');
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Payment verification failed');
      throw error;
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
      setIsProcessingPayment(true);
      const walletBalance = getWalletBalance();
      const totalPrice = grossAmount; // include tax in payable
      const walletUseAmount = usePoints
        ? Math.min(totalPrice, walletBalance)
        : 0;

      // Step 1: Create order / apply wallet
      const razorpayOrder = await handleCreateRazorpayOrder(booking_Id);

      // If wallet fully covers the price, skip Razorpay and treat as success
      if (walletUseAmount >= totalPrice) {
        showSuccessToast('Payment completed using wallet');
        if (AutoModeSelection == true) {
          navigation.navigate('SearchPanditScreen', {
            booking_id: booking_Id,
          });
        } else {
          navigation.navigate('BookingSuccessfullyScreen', {
            booking: booking_Id,
            panditjiData,
            selectManualPanitData,
            panditName,
            panditImage,
            auto,
          });
        }
        return;
      }

      if (!razorpayOrder?.order_id && selectedPaymentMethod === 'online') {
        showErrorToast('Unable to create payment order. Please try again.');
        return;
      }

      const remainingAmount = Math.max(totalPrice - walletUseAmount, 0);

      if (selectedPaymentMethod === 'cod') {
        // Cash on Delivery/Offline Payment
        showSuccessToast(
          'Booking confirmed. Please pay at the time of service.',
        );
        if (AutoModeSelection == true) {
          navigation.navigate('SearchPanditScreen', {
            booking_id: booking_Id,
          });
        } else {
          navigation.navigate('BookingSuccessfullyScreen', {
            booking: booking_Id,
            panditjiData,
            selectManualPanitData,
            panditName,
            panditImage,
            auto,
          });
        }
        return;
      }

      // Step 2: Configure Razorpay options
      const razorpayOptions = {
        description: 'Puja Booking Payment',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: 'rzp_test_birUVdrhV4Jm7l',
        amount: remainingAmount * 100,
        name: 'PujaGuru App',
        order_id: razorpayOrder.order_id,
        prefill: {
          email: currentUser?.email,
          contact: currentUser?.mobile,
          name: `${currentUser?.first_name || ''}${
            currentUser?.last_name || ''
          }`,
        },
        theme: {color: COLORS.primary},
      } as const;

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
      if (error.code === 'payment_cancelled') {
        showErrorToast('Payment cancelled by user');
      } else if (error.code === 'payment_failed') {
        showErrorToast('Payment failed. Please try again.');
      } else {
        showErrorToast(error?.message || 'Payment process failed');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Fetch refund policy content from API
  const fetchRefundPolicy = async () => {
    setRefundPolicyLoading(true);
    setRefundPolicyContent('');
    try {
      const data = await getRefundPolicy();
      // The API returns HTML, so we store it as is
      setRefundPolicyContent(data);
    } catch (error) {
      setRefundPolicyContent(
        'Failed to load refund policy. Please try again later.',
      );
    } finally {
      setRefundPolicyLoading(false);
    }
  };

  // Open refund policy modal and fetch content
  const handleOpenRefundPolicy = async () => {
    setRefundPolicyVisible(true);
    await fetchRefundPolicy();
  };

  // Close refund policy modal
  const handleCloseRefundPolicy = () => {
    setRefundPolicyVisible(false);
    setRefundPolicyContent('');
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

      <View
        style={[
          styles.textContainer,
          (AutoModeSelection == true ||
            (AutoModeSelection == false &&
              !(displayPanditName || displayPanditImage))) && {
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

      {AutoModeSelection == false &&
        displayPanditImage &&
        displayPanditName && (
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
            <Text style={styles.bookingDataText}>{displayPanditName}</Text>
          </View>
        )}
    </View>
  );

  // Payment method selection UI
  const renderPaymentMethods = () => {
    // If user has enough points to cover the booking, do not allow payment method selection
    const walletCoversBooking =
      usePoints && walletBalanceForCalc >= grossAmount;
    return (
      <View style={[styles.paymentMethodsSection, THEMESHADOW.shadow]}>
        <Text
          style={{
            fontSize: 16,
            fontFamily: Fonts.Sen_SemiBold,
            color: COLORS.primaryTextDark,
            marginBottom: 8,
          }}>
          {t('select_payment_method') || 'Select Payment Method'}
        </Text>
        <TouchableOpacity
          style={[
            styles.paymentMethodRow,
            walletCoversBooking && {opacity: 0.5},
          ]}
          activeOpacity={walletCoversBooking ? 1 : 0.7}
          onPress={() => {
            if (!walletCoversBooking) setSelectedPaymentMethod('online');
          }}
          disabled={walletCoversBooking}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={styles.radioButton}>
              <MaterialIcons
                name={
                  selectedPaymentMethod === 'online'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={22}
                color={
                  selectedPaymentMethod === 'online'
                    ? COLORS.primary
                    : COLORS.inputBoder
                }
              />
            </View>
            <Text style={styles.paymentMethodText}>
              {t('pay_online') || 'Pay Online'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[
            styles.paymentMethodRow,
            walletCoversBooking && {opacity: 0.5},
          ]}
          activeOpacity={walletCoversBooking ? 1 : 0.7}
          onPress={() => {
            if (!walletCoversBooking) setSelectedPaymentMethod('cod');
          }}
          disabled={walletCoversBooking}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={styles.radioButton}>
              <MaterialIcons
                name={
                  selectedPaymentMethod === 'cod'
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={22}
                color={
                  selectedPaymentMethod === 'cod'
                    ? COLORS.primary
                    : COLORS.inputBoder
                }
              />
            </View>
            <Text style={styles.paymentMethodText}>
              {t('cash_on_delivery') || 'Cash on Service'}
            </Text>
          </View>
        </TouchableOpacity>
        {walletCoversBooking && (
          <Text
            style={{color: COLORS.pujaCardSubtext, fontSize: 13, marginTop: 8}}>
            {t('payment_method_disabled_wallet_full') ||
              'Payment method selection is disabled because your wallet fully covers the booking amount.'}
          </Text>
        )}
      </View>
    );
  };

  // Modal width/height for WebView
  const {width, height} = Dimensions.get('window');
  const modalWidth = width * 0.96;
  const modalHeight = height * 0.9;

  return (
    <View style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.contentContainer}>
        <UserCustomHeader
          title={t('payment')}
          showBackButton={!loading && !isProcessingPayment}
        />
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
            <View style={[styles.totalSection, THEMESHADOW.shadow]}>
              <View style={styles.totalRow}>
                <Text
                  style={[
                    styles.totalAmountLabel,
                    {fontFamily: Fonts.Sen_SemiBold},
                  ]}>
                  Total payable
                </Text>
                <Text
                  style={[
                    styles.totalAmount,
                    {fontFamily: Fonts.Sen_SemiBold},
                  ]}>
                  ₹ {grossAmount.toFixed(2)}
                </Text>
              </View>

              {usePoints ? (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalAmountLabel}>Wallet applied</Text>
                    <Text style={styles.totalAmount}>
                      - ₹ {walletUseAmountCalc.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text
                      style={[
                        styles.totalAmountLabel,
                        {fontFamily: Fonts.Sen_SemiBold},
                      ]}>
                      To pay
                    </Text>
                    <Text
                      style={[
                        styles.totalAmount,
                        {fontFamily: Fonts.Sen_SemiBold},
                      ]}>
                      ₹ {payableAmount.toFixed(2)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Use Points Section */}
            <View style={[styles.pointsSection, THEMESHADOW.shadow]}>
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

            {/* Payment Methods Section */}
            {renderPaymentMethods()}

            {/* Booking Data Section (was Suggested Puja Section) */}
            <View style={[styles.suggestedSection, THEMESHADOW.shadow]}>
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
            <View style={[styles.termsSection, THEMESHADOW.shadow]}>
              <View style={styles.termsRow}>
                <FontAwesome
                  name={acceptTerms ? 'check-square-o' : 'square-o'}
                  size={24}
                  color={acceptTerms ? COLORS.primary : COLORS.borderColor}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                />
                <Text style={styles.termsText}>
                  {t('accept_refund_policy')}{' '}
                </Text>
                <Text
                  style={{
                    color: COLORS.primary,
                    textDecorationLine: 'underline',
                    fontFamily: Fonts.Sen_Medium,
                  }}
                  onPress={handleOpenRefundPolicy}>
                  {t('view_details') || 'View Details'}
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
              disabled={loading || isProcessingPayment}
            />
          </View>
        </View>
      </View>
      {/* Refund Policy Modal */}
      <Modal
        visible={refundPolicyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseRefundPolicy}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                // width: modalWidth,
                maxHeight: modalHeight,
                marginBottom: 0,
                marginTop: 'auto',
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('refund_policy') || 'Refund Policy'}
              </Text>
              <TouchableOpacity onPress={handleCloseRefundPolicy}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.primaryTextDark}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {refundPolicyLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : refundPolicyContent &&
                refundPolicyContent.startsWith('<!DOCTYPE html') ? (
                <WebView
                  originWhitelist={['*']}
                  source={{html: refundPolicyContent}}
                  style={{
                    flex: 1,
                    minHeight: 200,
                    backgroundColor: 'transparent',
                  }}
                  containerStyle={{flex: 1, backgroundColor: 'transparent'}}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                />
              ) : (
                <ScrollView>
                  <Text style={styles.modalText}>{refundPolicyContent}</Text>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  totalInfoLeft: {
    flexDirection: 'column',
    flex: 1,
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
  feeNoteText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    marginTop: 2,
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
  paymentMethodsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginBottom: verticalScale(20),
    marginHorizontal: scale(4),
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: scale(4),
    paddingVertical: 8,
  },
  paymentMethodText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginLeft: 4,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  modalBody: {
    // flex: 1,
    minHeight: '80%',
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 0,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
});

export default PaymentScreen;
