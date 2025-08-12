import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {COLORS} from '../../../theme/theme';
import PujaCard from '../../../components/PujaCard';
import PujaListItem from '../../../components/PujaListItem';
import {
  getPujaList,
  PujaListItemType,
  RecommendedPuja,
} from '../../../api/apiService';
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

type PujaItem = {
  id: any;
  title: any;
  image_url: any;
  base_price: number;
  description: any;
};

const PujaListScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PujaList'
  >;
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();
  const {showErrorToast} = useCommonToast();

  const [pujaList, setPujaList] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  console.log('pujaList', pujaList);
  const navigation = useNavigation<ScreenNavigationProp>();

  useEffect(() => {
    fetchPujaList();
  }, []);

  const fetchPujaList = async () => {
    setLoading(true);
    try {
      const data: any = await getPujaList();
      console.log(data);
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

  const handleNotificationPress = () => {
    navigation.navigate('NotificationScreen' as any);
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader
        title={t('puja')}
        showBellButton={true}
        onNotificationPress={handleNotificationPress}
      />

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.recommendedSection}>
            <View style={{paddingHorizontal: 24, paddingTop: 24, gap: 8}}>
              <Text style={styles.sectionTitle}>{t('recomended_puja')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('today_is_kartik_shukla_paksha')}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScroll}>
              {pujaList.slice(0, 3).map((puja, idx) => (
                <React.Fragment key={puja.id}>
                  <PujaCard
                    image={puja.image_url}
                    title={puja.title}
                    onPress={() => {
                      navigation.navigate('UserPoojaDetails', {
                        poojaId: puja.id,
                      });
                    }}
                  />
                  {idx !== Math.min(2, pujaList.length - 1) && (
                    <View style={styles.horizontalCardSpacer} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>

          <View style={styles.pujaListSection}>
            <Text style={styles.sectionTitle}>{t('puja_list')}</Text>
            <View style={styles.pujaListContainer}>
              {pujaList.map((puja, idx) => (
                <PujaListItem
                  key={puja.id}
                  image={puja.image_url}
                  title={puja.title}
                  description={puja.description}
                  price={`₹ ${puja.base_price}`}
                  onPress={() => {
                    navigation.navigate('UserPoojaDetails', {
                      poojaId: puja.id,
                    });
                  }}
                  showSeparator={idx !== pujaList.length - 1}
                />
              ))}
            </View>
          </View>
        </ScrollView>
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
  },
  sectionSubtitle: {
    color: COLORS.pujaTextSecondary,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
    marginBottom: 5,
    letterSpacing: 0.05,
  },
  horizontalScroll: {
    paddingHorizontal: 24,
    flex: 1,
  },
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
});

export default PujaListScreen;
