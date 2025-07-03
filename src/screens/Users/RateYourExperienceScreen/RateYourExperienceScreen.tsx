import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import CustomHeader from '../../../components/CustomHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const RateYourExperienceScreen: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'BookedPujaDetailsScreen'
  >;
  const {t, i18n} = useTranslation();

  const inset = useSafeAreaInsets();

  const navigation = useNavigation<ScreenNavigationProp>();

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  const handleSubmit = () => {
    setRating(0);
    setFeedback('');
    navigation.navigate('BookedPujaDetailsScreen');
  };

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(index)}
        style={styles.starButton}>
        <Icon
          name="star"
          size={36}
          color={
            isFilled ? COLORS.primaryBackgroundButton : COLORS.bottomNavIcon
          }
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" />

      <UserCustomHeader title={t('rate_experience')} showBackButton={true} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.mainContent}>
          {/* Pandit Details Card */}
          <View style={styles.panditCard}>
            <View style={styles.panditImageContainer}>
              <Image
                source={{
                  uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/db9492299c701c6ca2a23d6de9fc258e7ec2b5fd?width=160',
                }}
                style={styles.panditImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.panditInfo}>
              <Text style={styles.panditName}>Rajesh Sharma</Text>
              <Text style={styles.panditPurpose}>For family well-being</Text>
              <PrimaryButton
                title={t('view_details')}
                onPress={() => navigation.navigate('PanditDetailsScreen')}
                style={styles.viewDetailsButton}
                textStyle={styles.viewDetailsText}
              />
            </View>
          </View>

          {/* Dakshina Section */}
          <View style={styles.dakshinaCard}>
            <Text style={styles.dakshinaText}>{t('dakshina_to_panditji')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate('PaymentScreen');
              }}>
              <AntDesign name="wallet" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>
              {t('how_was_your_experience')}
            </Text>
            <View style={styles.ratingCard}>
              <View style={styles.starsContainer}>
                {[0, 1, 2, 3, 4].map(renderStar)}
              </View>
            </View>
          </View>

          {/* Feedback Section */}
          <View>
            <TextInput
              style={styles.feedbackInput}
              placeholder={t('tell_us_more_about_your_experience')}
              placeholderTextColor="rgba(25, 19, 19, 0.3)"
              multiline
              numberOfLines={4}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
          </View>
          <PrimaryButton
            title={t('submtt_rating')}
            onPress={handleSubmit}
            style={styles.buttonContainer}
            textStyle={styles.buttonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  mainContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    gap: verticalScale(16),
  },
  panditCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: scale(16),
    alignItems: 'center',
    marginHorizontal: scale(4),
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panditImageContainer: {
    width: scale(70),
    height: scale(70),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  panditImage: {
    width: '100%',
    height: '100%',
  },
  panditInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  panditName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    marginBottom: verticalScale(4),
  },
  panditPurpose: {
    color: COLORS.pujaCardSubtext,
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
  },
  viewDetailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    height: 30,
    marginTop: 12,
  },
  viewDetailsText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Regular,
  },
  dakshinaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: 14,
    marginHorizontal: scale(4),
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dakshinaText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  ratingSection: {
    gap: verticalScale(12),
    marginTop: 10,
  },
  ratingTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    paddingHorizontal: scale(4),
  },
  ratingCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingVertical: 10,
    paddingHorizontal: scale(20),
    alignItems: 'center',
    marginHorizontal: scale(4),
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: scale(8),
    minWidth: scale(44),
    minHeight: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackInput: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    padding: scale(16),
    minHeight: verticalScale(100),
    maxHeight: verticalScale(150),
    color: COLORS.textPrimary,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    marginHorizontal: scale(4),
    marginTop: 8,
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
});

export default RateYourExperienceScreen;
