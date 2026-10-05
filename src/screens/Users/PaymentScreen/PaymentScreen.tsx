import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import PrimaryButton from '../../../components/PrimaryButton';
import {
  COLORS,
  COMMON_LIST_STYLE,
  COMMON_RADIO_CONTAINER_STYLE,
} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Images } from '../../../theme/Images';
import Octicons from 'react-native-vector-icons/Octicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCommonToast } from '../../../common/CommonToast';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import {
  getWallet,
  postCreateRazorpayOrder,
  postVerrifyPayment,
  getRefundPolicy,
} from '../../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import { WebView } from 'react-native-webview';
import { translateData } from '../../../utils/TranslateData';
import Config from 'react-native-config';

const PaymentScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation: any = useNavigation();
  const currentLanguage = i18n.language;

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
    poojaDescription,
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
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU';

  const { showErrorToast, showSuccessToast } = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<any>({});
  const [location, setLocation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [refundPolicyVisible, setRefundPolicyVisible] = useState(false);
  const [refundPolicyContent, setRefundPolicyContent] = useState<string>('');
  const [refundPolicyLoading, setRefundPolicyLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'online' | 'cod'
  >('online');
  const [translatedPoojaName, setTranslatedPoojaName] = useState('');
  const [translatedPoojaDescription, setTranslatedPoojaDescription] =
    useState('');
  const [translatedPanditName, setTranslatedPanditName] = useState('');

  const isProcessingPaymentRef = useRef(false);
  const loadingRef = useRef(false);
  const razorpayOrderInProgress = useRef(false);
  const razorpayOrderBookingId = useRef<string | null>(booking_Id);

  const { width, height } = Dimensions.get('window');
  const modalWidth = width * 0.96;
  const modalHeight = height * 0.9;

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

  useEffect(() => {
    isProcessingPaymentRef.current = isProcessingPayment;
  }, [isProcessingPayment]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (usePoints) {
      if (walletBalanceForCalc >= grossAmount) {
        setSelectedPaymentMethod('online');
      } else {
        setSelectedPaymentMethod('online');
      }
    }
  }, [usePoints, walletBalanceForCalc, grossAmount]);

  const handlePaymentMethodChange = (method: 'online' | 'cod') => {
    if (method === 'cod') {
      setUsePoints(false);
    }
    setSelectedPaymentMethod(method);
  };

  useEffect(() => {
    let isMounted = true;
    const translatePoojaFields = async () => {
      if (currentLanguage === 'en') {
        if (isMounted) {
          setTranslatedPoojaName(puja_name || '');
          setTranslatedPoojaDescription(poojaDescription || '');
          setTranslatedPanditName(displayPanditName || '');
        }
        return;
      }
      try {
        const result = (await translateData(
          [{ puja_name, poojaDescription, displayPanditName }],
          currentLanguage,
          ['puja_name', 'poojaDescription', 'displayPanditName'],
        )) as Array<{
          puja_name: string;
          poojaDescription: string;
          displayPanditName: string;
        }>;
        if (isMounted) {
          setTranslatedPoojaName(result[0]?.puja_name || puja_name || '');
          setTranslatedPoojaDescription(
            result[0]?.poojaDescription || poojaDescription || '',
          );
          setTranslatedPanditName(
            result[0]?.displayPanditName || displayPanditName || '',
          );
        }
      } catch {
        if (isMounted) {
          setTranslatedPoojaName(puja_name || '');
          setTranslatedPoojaDescription(poojaDescription || '');
          setTranslatedPanditName(displayPanditName || '');
        }
      }
    };
    translatePoojaFields();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage, puja_name, poojaDescription]);

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

  useEffect(() => {
    fetchLocation();
    fetchWallet();
  }, []);

  useEffect(() => {
    const beforeRemove = navigation.addListener(
      'beforeRemove',
      (e: { preventDefault: () => void; data: { action: any } }) => {
        if (!isProcessingPaymentRef.current && !loadingRef.current) {
          return;
        }
        e.preventDefault();
        Alert.alert(
          'Payment in progress',
          'Are you sure you want to cancel the payment?',
          [
            { text: 'Stay', style: 'cancel' },
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
      },
    );

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isProcessingPaymentRef.current && !loadingRef.current) {
        return false;
      }
      Alert.alert(
        'Payment in progress',
        'Are you sure you want to cancel the payment?',
        [
          { text: 'Stay', style: 'cancel' },
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
      showErrorToast(error.response?.data?.message || 'Failed to get wallet');
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
      // Always reset orderId to allow new creation
      if (razorpayOrderBookingId.current === bookingIdForOrder && orderId) {
        return { order_id: orderId };
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

        // Always create fresh order, and store orderId
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
      location?.latitude,
      location?.longitude,
      grossAmount,
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
          // navigation.navigate('BookingSuccessfullyScreen', {
          //   booking: booking_id,
          //   panditjiData,
          //   selectManualPanitData,
          //   panditName,
          //   panditImage,
          //   auto,
          // });
          isProcessingPaymentRef.current = false;
          loadingRef.current = false;
          setIsProcessingPayment(false);
          setIsLoading(false);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'UserAppBottomTabNavigator',
                state: {
                  index: 0, // your Home tab index
                  routes: [
                    {
                      name: 'UserHomeNavigator',
                      state: {
                        index: 1, // because BookingSuccessfullyScreen is the 2nd screen
                        routes: [
                          { name: 'UserHomeScreen' },
                          {
                            name: 'BookingSuccessfullyScreen',
                            params: {
                              booking: booking_Id,
                              auto,
                              panditName,
                              panditImage,
                              panditjiData,
                              selectManualPanitData,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
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
      setOrderId(null); // Always reset orderId at the very start of payment attempt

      const walletBalance = getWalletBalance();
      const totalPrice = grossAmount;
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
          // navigation.navigate('BookingSuccessfullyScreen', {
          //   booking: booking_Id,
          //   panditjiData,
          //   selectManualPanitData,
          //   panditName,
          //   panditImage,
          //   auto,
          // });
          isProcessingPaymentRef.current = false;
          loadingRef.current = false;
          setIsProcessingPayment(false);
          setIsLoading(false);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'UserAppBottomTabNavigator',
                state: {
                  index: 0, // your Home tab index
                  routes: [
                    {
                      name: 'UserHomeNavigator',
                      state: {
                        index: 1, // because BookingSuccessfullyScreen is the 2nd screen
                        routes: [
                          { name: 'UserHomeScreen' },
                          {
                            name: 'BookingSuccessfullyScreen',
                            params: {
                              booking: booking_Id,
                              auto,
                              panditName,
                              panditImage,
                              panditjiData,
                              selectManualPanitData,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
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
          // navigation.navigate('BookingSuccessfullyScreen', {
          //   booking: booking_Id,
          //   panditjiData,
          //   selectManualPanitData,
          //   panditName,
          //   panditImage,
          //   auto,
          // });
          isProcessingPaymentRef.current = false;
          loadingRef.current = false;
          setIsProcessingPayment(false);
          setIsLoading(false);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'UserAppBottomTabNavigator',
                state: {
                  index: 0, // your Home tab index
                  routes: [
                    {
                      name: 'UserHomeNavigator',
                      state: {
                        index: 1, // because BookingSuccessfullyScreen is the 2nd screen
                        routes: [
                          { name: 'UserHomeScreen' },
                          {
                            name: 'BookingSuccessfullyScreen',
                            params: {
                              booking: booking_Id,
                              auto,
                              panditName,
                              panditImage,
                              panditjiData,
                              selectManualPanitData,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
        return;
      }

      // Step 2: Configure Razorpay options
      const razorpayOptions = {
        description: 'Puja Booking Payment',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: Config.RAZORPAY_KEY,
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
        theme: { color: COLORS.primary },
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
      // Always clear orderId on cancel or failure, so next payment creates a fresh booking
      setOrderId(null);
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

  const fetchRefundPolicy = async () => {
    setRefundPolicyLoading(true);
    setRefundPolicyContent('');
    try {
      const data = await getRefundPolicy();
      setRefundPolicyContent(data);
    } catch (error) {
      setRefundPolicyContent(
        'Failed to load refund policy. Please try again later.',
      );
    } finally {
      setRefundPolicyLoading(false);
    }
  };

  const handleOpenRefundPolicy = async () => {
    setRefundPolicyVisible(true);
    await fetchRefundPolicy();
  };

  const handleCloseRefundPolicy = () => {
    setRefundPolicyVisible(false);
    setRefundPolicyContent('');
  };

  const formattedBookingDate = (() => {
    if (!booking_date) return '';
    const date = new Date(booking_date);
    if (isNaN(date.getTime())) return booking_date;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  const hasPandit =
    AutoModeSelection == false &&
    Boolean(displayPanditImage && displayPanditName);

  const renderBookingData = () => (
    <View style={styles.bookingDataItem}>
      {/* Address Row */}
      <View style={styles.detailRow}>
        <View
          style={[styles.detailIconContainer, { backgroundColor: '#FFF4EC' }]}
        >
          <Octicons name="location" size={16} color="#E65100" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>
            {t('puja_location') || 'PUJA LOCATION'}
          </Text>
          <Text style={styles.detailValue} numberOfLines={2}>
            {translatedPoojaDescription || selectAddress || ''}
          </Text>
        </View>
      </View>

      {/* Date Row */}
      <View style={styles.detailRow}>
        <View
          style={[styles.detailIconContainer, { backgroundColor: '#FEECEB' }]}
        >
          <Octicons name="calendar" size={16} color={COLORS.primary} />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>
            {t('puja_date') || 'PUJA DATE'}
          </Text>
          <Text style={styles.detailValue}>{formattedBookingDate}</Text>
        </View>
      </View>

      {/* Muhurat Time Row */}
      <View style={[styles.detailRow, !hasPandit && styles.detailRowNoBorder]}>
        <View
          style={[styles.detailIconContainer, { backgroundColor: '#FFF9E6' }]}
        >
          <Octicons name="clock" size={16} color="#D97706" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>
            {t('muhurat_time') || 'MUHURAT TIME'}
          </Text>
          <Text style={styles.detailValue}>{muhurat_time}</Text>
        </View>
      </View>

      {/* Pandit Row if selected */}
      {hasPandit && (
        <View style={[styles.detailRow, styles.detailRowNoBorder]}>
          <Image
            source={{ uri: displayPanditImage }}
            style={styles.panditAvatar}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>
              {t('assigned_pandit') || 'ASSIGNED PANDIT'}
            </Text>
            <Text style={styles.detailValueBold}>{translatedPanditName}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderPaymentMethods = () => {
    const walletCoversBooking =
      usePoints && walletBalanceForCalc >= grossAmount;
    return (
      <View
        style={[styles.paymentMethodsSection, COMMON_RADIO_CONTAINER_STYLE]}
      >
        <View style={styles.paymentSectionHeader}>
          <Text style={styles.paymentMethodLabel}>
            {t('select_payment_method') || 'Select Payment Method'}
          </Text>
          <View style={styles.secureHeaderBadge}>
            <MaterialIcons name="verified-user" size={13} color="#16A34A" />
            <Text style={styles.secureHeaderText}>100% Secure</Text>
          </View>
        </View>

        {/* Option 1: Pay Online */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedPaymentMethod === 'online' &&
              styles.paymentOptionCardActive,
            walletCoversBooking && styles.paymentOptionCardDisabled,
          ]}
          activeOpacity={walletCoversBooking ? 1 : 0.7}
          onPress={() => {
            if (!walletCoversBooking) handlePaymentMethodChange('online');
          }}
          disabled={walletCoversBooking}
        >
          <View style={styles.paymentOptionLeft}>
            <View
              style={[
                styles.paymentOptionIconWrap,
                selectedPaymentMethod === 'online' &&
                  styles.paymentOptionIconWrapActive,
              ]}
            >
              <MaterialIcons
                name="credit-card"
                size={22}
                color={
                  selectedPaymentMethod === 'online'
                    ? COLORS.primary
                    : COLORS.pujaCardSubtext
                }
              />
            </View>
            <View style={styles.paymentOptionTextWrap}>
              <Text
                style={[
                  styles.paymentOptionTitle,
                  selectedPaymentMethod === 'online' &&
                    styles.paymentOptionTitleActive,
                ]}
              >
                {t('pay_online') || 'Pay Online'}
              </Text>
              <Text style={styles.paymentOptionSubtitle}>
                UPI, Cards, Netbanking & Wallets
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.customRadioOuter,
              selectedPaymentMethod === 'online' &&
                styles.customRadioOuterActive,
            ]}
          >
            {selectedPaymentMethod === 'online' && (
              <View style={styles.customRadioInner} />
            )}
          </View>
        </TouchableOpacity>

        {/* Option 2: Cash on Service */}
        <TouchableOpacity
          style={[
            styles.paymentOptionCard,
            selectedPaymentMethod === 'cod' && styles.paymentOptionCardActive,
            walletCoversBooking && styles.paymentOptionCardDisabled,
          ]}
          activeOpacity={walletCoversBooking ? 1 : 0.7}
          onPress={() => {
            if (!walletCoversBooking) handlePaymentMethodChange('cod');
          }}
          disabled={walletCoversBooking}
        >
          <View style={styles.paymentOptionLeft}>
            <View
              style={[
                styles.paymentOptionIconWrap,
                selectedPaymentMethod === 'cod' &&
                  styles.paymentOptionIconWrapActive,
              ]}
            >
              <MaterialIcons
                name="payments"
                size={22}
                color={
                  selectedPaymentMethod === 'cod'
                    ? COLORS.primary
                    : COLORS.pujaCardSubtext
                }
              />
            </View>
            <View style={styles.paymentOptionTextWrap}>
              <Text
                style={[
                  styles.paymentOptionTitle,
                  selectedPaymentMethod === 'cod' &&
                    styles.paymentOptionTitleActive,
                ]}
              >
                {t('cash_on_delivery') || 'Cash on Service'}
              </Text>
              <Text style={styles.paymentOptionSubtitle}>
                Pay directly to Panditji after the puja
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.customRadioOuter,
              selectedPaymentMethod === 'cod' && styles.customRadioOuterActive,
            ]}
          >
            {selectedPaymentMethod === 'cod' && (
              <View style={styles.customRadioInner} />
            )}
          </View>
        </TouchableOpacity>

        {walletCoversBooking && (
          <View style={styles.walletCoverageBadge}>
            <MaterialIcons
              name="info-outline"
              size={15}
              color="#B45309"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.walletCoverageMessage}>
              {t('payment_method_disabled_wallet_full') ||
                'Payment method selection is disabled because your wallet fully covers the booking amount.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: inset.top }]}>
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
              { paddingBottom: moderateScale(24) },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            scrollEventThrottle={16}
          >
            <View style={styles.contentWrapper}>
              {/* Total Amount Group */}
              <View style={styles.totalAmountGroup}>
                <View style={[styles.totalSection, COMMON_LIST_STYLE]}>
                  <View style={styles.totalRow}>
                    <View style={styles.totalLeftInfo}>
                      <View style={styles.totalBadgeIconWrap}>
                        <MaterialIcons
                          name="receipt"
                          size={22}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={styles.totalTextColumn}>
                        <Text style={styles.totalAmountLabelBold}>
                          {t('total_payable') || 'Total Payable'}
                        </Text>
                        <Text style={styles.totalSubnote}>
                          {t('includes_taxes') ||
                            'Includes ritual dakshina & taxes'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.totalPriceWrap}>
                      <Text style={styles.totalAmountBold}>
                        ₹ {(usePoints ? payableAmount : grossAmount).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {usePoints && walletUseAmountCalc > 0 ? (
                    <View style={styles.breakdownWrap}>
                      <View style={styles.breakdownDivider} />
                      <View style={styles.breakdownItemRow}>
                        <Text style={styles.breakdownItemLabel}>Puja Fee</Text>
                        <Text style={styles.breakdownItemValue}>
                          ₹ {grossAmount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.breakdownItemRow}>
                        <View style={styles.walletDiscountLabelRow}>
                          <MaterialIcons
                            name="check-circle"
                            size={14}
                            color="#16A34A"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.walletDiscountLabel}>
                            Wallet Points Applied
                          </Text>
                        </View>
                        <Text style={styles.walletDiscountValue}>
                          - ₹ {walletUseAmountCalc.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Use Points Group */}
              <View style={styles.usePointsGroup}>
                <TouchableOpacity
                  style={[
                    styles.pointsSection,
                    COMMON_LIST_STYLE,
                    usePoints && styles.pointsSectionActive,
                  ]}
                  activeOpacity={walletBalanceForCalc > 0 ? 0.7 : 1}
                  onPress={() => {
                    if (walletBalanceForCalc > 0) {
                      setUsePoints(!usePoints);
                    }
                  }}
                >
                  <View style={styles.pointsRow}>
                    <View style={styles.pointsLeft}>
                      <View
                        style={[
                          styles.customCheckbox,
                          usePoints && styles.customCheckboxActive,
                        ]}
                      >
                        {usePoints && (
                          <MaterialIcons
                            name="check"
                            size={16}
                            color={COLORS.white}
                          />
                        )}
                      </View>
                      <View style={styles.pointsTextContainer}>
                        <Text style={styles.pointsLabel}>
                          {t('use_available_points') || 'Use Available Points'}
                        </Text>
                        <Text style={styles.pointsSubLabel}>
                          {walletBalanceForCalc > 0
                            ? usePoints
                              ? `Save ₹${walletUseAmountCalc.toFixed(
                                  2,
                                )} with wallet points`
                              : `Tap to apply up to ₹${walletBalanceForCalc.toFixed(
                                  2,
                                )}`
                            : 'No wallet points available'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pointsRight}>
                      <View style={styles.coinBadge}>
                        <Image
                          source={Images.ic_coin}
                          style={styles.pointsIcon}
                        />
                        <Text style={styles.pointsValue}>
                          {walletData.balance !== undefined &&
                          walletData.balance !== null
                            ? Number(walletData.balance).toFixed(2)
                            : '0.00'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Payment Methods Group */}
              <View style={styles.paymentMethodsGroup}>
                {renderPaymentMethods()}
              </View>

              {/* Booking Data Group */}
              <View style={styles.bookingDataGroup}>
                <View style={[styles.suggestedSection, COMMON_LIST_STYLE]}>
                  <View style={styles.suggestedPujaRow}>
                    <View style={styles.suggestedLeft}>
                      <View style={styles.pujaImageContainer}>
                        <Image
                          source={{
                            uri:
                              puja_image ||
                              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
                          }}
                          style={styles.pujaImage}
                        />
                      </View>
                      <View style={styles.pujaHeaderInfo}>
                        <Text
                          style={styles.suggestedPujaName}
                          numberOfLines={1}
                        >
                          {translatedPoojaName || puja_name || 'Puja Service'}
                        </Text>
                        <View style={styles.pujaBadgeTag}>
                          <Text style={styles.pujaBadgeText}>
                            Vedic Ceremony
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.bookingDataContainer}>
                    {renderBookingData()}
                  </View>
                </View>
              </View>

              {/* Terms Group */}
              <View style={styles.termsGroup}>
                <TouchableOpacity
                  style={[styles.termsSection, COMMON_LIST_STYLE]}
                  activeOpacity={0.7}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                >
                  <View style={styles.termsRow}>
                    <View
                      style={[
                        styles.customCheckbox,
                        acceptTerms && styles.customCheckboxActive,
                        { marginRight: 10 },
                      ]}
                    >
                      {acceptTerms && (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={COLORS.white}
                        />
                      )}
                    </View>
                    <Text style={styles.termsText} numberOfLines={2}>
                      {t('accept_refund_policy') || 'I agree to the'}{' '}
                      <Text
                        style={styles.viewDetailsText}
                        onPress={e => {
                          e.stopPropagation();
                          handleOpenRefundPolicy();
                        }}
                      >
                        {t('view_details') || 'Cancellation & Refund Policy'}
                      </Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          <View
            style={[
              styles.fixedButtonContainer,
              {
                paddingBottom: inset.bottom,
              },
            ]}
          >
            <View style={styles.trustFooterRow}>
              <MaterialIcons name="verified-user" size={14} color="#16A34A" />
              <Text style={styles.trustFooterText}>
                100% Safe & Verified Booking
              </Text>
            </View>
            <PrimaryButton
              title={
                loading || isProcessingPayment
                  ? 'Processing...'
                  : t('confirm_booking') || 'CONFIRM BOOKING'
              }
              onPress={handlePayment}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={loading || isProcessingPayment}
              activeOpacity={0.8}
            />
          </View>
        </View>
      </View>
      {/* Refund Policy Modal */}
      <Modal
        visible={refundPolicyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseRefundPolicy}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              styles.modalPositioning,
              { maxHeight: modalHeight },
            ]}
          >
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
                  source={{ html: refundPolicyContent }}
                  style={styles.webViewStyle}
                  containerStyle={styles.webViewContainerStyle}
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
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  contentWrapper: {
    width: '100%',
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(14),
  },
  totalAmountGroup: {
    marginTop: moderateScale(16),
  },
  usePointsGroup: {},
  paymentMethodsGroup: {},
  bookingDataGroup: {},
  termsGroup: {},
  totalSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: scale(10),
  },
  totalBadgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  totalTextColumn: {
    flex: 1,
  },
  totalAmountLabelBold: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  totalSubnote: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    marginTop: 2,
  },
  totalPriceWrap: {
    alignItems: 'flex-end',
  },
  totalAmountBold: {
    fontSize: 18,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  breakdownWrap: {
    marginTop: moderateScale(10),
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    marginBottom: moderateScale(8),
  },
  breakdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  breakdownItemLabel: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
  },
  breakdownItemValue: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  walletDiscountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletDiscountLabel: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: '#16A34A',
  },
  walletDiscountValue: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Bold,
    color: '#16A34A',
  },
  pointsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#F0ECE6',
  },
  pointsSectionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFDFB',
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
    marginRight: 8,
  },
  customCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginRight: scale(10),
  },
  customCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pointsTextContainer: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  pointsSubLabel: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    marginTop: 2,
  },
  pointsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsIcon: {
    width: 17,
    height: 17,
    marginRight: 4,
  },
  pointsValue: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Bold,
    color: '#B45309',
  },
  paymentMethodsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  paymentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  paymentMethodLabel: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  secureHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  secureHeaderText: {
    fontSize: 10,
    fontFamily: Fonts.Sen_Bold,
    color: '#16A34A',
    marginLeft: 3,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#F0ECE6',
    backgroundColor: COLORS.white,
    marginBottom: moderateScale(10),
  },
  paymentOptionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F7',
  },
  paymentOptionCardDisabled: {
    opacity: 0.5,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  paymentOptionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  paymentOptionIconWrapActive: {
    backgroundColor: '#FFE8E2',
  },
  paymentOptionTextWrap: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  paymentOptionTitleActive: {
    color: COLORS.primaryTextDark,
  },
  paymentOptionSubtitle: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    marginTop: 2,
  },
  customRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  customRadioOuterActive: {
    borderColor: COLORS.primary,
  },
  customRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  walletCoverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  walletCoverageMessage: {
    color: '#92400E',
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    flex: 1,
  },
  suggestedSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F0ECE6',
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
    marginRight: scale(12),
  },
  pujaImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  pujaHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestedPujaName: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  pujaBadgeTag: {
    backgroundColor: '#FFF4EE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pujaBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  bookingDataContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
    marginTop: moderateScale(12),
    paddingTop: moderateScale(4),
  },
  bookingDataItem: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#F6F4F0',
    borderBottomWidth: 1,
    paddingVertical: moderateScale(9),
  },
  detailRowNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: moderateScale(4),
  },
  detailIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.pujaCardSubtext,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginTop: 2,
  },
  detailValueBold: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginTop: 2,
  },
  panditAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: scale(12),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  termsSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    flex: 1,
    lineHeight: 18,
  },
  viewDetailsText: {
    fontSize: 12,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontFamily: Fonts.Sen_Bold,
  },
  fixedButtonContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  trustFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8),
  },
  trustFooterText: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Medium,
    color: '#16A34A',
    marginLeft: 4,
  },
  buttonContainer: {
    height: 48,
    borderRadius: 10,
    marginTop: 0,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
  },
  modalPositioning: {
    marginBottom: 0,
    marginTop: 'auto' as const,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(8),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  modalBody: {
    minHeight: '80%',
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(18),
    paddingTop: moderateScale(0),
    marginBottom: moderateScale(20),
  },
  modalText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    lineHeight: 20,
  },
  webViewStyle: {
    flex: 1,
    minHeight: 200,
    backgroundColor: 'transparent',
  },
  webViewContainerStyle: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default PaymentScreen;
