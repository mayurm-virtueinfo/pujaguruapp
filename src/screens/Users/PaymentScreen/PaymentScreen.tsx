import React, {useState} from 'react';
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
import CustomHeader from '../../../components/CustomHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Images} from '../../../theme/Images';
import Octicons from 'react-native-vector-icons/Octicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {useNavigation} from '@react-navigation/native';
import {useCommonToast} from '../../../common/CommonToast';
import UserCustomHeader from '../../../components/UserCustomHeader';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit' | 'debit';
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
    'BookingSuccessfullyScreen'
  >;

  const navigation = useNavigation<ScreenNavigationProp>();

  const {showErrorToast, showSuccessToast} = useCommonToast();

  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const paymentMethods: PaymentMethod[] = [
    {id: 'credit', name: 'Credit Card', type: 'credit'},
    {id: 'debit1', name: 'Debit Card', type: 'debit'},
    {id: 'debit2', name: 'Debit Card', type: 'debit'},
  ];

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

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleConfirmBooking = () => {
    if (!acceptTerms) {
      showErrorToast('Please accept the terms and conditions to proceed.');
      return;
    }
    navigation.navigate('BookingSuccessfullyScreen');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
        <Image source={{uri: item.pandit.image}} style={styles.panditImage} />
        <Text style={styles.bookingDataText}>{item.pandit.name}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.contentContainer}>
        <UserCustomHeader title="Payment" showBackButton={true} />
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
                <Text style={styles.totalAmountLabel}>Total Amount</Text>
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
                <Text style={styles.pointsLabel}>Use Available Points</Text>
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
              <Text style={styles.termsText}>Accept Terms and Conditions</Text>
            </View>
          </View>

          <PrimaryButton
            title="CONFIRM BOOKING"
            onPress={handleConfirmBooking}
            style={styles.buttonContainer}
            textStyle={styles.buttonText}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Styles remain unchanged
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
