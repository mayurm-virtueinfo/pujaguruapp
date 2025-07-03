import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../../theme/theme';
import PujaCard from '../../../components/PujaCard';
import PujaListItem from '../../../components/PujaListItem';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  apiService,
  PujaListItemType,
  RecommendedPuja,
} from '../../../api/apiService';
import Fonts from '../../../theme/fonts';
import {useNavigation} from '@react-navigation/native';
import Calendar from '../../../components/Calendar';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {moderateScale} from 'react-native-size-matters';

const PujaListScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'UserPoojaDetails'
  >;

  const [recommendedPuja, setRecommendedPuja] = useState<RecommendedPuja[]>([]);
  const [pujaList, setPujaList] = useState<PujaListItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigation = useNavigation<ScreenNavigationProp>();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${today.toLocaleString('default', {
      month: 'long',
    })} ${today.getFullYear()}`,
  );

  useEffect(() => {
    fetchPujaData();
  }, []);

  const fetchPujaData = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getPujaListData();
      console.log('Fetched Puja List Data :: ', requests);
      setRecommendedPuja(requests.recommendedPuja || []);
      setPujaList(requests.pujaList || []);
    } catch {
      setRecommendedPuja([]);
      setPujaList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader title="Puja" showBellButton={true} />

      <View style={styles.mainContent}>
        {loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color={COLORS.primaryBackground} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.recommendedSection}>
              <View style={{paddingHorizontal: 24, paddingTop: 24, gap: 8}}>
                <Text style={styles.sectionTitle}>Recommended Puja</Text>
                <Text style={styles.sectionSubtitle}>
                  Today is Kartik Shukla Paksha, Trayodashi
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
                style={styles.horizontalScroll}>
                {recommendedPuja.map((puja, idx) => (
                  <React.Fragment key={puja.id}>
                    <PujaCard
                      image={puja.image}
                      title={puja.name}
                      onPress={() => {
                        navigation.navigate('UserPoojaDetails', {
                          data: puja,
                        });
                      }}
                    />
                    {idx !== recommendedPuja.length - 1 && (
                      <View style={styles.horizontalCardSpacer} />
                    )}
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pujaListSection}>
              <Text style={styles.sectionTitle}>Puja List</Text>
              <View style={styles.pujaListContainer}>
                {pujaList.map((puja, idx) => (
                  <PujaListItem
                    key={puja.id}
                    image={puja.image}
                    title={puja.name}
                    description={puja.pujaPurpose}
                    price={`₹ ${puja.price.toLocaleString()}`}
                    onPress={() => {
                      navigation.navigate('UserPoojaDetails', {
                        data: puja,
                      });
                    }}
                    showSeparator={idx !== pujaList.length - 1}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        )}
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
});

export default PujaListScreen;
