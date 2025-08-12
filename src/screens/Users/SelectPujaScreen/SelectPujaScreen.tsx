import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import {COLORS} from '../../../theme/theme';
import {getPanditPujaList} from '../../../api/apiService';
import Fonts from '../../../theme/fonts';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {moderateScale} from 'react-native-size-matters';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import {useCommonToast} from '../../../common/CommonToast';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';
import Octicons from 'react-native-vector-icons/Octicons';
import PrimaryButton from '../../../components/PrimaryButton';

type PujaItem = {
  pooja_id: number;
  pooja_name: string;
  pooja_image: string;
  pooja_caption: string;
  price_with_samagri: string;
  price_without_samagri: string;
  system_price: number;
};

type ScreenNavigationProp = StackNavigationProp<
  UserHomeParamList,
  'SelectPujaScreen'
>;

const SelectPujaScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();
  const {showErrorToast} = useCommonToast();

  const [pujaList, setPujaList] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute() as any;
  const {panditId, panditName, panditImage} = route?.params;

  useEffect(() => {
    fetchPujaList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPujaList = async () => {
    setLoading(true);
    try {
      const data: any = await getPanditPujaList(panditId);
      if (data.success && Array.isArray(data.data)) {
        setPujaList(data.data);
      } else {
        setPujaList([]);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Failed to fetch puja list');
      setPujaList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectPuja = (pujaId: number) => {
    setSelectedPujaId(pujaId);
  };

  const handleNext = () => {
    if (selectedPujaId) {
      navigation.navigate('PoojaDetailScreen', {
        poojaId: selectedPujaId,
        panditId: panditId,
        panditName: panditName,
        panditImage: panditImage,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            {paddingBottom: 100 + inset.bottom},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pujaListSection}>
            <Text style={styles.sectionTitle}>{t('select_puja')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('choose_the_puja_you_wish_to_book_from_the_list_below')}
            </Text>
            <View style={styles.pujaListContainer}>
              {pujaList.length === 0 ? (
                <View style={{padding: 24, alignItems: 'center'}}>
                  <Text
                    style={{
                      color: COLORS.pujaTextSecondary,
                      fontFamily: Fonts.Sen_Regular,
                    }}>
                    {t('no_puja_found') || 'No puja found.'}
                  </Text>
                </View>
              ) : (
                pujaList.map((puja, idx) => (
                  <React.Fragment key={puja.pooja_id}>
                    <TouchableOpacity
                      style={styles.item}
                      activeOpacity={0.7}
                      onPress={() => handleSelectPuja(puja.pooja_id)}>
                      <View style={styles.imageContainer}>
                        <Image
                          source={{uri: puja.pooja_image}}
                          style={styles.image}
                        />
                      </View>
                      <View style={{flex: 1, marginLeft: 14}}>
                        <View style={styles.content}>
                          <Text style={styles.title}>{puja.pooja_name}</Text>
                          <Text style={styles.description}>
                            {puja.pooja_caption}
                          </Text>
                        </View>
                        <View style={styles.row}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}>
                            <Text style={styles.price}>
                              ₹{parseFloat(puja.price_with_samagri).toFixed(2)}
                            </Text>
                            <Text style={styles.priceLabel}>
                              {' '}
                              {t('with_samagri')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 8,
                        }}>
                        <Octicons
                          name={
                            selectedPujaId === puja.pooja_id
                              ? 'check-circle'
                              : 'circle'
                          }
                          size={24}
                          color={
                            selectedPujaId === puja.pooja_id
                              ? COLORS.primary
                              : COLORS.inputBoder
                          }
                        />
                      </View>
                    </TouchableOpacity>
                    {idx < pujaList.length - 1 && (
                      <View style={{marginHorizontal: 12}}>
                        <View style={styles.separator} />
                      </View>
                    )}
                  </React.Fragment>
                ))
              )}
            </View>
          </View>
        </ScrollView>
        {/* Fixed Next Button */}
        <View style={[styles.fixedButtonContainer, {paddingBottom: 16}]}>
          <PrimaryButton
            title={t('next')}
            onPress={handleNext}
            disabled={!selectedPujaId}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
    paddingVertical: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 32,
  },
  recommendedSection: {},
  sectionTitle: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: 18,
    letterSpacing: 0.1,
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: COLORS.pujaTextSecondary,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
    marginBottom: 5,
    letterSpacing: 0.05,
  },
  horizontalScroll: {},
  horizontalScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalCardSpacer: {
    width: 16,
  },
  pujaListSection: {
    paddingHorizontal: 24,
  },
  pujaListContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  detailContainer: {
    width: '100%',
  },
  item: {
    width: '100%',
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
  },
  image: {
    width: 80,
    height: 86,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  row: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 8,
  },
  title: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: 15,
    letterSpacing: -0.333,
  },
  description: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 13,
    fontWeight: '400',
    paddingTop: 6,
  },
  price: {
    color: COLORS.pujaCardPrice,
    fontFamily: Fonts.Sen_Bold,
    fontSize: 16,
  },
  priceWithout: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Bold,
    fontSize: 15,
    marginLeft: 8,
  },
  priceLabel: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 12,
    marginLeft: 2,
  },
  button: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.15,
    textTransform: 'uppercase',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.separatorColor,
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 4,
    zIndex: 10,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: 17,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

export default SelectPujaScreen;
