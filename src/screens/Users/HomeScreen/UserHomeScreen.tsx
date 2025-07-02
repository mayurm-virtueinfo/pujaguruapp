import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {moderateScale} from 'react-native-size-matters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {apiService, PanditItem, PujaItem} from '../../../api/apiService';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/native';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';

const UserHomeScreen: React.FC = () => {
  const navigation = useNavigation<UserPoojaListParamList>();
  const [pandits, setPandits] = useState<PanditItem[]>([]);
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const inset = useSafeAreaInsets();

  useEffect(() => {
    fetchAllPanditAndPuja();
  }, []);

  const fetchAllPanditAndPuja = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getPanditAndPujaData();
      setPandits(requests?.pandits || []);
      setPujas(requests?.puja || []);
    } catch (error) {
      setPandits([]);
      setPujas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPandit = (panditName: string) => {
    // Handle booking logic
    navigation.navigate('PujaCancellationScreen');
  };

  const handleNavigation = (route: string) => {
    // Handle navigation logic
  };

  return (
    <View style={[styles.container, {paddingTop: inset.top}]}>
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />

      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={{width: 24, height: 24}} />
          <Text style={styles.headerTitle}>Home</Text>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.white}
          />
        </View>
      </View>

      <ScrollView style={[styles.content]} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recomended Panditji</Text>
            <TouchableOpacity
              style={styles.seeAllContainer}
              onPress={() => handleNavigation('PanditList')}>
              <Text style={styles.seeAllText}>See all </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={COLORS.primaryBackground}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Today is Kartik Shukla Paksha, Trayodashi
          </Text>

          {loading ? (
            <View style={{alignItems: 'center', marginVertical: 20}}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.panditCardsContainer}>
              {pandits && pandits.length > 0 ? (
                pandits.map(pandit => (
                  <View style={styles.panditCard} key={pandit.id}>
                    <View style={styles.panditImageWrapper}>
                      <Image
                        source={{uri: pandit.image}}
                        style={styles.panditImage}
                      />
                      <View style={styles.ratingContainerAbsolute}>
                        <Ionicons
                          name="star"
                          size={16}
                          color={COLORS.primaryBackgroundButton}
                          style={{marginRight: 5}}
                        />
                        <Text style={styles.ratingText}>{pandit.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.panditName}>{pandit.name}</Text>
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => handleBookPandit(pandit.name)}>
                      <Text style={styles.bookButtonText}>BOOK</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={{color: '#888', marginTop: 10}}>
                  No Panditji found.
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.pujaSection}>
          <Text style={styles.sectionTitle}>Upcoming Puja's</Text>

          <View style={styles.pujaCardsContainer}>
            {loading ? (
              <View style={{alignItems: 'center', marginVertical: 20}}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : pujas && pujas.length > 0 ? (
              pujas.map((puja, idx) => (
                <View key={puja.id}>
                  <View style={styles.pujaCard}>
                    <Image
                      source={{uri: puja.image}}
                      style={styles.pujaImage}
                    />
                    <View style={styles.pujaTextContainer}>
                      <Text style={styles.pujaName}>{puja.name}</Text>
                      <Text style={styles.pujaDate}>{puja.time}</Text>
                    </View>
                  </View>
                  {idx !== pujas.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text style={{color: '#888', marginTop: 10}}>
                No upcoming pujas.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primaryBackground,
    paddingHorizontal: moderateScale(22),
    paddingBottom: moderateScale(70),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    marginTop: moderateScale(-48),
    zIndex: 10,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
  },
  section: {
    marginBottom: moderateScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    fontWeight: '600',
  },
  seeAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryBackground,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#6C7278',
    fontWeight: '500',
    marginBottom: moderateScale(12),
  },
  panditCardsContainer: {
    flexDirection: 'row',
    gap: moderateScale(24),
  },
  panditCard: {
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(19),
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  panditImageWrapper: {
    width: moderateScale(86),
    height: moderateScale(96),
    marginBottom: moderateScale(10),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panditImage: {
    width: moderateScale(86),
    height: moderateScale(96),
    borderRadius: moderateScale(50),
  },
  ratingContainerAbsolute: {
    position: 'absolute',
    bottom: moderateScale(4),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(11),
    paddingVertical: moderateScale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  panditName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  ratingText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  bookButton: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(8),
    minHeight: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  bookButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
    letterSpacing: -0.15,
  },
  pujaSection: {
    marginBottom: moderateScale(24),
  },
  pujaCardsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(12),
    // Improved shadow for both iOS and Android
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
        shadowColor: '#000',
      },
    }),
  },
  pujaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  pujaImage: {
    width: moderateScale(52),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  pujaTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pujaName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.33,
    marginBottom: moderateScale(4),
  },
  pujaDate: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginVertical: moderateScale(8),
  },
});

export default UserHomeScreen;
