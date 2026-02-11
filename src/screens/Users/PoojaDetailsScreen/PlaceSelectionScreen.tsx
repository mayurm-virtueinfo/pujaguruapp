import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS, COMMON_RADIO_CONTAINER_STYLE } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Octicons from 'react-native-vector-icons/Octicons';
import { PoojaBookingPlace } from '../../../api/apiService';
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

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingPlace[]>([
    {
      id: 1,
      name: t('at_my_place'),
    },
    {
      id: 2,
      name: t('at_tirth_place'),
    },
  ]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
  } = route?.params as any;

  console.log('PlaceSelectionScreen route?.params :: ', route?.params);

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
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <View style={styles.flexGrow}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{
            paddingBottom: 60 + (inset.bottom || 20),
          }}
        >
          <View style={styles.contentWrapper}>
            {/* Title and Description Group */}
            <View style={styles.headerGroup}>
              <Text style={styles.sectionTitle}>
                {t('select_your_preference')}
              </Text>
              <Text style={styles.descriptionText}>{t('choose_puja')}</Text>
            </View>

            {/* Radio Options Group */}
            {!isLoading && (
              <View
                style={[COMMON_RADIO_CONTAINER_STYLE, styles.radioContainer]}
              >
                {poojaPlaces.map((place, index) => (
                  <React.Fragment key={place.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedPlaceId(prev =>
                          prev === place.id ? null : place.id,
                        );
                      }}
                    >
                      <Text style={styles.pricingText}>{place.name}</Text>
                      <Octicons
                        name={
                          selectedPlaceId === place.id
                            ? 'check-circle'
                            : 'circle'
                        }
                        size={24}
                        color={
                          selectedPlaceId === place.id
                            ? COLORS.primary
                            : COLORS.inputBoder
                        }
                      />
                    </TouchableOpacity>
                    {index !== poojaPlaces.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

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
  scrollContainer: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    gap: moderateScale(24),
  },
  headerGroup: {
    marginTop: moderateScale(10),
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(12),
  },
  radioContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(10),
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    paddingVertical: moderateScale(10),
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'justify',
    color: '#6c7278',
  },
  divider: {
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  flexGrow: {
    flex: 1,
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: moderateScale(24),
  },
});

export default PlaceSelectionScreen;
