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
import {getPujaList} from '../../../api/apiService';
import Fonts from '../../../theme/fonts';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
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
  id: any;
  title: any;
  image_url: any;
  base_price: number;
  description: any;
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
  const [selectedPujaId, setSelectedPujaId] = useState<any>(null);
  const navigation = useNavigation<ScreenNavigationProp>();

  console.log('navigation :: ', navigation.getState());

  useEffect(() => {
    fetchPujaList();
  }, []);

  const fetchPujaList = async () => {
    setLoading(true);
    try {
      const data: any = await getPujaList();
      if (data.success) {
        const pujaItems = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          image_url: item.image_url,
          base_price: parseFloat(item.base_price),
          description: item.description,
        }));
        setPujaList(pujaItems);
      } else {
        setPujaList([]);
      }
    } catch (error: any) {
      console.log('Error fetching puja list ::: ', error);
      showErrorToast(error.message || 'Failed to fetch puja list');
      setPujaList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectPuja = (pujaId: any) => {
    setSelectedPujaId(pujaId);
  };

  const handleNext = () => {
    if (selectedPujaId) {
      navigation.navigate('PoojaDetailScreen', {poojaId: selectedPujaId});
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
            {paddingBottom: 100 + inset.bottom}, // add space for button
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pujaListSection}>
            <Text style={styles.sectionTitle}>{t('select_puja')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('choose_the_puja_you_wish_to_book_from_the_list_below')}
            </Text>
            <View style={styles.pujaListContainer}>
              {pujaList.map((puja, idx) => (
                <React.Fragment key={puja.id}>
                  <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPuja(puja.id)}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={{uri: puja.image_url}}
                        style={styles.image}
                      />
                    </View>
                    <View style={{flex: 1, marginLeft: 14}}>
                      <View style={styles.content}>
                        <Text style={styles.title}>{puja.title}</Text>
                        <Text style={styles.description}>
                          {puja.description}
                        </Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.price}>
                          ₹{puja.base_price.toFixed(2)}
                        </Text>
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
                          selectedPujaId === puja.id ? 'check-circle' : 'circle'
                        }
                        size={24}
                        color={
                          selectedPujaId === puja.id
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
              ))}
            </View>
          </View>
        </ScrollView>
        {/* Fixed Next Button */}
        <View style={[styles.fixedButtonContainer, {paddingBottom: 16}]}>
          <PrimaryButton
            title={t('next')}
            onPress={handleNext}
            disabled={!selectedPujaId}
            // style={[styles.nextButton, {opacity: selectedPujaId ? 1 : 0.5}]}
            // textStyle={styles.nextButtonText}
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
    fontSize: 18,
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
