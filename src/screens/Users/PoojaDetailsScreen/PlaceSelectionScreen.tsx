import React, { useState } from 'react';
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
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import { moderateScale } from 'react-native-size-matters';

const PlaceSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PlaceSelectionScreen'
  >;
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute();
  const { showErrorToast } = useCommonToast();

  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isLoading] = useState<boolean>(false);

  const {
    poojaId,
    samagri_required,
    puja_image,
    puja_name,
    price,
    panditId,
    panditName,
    panditImage,
    description,
    panditCity,
  } = (route?.params as any) || {};

  const handleNextPress = () => {
    if (selectedPlaceId === 2 && panditId) {
      showErrorToast(
        'You cannot select Tirth Place when you have already selected a Pandit Ji. Please go back and select the Puja first.',
      );
      return;
    }
    if (selectedPlaceId === 1) {
      navigation.navigate('AddressSelectionScreen', {
        poojaId: poojaId,
        samagri_required: samagri_required,
        puja_name: puja_name,
        puja_image: puja_image,
        price: price,
        panditId: panditId,
        panditName: panditName,
        panditImage: panditImage,
        description: description,
        panditCity: panditCity,
      });
    } else if (selectedPlaceId === 2) {
      navigation.navigate('TirthPlaceSelectionScreen', {
        poojaId: poojaId,
        samagri_required: samagri_required,
        puja_name: puja_name,
        puja_image: puja_image,
        price: price,
        panditId: panditId,
        panditName: panditName,
        panditImage: panditImage,
        description: description,
        panditCity: panditCity,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <View style={styles.flexGrow}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. Puja Summary Card */}
          {puja_name ? (
            <View style={styles.summaryCard}>
              {puja_image ? (
                <Image
                  source={{ uri: puja_image }}
                  style={styles.summaryImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.summaryImagePlaceholder}>
                  <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {puja_name}
                </Text>
                <View style={styles.summaryTagRow}>
                  <View style={styles.samagriTag}>
                    <Text style={styles.samagriTagText}>
                      {samagri_required ? 'With Samagri' : 'Without Samagri'}
                    </Text>
                  </View>
                  {panditName ? (
                    <View style={styles.panditTag}>
                      <Ionicons name="person" size={11} color="#15803D" />
                      <Text style={styles.panditTagText} numberOfLines={1}>
                        {panditName}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {price ? (
                <View style={styles.summaryPriceCol}>
                  <Text style={styles.summaryPriceLabel}>Total</Text>
                  <Text style={styles.summaryPrice}>₹{price}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* 2. Title and Description Header */}
          <View style={styles.headerGroup}>
            <Text style={styles.sectionTitle}>
              {t('select_your_preference')}
            </Text>
            <Text style={styles.descriptionText}>{t('choose_puja')}</Text>
          </View>

          {/* 3. Preference Selection Cards */}
          <View style={styles.preferenceCardsContainer}>
            {/* Option 1: At My Place */}
            <TouchableOpacity
              style={[
                styles.preferenceCard,
                selectedPlaceId === 1 && styles.preferenceCardSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedPlaceId(1)}
              testID="option-at-my-place"
            >
              <View
                style={[
                  styles.iconContainer,
                  selectedPlaceId === 1
                    ? styles.iconContainerHomeActive
                    : styles.iconContainerHomeInactive,
                ]}
              >
                <Ionicons
                  name="home"
                  size={22}
                  color={selectedPlaceId === 1 ? COLORS.primary : '#4B5563'}
                />
              </View>

              <View style={styles.preferenceTextCol}>
                <View style={styles.preferenceTitleRow}>
                  <Text
                    style={[
                      styles.preferenceTitle,
                      selectedPlaceId === 1 && styles.preferenceTitleSelected,
                    ]}
                  >
                    {t('at_my_place')}
                  </Text>
                  <View style={styles.pillBadgeHome}>
                    <Text style={styles.pillBadgeHomeText}>Doorstep Vidhi</Text>
                  </View>
                </View>
                <Text style={styles.preferenceSubtext}>
                  Panditji visits your home, office, or private venue with
                  sacred vidhi
                </Text>
              </View>

              <Ionicons
                name={
                  selectedPlaceId === 1 ? 'checkmark-circle' : 'ellipse-outline'
                }
                size={24}
                color={selectedPlaceId === 1 ? COLORS.primary : '#D1D5DB'}
              />
            </TouchableOpacity>

            {/* Option 2: At Tirth Place */}
            <TouchableOpacity
              style={[
                styles.preferenceCard,
                selectedPlaceId === 2 && styles.preferenceCardSelected,
                panditId && styles.preferenceCardDisabled,
              ]}
              activeOpacity={panditId ? 1 : 0.85}
              onPress={() => {
                if (panditId) {
                  showErrorToast(
                    'You cannot select Tirth Place when you have already selected a Pandit Ji. Please go back and select the Puja first.',
                  );
                  return;
                }
                setSelectedPlaceId(2);
              }}
              testID="option-at-tirth-place"
            >
              <View
                style={[
                  styles.iconContainer,
                  selectedPlaceId === 2
                    ? styles.iconContainerTirthActive
                    : styles.iconContainerTirthInactive,
                ]}
              >
                <Ionicons
                  name="water"
                  size={22}
                  color={selectedPlaceId === 2 ? '#EA580C' : '#4B5563'}
                />
              </View>

              <View style={styles.preferenceTextCol}>
                <View style={styles.preferenceTitleRow}>
                  <Text
                    style={[
                      styles.preferenceTitle,
                      selectedPlaceId === 2 && styles.preferenceTitleSelected,
                    ]}
                  >
                    {t('at_tirth_place')}
                  </Text>
                  <View style={styles.pillBadgeTirth}>
                    <Text style={styles.pillBadgeTirthText}>
                      Holy Pilgrimage
                    </Text>
                  </View>
                </View>
                <Text style={styles.preferenceSubtext}>
                  Perform auspicious ritual at sacred pilgrimage temples, ghats
                  & kshetras
                </Text>
                {panditId ? (
                  <Text style={styles.disabledWarningText}>
                    Not available when Panditji is pre-selected
                  </Text>
                ) : null}
              </View>

              <Ionicons
                name={
                  selectedPlaceId === 2 ? 'checkmark-circle' : 'ellipse-outline'
                }
                size={24}
                color={selectedPlaceId === 2 ? COLORS.primary : '#D1D5DB'}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 4. Bottom Action Button */}
        <View
          style={[
            styles.bottomButtonContainer,
            {
              paddingBottom: moderateScale(16),
            },
          ]}
        >
          <PrimaryButton
            title={t('next')}
            onPress={handleNextPress}
            disabled={!selectedPlaceId}
          />
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
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(95),
  },

  /* Puja Summary Card */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(12),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  summaryImagePlaceholder: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
    marginRight: moderateScale(8),
  },
  summaryTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(4),
  },
  summaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(6),
  },
  samagriTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: 6,
  },
  samagriTagText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#4B5563',
  },
  panditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(2),
    borderRadius: 6,
  },
  panditTagText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#15803D',
  },
  summaryPriceCol: {
    alignItems: 'flex-end',
  },
  summaryPriceLabel: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.Sen_Regular,
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  summaryPrice: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },

  /* Header Section */
  headerGroup: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.3,
    marginBottom: moderateScale(6),
  },
  descriptionText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#6C7278',
    lineHeight: moderateScale(20),
  },

  /* Preference Cards */
  preferenceCardsContainer: {
    gap: moderateScale(14),
  },
  preferenceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: moderateScale(16),
    borderWidth: 1.5,
    borderColor: '#EAECEF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  preferenceCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F9',
  },
  preferenceCardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(14),
  },
  iconContainerHomeActive: {
    backgroundColor: '#FEE2E2',
  },
  iconContainerHomeInactive: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerTirthActive: {
    backgroundColor: '#FFEDD5',
  },
  iconContainerTirthInactive: {
    backgroundColor: '#F3F4F6',
  },
  preferenceTextCol: {
    flex: 1,
    paddingRight: moderateScale(10),
  },
  preferenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(3),
  },
  preferenceTitle: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  preferenceTitleSelected: {
    color: COLORS.primary,
  },
  pillBadgeHome: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: 10,
  },
  pillBadgeHomeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  pillBadgeTirth: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: 10,
  },
  pillBadgeTirthText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#C2410C',
  },
  preferenceSubtext: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    lineHeight: moderateScale(17),
  },
  disabledWarningText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
    marginTop: moderateScale(4),
  },

  /* Bottom Button */
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(6),
  },
});

export default PlaceSelectionScreen;
