import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { COLORS, THEMESHADOW } from '../theme/theme';
import Fonts from '../theme/fonts';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface RecommendedPanditCardProps {
  image: string;
  title: string;
  rating: number | string;
  onPress?: () => void;
}

const RecommendedPanditCard: React.FC<RecommendedPanditCardProps> = ({
  image,
  title,
  rating,
  onPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image
            source={image ? { uri: image } : undefined}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={[styles.ratingContainerAbsolute, THEMESHADOW.shadow]}>
            <Ionicons
              name="star"
              size={14}
              color={COLORS.primaryBackgroundButton}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t('book')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  card: {
    width: 144,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 8,
    // position: 'relative',
    // overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  image: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#f2f2f2',
  },
  ratingContainerAbsolute: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  title: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: 15,
    marginBottom: 4,
    width: '100%',
    marginTop: 12,
  },
  button: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: 10,
    width: 90,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryBackground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Medium,
    fontSize: 15,
    textTransform: 'uppercase',
  },
});

export default RecommendedPanditCard;
