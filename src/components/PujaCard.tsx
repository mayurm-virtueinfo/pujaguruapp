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

interface PujaCardProps {
  image: string;
  title: string;
  onPress?: () => void;
}

const PujaCard: React.FC<PujaCardProps> = ({ image, title, onPress }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.card}>
        <Image
          source={image ? { uri: image } : undefined}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title} numberOfLines={2}>
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    borderRadius: 14,
    backgroundColor: COLORS.black,
  },
  card: {
    width: 144,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  image: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 16,
    backgroundColor: '#f2f2f2',
  },
  title: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: 15,
    minHeight: 36,
    maxHeight: 38,
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.primaryBackgroundButton,
    width: 90,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    ...THEMESHADOW.shadow,
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Medium,
    fontSize: 15,
    textTransform: 'uppercase',
  },
});

export default PujaCard;
