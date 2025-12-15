import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, THEMESHADOW } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

const AuraScannerCard: React.FC = () => {
  const navigation: any = useNavigation();
  const { t } = useTranslation();

  const handlePress = () => {
    navigation.navigate('AuraScannerScreen');
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, THEMESHADOW.shadow]}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('divine_aura_scanner') || 'Divine Aura Scanner'}</Text>
            <Text style={styles.subtitle}>{t('check_daily_aura') || 'Discover your spiritual energy color for today.'}</Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>{t('scan_now') || 'Scan Now'}</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="finger-print" size={60} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(24),
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  textContainer: {
    flex: 1,
    paddingRight: moderateScale(16),
  },
  title: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: moderateScale(16),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.white,
    marginRight: moderateScale(4),
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: moderateScale(40),
  },
});

export default AuraScannerCard;
