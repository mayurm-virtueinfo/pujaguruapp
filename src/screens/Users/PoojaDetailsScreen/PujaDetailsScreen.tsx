import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Octicons from 'react-native-vector-icons/Octicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import CustomeLoader from '../../../components/CustomeLoader';
import {useCommonToast} from '../../../common/CommonToast';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {getPoojaDetails} from '../../../api/apiService';

interface PujaDetails {
  id: number;
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  base_price: string;
  price_with_samagri: string;
  price_without_samagri: string;
  benifits: string[];
  features: string[];
  requirements: string[];
  retual_steps: string[];
  suggested_day: string;
  suggested_tithi: string;
  duration_minutes: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  uuid: string;
  pooja_category: number;
  pooja_type: number;
  slug: string;
}

interface PricingOption {
  id: number;
  priceDes: string;
  price: string;
  withPujaItem: boolean;
}

const PujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'UserPoojaDetails'
  >;

  const {t} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute();
  const {showErrorToast} = useCommonToast();

  const [data, setData] = useState<PujaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(
    null,
  );
  const [selectPrice, setSelectPrice] = useState<string>('');

  const {poojaId} = route.params as {poojaId: string};

  useEffect(() => {
    if (poojaId) {
      fetchPoojaDetails(poojaId);
    }
  }, [poojaId]);

  const fetchPoojaDetails = async (id: string) => {
    setLoading(true);
    try {
      const response: any = await getPoojaDetails(id);
      if (response.success) {
        setData(response.data);
      } else {
        setData(null);
      }
    } catch (error: any) {
      showErrorToast(
        error.response?.data?.message || 'Failed to fetch puja details',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPricingOption = (): PricingOption | undefined => {
    if (!data || selectedPricingId == null) return undefined;
    return getPricingOptions(data).find(
      option => option.id === selectedPricingId,
    );
  };

  const handleBookNowPress = () => {
    const selectedOption = getSelectedPricingOption();
    if (!selectedOption) {
      showErrorToast('Please select a pricing option');
      return;
    }
    navigation.navigate('PlaceSelectionScreen', {
      poojaId: poojaId,
      samagri_required: selectedOption.withPujaItem,
      puja_image: data?.image_url ?? '',
      puja_name: data?.title ?? '',
      price: selectPrice,
    });
  };

  const handleNotificationPress = () => {
    console.log('Notification Pressed');
  };

  const handleCheckboxToggle = (id: number, price: string) => {
    setSelectedPricingId(id === selectedPricingId ? null : id);
    setSelectPrice(price);
  };

  const getPricingOptions = (data: PujaDetails): PricingOption[] => {
    return [
      {
        id: 1,
        priceDes: 'With Puja Items',
        price: data.price_with_samagri,
        withPujaItem: true,
      },
      {
        id: 2,
        priceDes: 'Without Puja Items',
        price: data.price_without_samagri,
        withPujaItem: false,
      },
    ];
  };

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title={t('puja_details')}
        showBackButton={true}
        showBellButton={true}
        onNotificationPress={handleNotificationPress}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: data?.image_url,
              }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.descriptionText}>
              {data?.description || 'No description available'}
            </Text>
            <Text style={styles.sectionTitle}>{t('pricing_options')}</Text>
            <View style={styles.pricingContainer}>
              {data ? (
                getPricingOptions(data).map((option, idx) => (
                  <React.Fragment key={option.id}>
                    <TouchableOpacity
                      style={styles.pricingOption}
                      activeOpacity={0.7}
                      onPress={() =>
                        handleCheckboxToggle(option.id, option.price)
                      }>
                      <Text style={styles.pricingText}>
                        {option.priceDes} - Rs. {option.price}
                      </Text>
                      <Octicons
                        name={
                          selectedPricingId === option.id
                            ? 'check-circle'
                            : 'circle'
                        }
                        size={24}
                        color={
                          selectedPricingId === option.id
                            ? COLORS.primary
                            : COLORS.inputBoder
                        }
                      />
                    </TouchableOpacity>
                    {idx < getPricingOptions(data).length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Text style={styles.pricingText}>No pricing available</Text>
              )}
            </View>
            <Text style={styles.sectionTitle}>{t('visual_section')}</Text>
            <Text style={styles.visualText}>
              {data?.benifits?.join(', ') || 'No benefits available'}
            </Text>
            <PrimaryButton
              title={t('next')}
              onPress={handleBookNowPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
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
  imageContainer: {
    width: '100%',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  pricingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 1,
    marginVertical: 10,
  },
  visualText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    textAlign: 'justify',
  },
  buttonContainer: {
    height: 46,
    marginTop: 30,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
});

export default PujaDetailsScreen;
