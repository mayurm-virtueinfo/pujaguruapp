import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { COLORS, COMMON_CARD_STYLE, THEMESHADOW } from '../theme/theme';
import Fonts from '../theme/fonts';
import { useTranslation } from 'react-i18next';

interface PujaListItemProps {
  image: string;
  title: string;
  description: string;
  price: string;
  onPress?: () => void;
  showSeparator?: boolean;
}

const PujaListItem: React.FC<PujaListItemProps> = ({
  image,
  title,
  description,
  price,
  onPress,
  showSeparator = true,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={onPress}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text
              style={styles.description}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {description}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.price}>{price}</Text>
            <TouchableOpacity style={styles.button} onPress={onPress}>
              <Text style={styles.buttonText}>{t('book')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      <View>{showSeparator && <View style={styles.separator} />}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.pujaBackground,
  },
  item: {
    ...(COMMON_CARD_STYLE as ViewStyle),
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
    width: 90,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...THEMESHADOW.shadow,
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Medium,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
  },
});

export default PujaListItem;
