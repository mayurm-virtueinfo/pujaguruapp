import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { COLORS, THEMESHADOW } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

const FESTIVALS = [
  {
    id: 1,
    name: 'Makar Sankranti',
    date: '14 Jan 2025',
    image: 'https://cdn.pixabay.com/photo/2021/01/14/15/48/kite-5916894_1280.jpg', 
  },
  {
    id: 2,
    name: 'Maha Shivaratri',
    date: '26 Feb 2025',
    image: 'https://cdn.pixabay.com/photo/2021/03/10/10/53/shiva-6084883_1280.jpg',
  },
  {
    id: 3,
    name: 'Holi',
    date: '14 Mar 2025',
    image: 'https://cdn.pixabay.com/photo/2016/03/27/19/33/holi-1283696_1280.jpg',
  },
  {
    id: 4,
    name: 'Chaitra Navratri',
    date: '30 Mar 2025',
    image: 'https://cdn.pixabay.com/photo/2023/10/16/16/48/durga-puja-8319557_1280.jpg',
  },
  {
    id: 5,
    name: 'Ram Navami',
    date: '06 Apr 2025',
    image: 'https://cdn.pixabay.com/photo/2020/04/02/08/38/lord-rama-4993464_1280.jpg',
  },
];

const UpcomingFestivalsCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('upcoming_festivals') || 'Upcoming Festivals'}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FESTIVALS.map((festival) => (
          <View key={festival.id} style={[styles.card, THEMESHADOW.shadow]}>
            <Image source={{ uri: festival.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{festival.name}</Text>
              <Text style={styles.date}>{festival.date}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(24),
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(12),
  },
  scrollContent: {
    paddingRight: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    marginRight: moderateScale(16),
    width: moderateScale(140),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: moderateScale(80),
    resizeMode: 'cover',
  },
  info: {
    padding: moderateScale(8),
  },
  name: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: moderateScale(4),
  },
  date: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
  },
});

export default UpcomingFestivalsCard;
