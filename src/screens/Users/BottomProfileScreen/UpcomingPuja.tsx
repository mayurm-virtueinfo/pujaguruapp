import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import { getUpcomingPujas, PujaItem } from '../../../api/apiService';
import {
  COLORS,
  COMMON_LIST_STYLE,
  COMMON_CARD_STYLE,
} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { translateData } from '../../../utils/TranslateData';

const UpcomingPuja: React.FC = () => {
  const navigation = useNavigation<UserProfileParamList>();
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const inset = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchUpcomingPujas = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setPujas(cachedData);
        setLoading(false);
        return;
      }

      const response: any = await getUpcomingPujas();
      const translated: any = await translateData(response, currentLanguage, [
        'pooja_name',
        'when_is_pooja',
      ]);
      translationCacheRef.current.set(currentLanguage, translated);
      setPujas(translated || []);
    } catch (error) {
      console.error('Error fetching upcoming puja data:', error);
      setPujas([]);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchUpcomingPujas();
  }, [fetchUpcomingPujas]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: inset.top }]}>
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
                    }
                  >
                    <Image
                      source={{ uri: puja.pooja_image_url }}
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
                  padding: moderateScale(14),
                }}
              >
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
    // marginBottom: moderateScale(24),
  },
  pujaCardsContainer: {
    backgroundColor: COLORS.white,
    ...(COMMON_LIST_STYLE as ViewStyle),
  },
  pujaCard: {
    ...(COMMON_CARD_STYLE as ViewStyle),
  },
  pujaImage: {
    width: moderateScale(52),
    height: moderateScale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(12),
  },
  pujaTextContainer: {
    flex: 1,
  },
  pujaName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(4),
  },
  pujaDate: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});

export default UpcomingPuja;
