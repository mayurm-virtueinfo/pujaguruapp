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
  postBooking,
  postCreateRazorpayOrder,
  postVerrifyPayment,
} from '../../../api/apiService';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'upi';
}

interface PujaItem {
  id: string;
  name: string;
  image: string;
  selected: boolean;
  bookingdata: {
    address: string;
    date: string;
    time: string;
    pandit: {
      name: string;
      image: string;
    };
  }[];
}

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
  } = route.params as any;

  console.log('oute.params', route.params);

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: string;
    longitude: string;
  } | null>(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [panditData, setPanditjiData] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string | undefined>();

  // Prevent duplicate API calls for Razorpay order
  const razorpayOrderInProgress = useRef(false);

  // Store the bookingId for which the orderId was created, to avoid duplicate order creation
  const razorpayOrderBookingId = useRef<string | null>(null);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const location = await AsyncStorage.getItem(AppConstant.LOCATION);
      if (location) {
        const parsedLocation = JSON.parse(location);
        setLocation(parsedLocation);
      }
    } catch (error) {
      console.error('Error fetching location ::', error);
    }
  };

  useEffect(() => {
    if (location && poojaId) {
      fetchPanditji(
        poojaId,
        location.latitude,
        location.longitude,
        'auto',
        booking_date,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, poojaId]);

  // Helper to build bookingData with only address or tirth
  const buildBookingData = () => {
    let bookingData: any = {
      pooja: typeof poojaId === 'string' ? parseInt(poojaId, 10) : poojaId,
      pandit:
        typeof pandit === 'string'
          ? parseInt(pandit, 10)
          : pandit || panditData?.pandit_id,
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
  console.log('buildBookingData', buildBookingData());
  // Function to create Razorpay order, expects bookingId as argument
  // Prevents duplicate API calls by using a ref flag and bookingId check
  const handleCreateRazorpayOrder = useCallback(
    async (bookingIdForOrder: string) => {
      // If we already have an orderId for this bookingId, just return it
      if (razorpayOrderBookingId.current === bookingIdForOrder && orderId) {
        return {order_id: orderId};
      }
      if (razorpayOrderInProgress.current) {
        // Prevent duplicate calls
        return null;
      }
      razorpayOrderInProgress.current = true;
      setIsLoading(true);
      try {
        const data = {
          booking_id: bookingIdForOrder,
        };
        const response: any = await postCreateRazorpayOrder(data as any);
        console.log('respnse=========>', response.data);
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
        showErrorToast(error?.message || 'Failed to create Razorpay order.');
        return null;
      } finally {
        setIsLoading(false);
        razorpayOrderInProgress.current = false;
      }
    },
    [orderId, showSuccessToast, showErrorToast],
  );

  const fetchPanditji = async (
    pooja_id: string,
    latitude: string,
    longitude: string,
    mode: 'auto',
    booking_date: string,
  ) => {
    try {
      setIsLoading(true);
      const response = await getPanditji(
        pooja_id,
        latitude,
        longitude,
        mode,
        booking_date,
      );
      if (response.success) {
        setPanditjiData(response.data);
      }
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to fetch panditji');
    } finally {
      setIsLoading(false);
    }
  };

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {id: 'credit', name: t('credit_card'), type: 'credit'},
    {id: 'debit', name: t('debit_card'), type: 'debit'},
    {id: 'upi', name: t('upi'), type: 'upi'},
  ];

  // Example puja data
  const suggestedPuja: PujaItem = {
    id: '1',
    name: 'Ganpati Puja',
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/24292f0e9447973408fd61ab1331433de4ed2bb8?placeholderIfAbsent=true',
    selected: false,
    bookingdata: [
      {
        address: 'Home: Primary residence',
        date: '15/09/2025',
        time: '10:00 AM',
        pandit: {
          name: 'Pandit Ram Sharma',
          image:
            'https://cdn.builder.io/api/v1/image/assets/TEMP/24292f0e9447973408fd61ab1331433de4ed2bb8?placeholderIfAbsent=true',
        },
      },
    ],
  };

  // Function to verify payment using postVerrifyPayment API
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
      const data = {
        booking_id,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      };
      const response: any = await postVerrifyPayment(data);
      if (response && response.data.success) {
        showSuccessToast('Payment verified successfully!');
        navigation.navigate('BookingSuccessfullyScreen', {booking: booking_id});
      } else {
        showErrorToast(response?.message || 'Payment verification failed===>.');
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Payment verification failed------>.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async (
    amount: number,
    bookingIdForOrder: string,
    currentOrderId: string,
  ) => {
    // Always use the orderId for the current bookingId
    let updatedOrderId = currentOrderId;
    if (
      !updatedOrderId ||
      razorpayOrderBookingId.current !== bookingIdForOrder
    ) {
      // If orderId is not set or is for a different booking, create it
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
      key: 'rzp_test_birUVdrhV4Jm7l', // Replace with your Razorpay Key ID
      amount: amount.toString(), // Amount in paise
      name: 'Your App Name',
      order_id: updatedOrderId, // Use the correct order_id here
      prefill: {
        email: 'user@example.com',
        contact: '9999999999',
        name: 'User Name',
      },
      theme: {color: COLORS.primary},
    };

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        console.log('data=========>', data);
        showSuccessToast(`Payment successful: ${JSON.stringify(data)}`);
        console.log(
          'booking_id',
          bookingIdForOrder,
          'razorpay_payment_id',
          data.razorpay_payment_id,
          'razorpay_order_id',
          updatedOrderId,
          'razorpay_signature',
          data.razorpay_signature,
        );
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

  // Payment method selection
  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!acceptTerms) {
      showErrorToast('Please accept the terms and conditions to proceed.');
      return;
    }
    if (!selectedPaymentMethod) {
      showErrorToast('Please select a payment method.');
      return;
    }

    // Only allow payment for online methods
    if (
      selectedPaymentMethod === 'credit' ||
      selectedPaymentMethod === 'debit' ||
      selectedPaymentMethod === 'upi'
    ) {
      // 500000 paise = ₹5000, you may want to calculate this dynamically
      const amount = 500000;

      setIsLoading(true);
      try {
        // Always call postBooking first, then postCreateRazorpayOrder
        const bookingData = buildBookingData();
        const bookingResponse = await postBooking(bookingData as any);
        if (
          bookingResponse &&
          bookingResponse.data &&
          bookingResponse.data.status &&
          bookingResponse.data.data &&
          bookingResponse.data.data.id
        ) {
          const newBookingId = bookingResponse.data.data.id;
          setBookingId(newBookingId);

          // Only create Razorpay order if not already created for this bookingId
          let currentOrderId = orderId;
          if (
            !currentOrderId ||
            razorpayOrderBookingId.current !== newBookingId
          ) {
            const razorpayOrder = await handleCreateRazorpayOrder(newBookingId);
            console.log('razorpayOrder=======>', razorpayOrder);
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
          // Show error details for debugging
          if (bookingResponse && bookingResponse.errors) {
            showErrorToast(
              `Booking failed=-=-=-=-->: ${JSON.stringify(
                bookingResponse.errors,
              )}`,
            );
          } else {
            showErrorToast(bookingResponse?.message || 'Booking failed.');
          }
        }
      } catch (error: any) {
        // Show error details for debugging
        if (error?.response?.data) {
          showErrorToast(
            `Error Booking=-=-==-----=-==-: ${JSON.stringify(
              error.response.data,
            )}`,
          );
        } else {
          showErrorToast(error?.message || 'Booking failed.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // For offline methods, just book and navigate
      setIsLoading(true);
      try {
        const bookingData = buildBookingData();
        console.log('bookingData', bookingData);
        const response = await postBooking(bookingData as any);
        if (response && response.success) {
          setBookingId(response.data.id);
          showSuccessToast('Booking successful!');
        } else {
          if (response && response.errors) {
            showErrorToast(
              `Booking failed: ${JSON.stringify(response.errors)}`,
            );
          } else {
            showErrorToast(response?.message || 'Booking failed.');
          }
        }
      } catch (error: any) {
        if (error?.response?.data) {
          showErrorToast(
            `Error Booking: ${JSON.stringify(error.response.data)}`,
          );
        } else {
          showErrorToast(error?.message || 'Booking failed.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Expand/collapse suggested puja
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Render payment method row
  const renderPaymentMethod = (method: PaymentMethod, index: number) => (
    <View key={method.id}>
      <TouchableOpacity
        style={styles.paymentMethodRow}
        onPress={() => handlePaymentMethodSelect(method.id)}
        activeOpacity={0.7}>
        <Text style={styles.paymentMethodText}>{method.name}</Text>
        <Octicons
          name={selectedPaymentMethod === method.id ? 'check-circle' : 'circle'}
          size={24}
          color={
            selectedPaymentMethod === method.id
              ? COLORS.primary
              : COLORS.borderColor
          }
          style={styles.radioButton}
        />
      </TouchableOpacity>
      {index < paymentMethods.length - 1 && <View style={styles.divider} />}
    </View>
  );

  // Render booking data
  const renderBookingData = (
    item: PujaItem['bookingdata'][0],
    index: number,
  ) => (
    <View key={`${item.address}-${index}`} style={styles.bookingDataItem}>
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
          <Text style={styles.bookingDataText}>{item.address}</Text>
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
          <Text style={styles.bookingDataText}>{item.date}</Text>
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
          <Text style={styles.bookingDataText}>{item.time}</Text>
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
            uri: panditData.profile_img || 'https://via.placeholder.com/150',
          }}
          style={styles.panditImage}
        />
        <Text style={styles.bookingDataText}>{panditData.full_name}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.contentContainer}>
        <UserCustomHeader title={t('payment')} showBackButton={true} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEventThrottle={16}>
          {/* Total Amount Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <View style={styles.totalInfo}>
                <Text style={styles.totalAmountLabel}>{t('total_amount')}</Text>
                <Text style={styles.pujaName}>Ganesh Chaturthi Pooja</Text>
              </View>
              <View style={styles.amoutContainer}>
                <Text style={styles.totalAmount}>₹ 5000</Text>
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
                <Text style={styles.pointsValue}>5250</Text>
              </View>
            </View>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.paymentMethodsSection}>
            {paymentMethods.map((method, index) =>
              renderPaymentMethod(method, index),
            )}
          </View>

          {/* Suggested Puja Section */}
          <View style={styles.suggestedSection}>
            <TouchableOpacity
              style={styles.suggestedPujaRow}
              onPress={toggleExpand}
              activeOpacity={0.7}>
              <View style={styles.suggestedLeft}>
                <View style={styles.pujaImageContainer}>
                  <Image
                    source={{uri: suggestedPuja.image}}
                    style={styles.pujaImage}
                  />
                </View>
                <Text style={styles.suggestedPujaName}>
                  {suggestedPuja.name}
                </Text>
              </View>
              <View
                style={{
                  height: 24,
                  width: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Octicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.pujaCardSubtext}
                />
              </View>
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.bookingDataContainer}>
                {suggestedPuja.bookingdata.map((item, index) =>
                  renderBookingData(item, index),
                )}
              </View>
            )}
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

          <PrimaryButton
            title={t('confirm_booking')}
            onPress={handleConfirmBooking}
            style={styles.buttonContainer}
            textStyle={styles.buttonText}
            disabled={loading}
          />
        </ScrollView>
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
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
});

export default PaymentScreen;
