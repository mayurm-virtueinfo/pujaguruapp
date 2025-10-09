import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../../../components/CustomHeader';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Octicons from 'react-native-vector-icons/Octicons';
import {apiService, PoojaBookingPlace} from '../../../api/apiService';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';
import {useCommonToast} from '../../../common/CommonToast';

const PlaceSelectionScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PlaceSelectionScreen'
  >;
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute();
  const {showErrorToast} = useCommonToast();

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
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>
              {t('select_your_preference')}
            </Text>
            <Text style={styles.descriptionText}>{t('choose_puja')}</Text>
            {!isLoading && (
              <View style={[styles.pricingContainer, THEMESHADOW.shadow]}>
                {poojaPlaces.map((place, index) => (
                  <React.Fragment key={place.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedPlaceId(prev =>
                          prev === place.id ? null : place.id,
                        );
                      }}>
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

            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={!selectedPlaceId}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginTop: 20,
  },
  pricingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 1,
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    marginTop: 10,
    textAlign: 'justify',
    color: '#6c7278',
  },
});

export default PlaceSelectionScreen;
