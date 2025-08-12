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
import React from 'react';
import CustomHeader from '../../../components/CustomHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import Fonts from '../../../theme/fonts';
import {COLORS} from '../../../theme/theme';
import {Images} from '../../../theme/Images';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {useNavigation, useRoute} from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const BookingSuccessfullyScreen: React.FC = () => {
  type ScreenNavigationProps = StackNavigationProp<
    UserPoojaListParamList,
    'BookingSuccessfullyScreen'
  >;
  const {t, i18n} = useTranslation();

  const inset = useSafeAreaInsets();

  const navigation = useNavigation<ScreenNavigationProps>();
  const route = useRoute();
  // Check if route.params exists and has the expected property
  // Always extract booking from route.params, even if it's null/undefined
  const {
    booking,
    panditjiData,
    selectManualPanitData,
    panditName,
    panditImage,
  } = route.params as any;

  console.log('booking-1', booking);

  console.log('panditjiData :: ', panditjiData);
  console.log('selectManualPanitData :: ', selectManualPanitData);
  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('booking_successfully')} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <View style={styles.detailsContainer}>
            <Image
              source={Images.ic_booking_success}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.successText}>
              {t('booking_completed_successfully')}
            </Text>
            <PrimaryButton
              title={t('rate_your_experience')}
              onPress={() =>
                navigation.navigate('RateYourExperienceScreen', {
                  booking: booking,
                  panditjiData: panditjiData,
                  selectManualPanitData: selectManualPanitData,
                  panditName: panditName,
                  panditImage: panditImage,
                })
              }
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingSuccessfullyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  image: {
    width: 260,
    height: 177,
    alignSelf: 'center',
    marginBottom: 20,
  },
  successText: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  buttonContainer: {
    height: 46,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'center',
  },
});
