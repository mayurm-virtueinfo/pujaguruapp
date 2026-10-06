import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  BackHandler,
} from 'react-native';
import React, { useCallback } from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import Fonts from '../../../theme/fonts';
import { COLORS } from '../../../theme/theme';
import { Images } from '../../../theme/Images';
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { moderateScale } from 'react-native-size-matters';
import ConfettiCannon from 'react-native-confetti-cannon';

const BookingSuccessfullyScreen: React.FC = () => {
  const { t } = useTranslation();

  const inset = useSafeAreaInsets();
  const navigation: any = useNavigation();

  const handleGoToHome = useCallback(() => {
    const parentNavigator = navigation.getParent?.();
    if (parentNavigator) {
      parentNavigator.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'UserHomeNavigator',
              state: {
                index: 0,
                routes: [{ name: 'UserHomeScreen' }],
              },
            },
          ],
        }),
      );
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'UserHomeScreen' }],
        }),
      );
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleGoToHome();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [handleGoToHome]),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('booking_successfully')} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
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
              title={t('go_to_home')}
              onPress={handleGoToHome}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
            />
          </View>
        </View>
      </ScrollView>
      <ConfettiCannon
        count={150}
        origin={{ x: -10, y: 0 }}
        autoStart={true}
        fadeOut={true}
      />
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
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
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
