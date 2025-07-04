import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {useTranslation} from 'react-i18next';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import PrimaryButton from '../../../components/PrimaryButton';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const paymentMethods = [
  {
    id: 'card',
    label: 'Credit/Debit Card',
    icon: 'card-outline',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    icon: 'globe-outline',
  },
  {
    id: 'upi',
    label: 'UPI Payment',
    icon: 'logo-google',
  },
];

const WalletTopUpScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar
        translucent
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />

      <UserCustomHeader
        title={t('top_up_wallet')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS !== 'ios'
                ? insets.bottom + verticalScale(32)
                : verticalScale(32),
          }}>
          <View style={[styles.paymentMethodsCard, THEMESHADOW.shadow]}>
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map((method, idx) => {
                const isLast = idx === paymentMethods.length - 1;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodItem,
                      !isLast && styles.paymentMethodItemBorder,
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                    activeOpacity={0.7}>
                    <Text style={styles.paymentMethodText}>{method.label}</Text>
                    <Ionicons
                      name={
                        selectedPaymentMethod === method.id
                          ? 'checkmark-circle-outline'
                          : 'ellipse-outline'
                      }
                      size={moderateScale(24)}
                      color={
                        selectedPaymentMethod === method.id
                          ? COLORS.gradientEnd
                          : COLORS.inputBoder
                      }
                      style={{marginLeft: 'auto'}}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{gap: 14}}>
            <PrimaryButton
              title={t('next')}
              textStyle={styles.buttonText}
              onPress={() => {
                // TODO: handle next action
              }}
              style={{flex: 1}}
            />
            <PrimaryButton
              title={t('cancel')}
              onPress={() => navigation.goBack()}
              textStyle={styles.buttonText}
              style={{
                flex: 1,
                backgroundColor: COLORS.white,
                borderWidth: 1,
                borderColor: COLORS.primaryBackgroundButton,
              }}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(24),
  },
  paymentMethodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(14),
  },
  paymentMethodsList: {
    paddingHorizontal: verticalScale(14),
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
  },
  paymentMethodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separatorColor,
  },
  paymentMethodText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  buttonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
});

export default WalletTopUpScreen;
