import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import {moderateScale} from 'react-native-size-matters';
import {getUpcomingPujas, PujaItem} from '../../../api/apiService';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import {UserProfileParamList} from '../../../navigation/User/userProfileNavigator';

const UpcomingPuja: React.FC = () => {
  const navigation = useNavigation<UserProfileParamList>();
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const inset = useSafeAreaInsets();
  const {t} = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      fetchUpcomingPujas();
    }, []),
  );

  const fetchUpcomingPujas = async () => {
    setLoading(true);
    try {
      const response: any = await getUpcomingPujas();
      console.log('response for upcoming puja :: ', response);
      setPujas(response || []);
    } catch (error) {
      console.error('Error fetching upcoming puja data:', error);
      setPujas([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />

      <UserCustomHeader title={t('upcoming_puja')} showBackButton={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pujaSection}>
          <View style={styles.pujaCardsContainer}>
            {pujas && pujas.length > 0 ? (
              pujas.map((puja, idx) => (
                <View key={puja.id}>
                  <TouchableOpacity
                    style={styles.pujaCard}
                    onPress={() =>
                      navigation.navigate('UserPujaDetailsScreen', {
                        id: puja.id,
                      })
                    }>
                    <Image
                      source={{uri: puja.pooja_image_url}}
                      style={styles.pujaImage}
                    />
                    <View style={styles.pujaTextContainer}>
                      <Text style={styles.pujaName}>{puja.pooja_name}</Text>
                      <Text style={styles.pujaDate}>{puja.when_is_pooja}</Text>
                    </View>
                  </TouchableOpacity>
                  {idx !== pujas.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            ) : (
              <Text
                style={{
                  color: '#888',
                  textAlign: 'center',
                }}>
                {t('no_upcoming_pujas')}
              </Text>
            )}
          </View>
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
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    zIndex: 10,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
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

export default UpcomingPuja;
