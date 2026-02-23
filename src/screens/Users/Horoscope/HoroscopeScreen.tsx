import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React from 'react';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import { Images } from '../../../theme/Images';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CONTAINER_PADDING = moderateScale(20);
const ITEM_SPACING = moderateScale(10);
const ITEM_WIDTH =
  (width - CONTAINER_PADDING * 2 - ITEM_SPACING * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;

const HoroscopeScreen = () => {
  const inset = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState(false);

  const ZODIAC_SIGNS = [
    { key: 'aries', name: t('aries'), image: Images.ic_aries },
    { key: 'taurus', name: t('taurus'), image: Images.ic_taurus },
    { key: 'gemini', name: t('gemini'), image: Images.ic_gemini },
    { key: 'cancer', name: t('cancer'), image: Images.ic_cancer },
    { key: 'leo', name: t('leo'), image: Images.ic_leo },
    { key: 'virgo', name: t('virgo'), image: Images.ic_virgo },
    { key: 'libra', name: t('libra'), image: Images.ic_libra },
    { key: 'scorpio', name: t('scorpio'), image: Images.ic_scorpio },
    {
      key: 'sagittarius',
      name: t('sagittarius'),
      image: Images.ic_sagittarius,
    },
    { key: 'capricorn', name: t('capricorn'), image: Images.ic_capricorn },
    { key: 'aquarius', name: t('aquarius'), image: Images.ic_aquarius },
    { key: 'pisces', name: t('pisces'), image: Images.ic_pisces },
  ];

  const handleSelectZodiac = (sign: any) => {
    navigation.navigate('HoroscopeDetailsScreen', {
      signKey: sign.key,
      signName: sign.name,
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemContainer, THEMESHADOW.shadow]}
      onPress={() => handleSelectZodiac(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={styles.zodiacImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.zodiacName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <CustomeLoader loading={loading} />
      <UserCustomHeader
        title={t('daily_horoscope')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.flexGrow}>
        <FlatList
          data={ZODIAC_SIGNS}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: ITEM_SPACING }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default HoroscopeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
    paddingVertical: moderateScale(24),
  },
  listContent: {
    paddingHorizontal: CONTAINER_PADDING,
    gap: moderateScale(20),
  },
  itemContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
  },
  imageContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  zodiacImage: {
    width: '100%',
    height: '100%',
  },
  zodiacName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
