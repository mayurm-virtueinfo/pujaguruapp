import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import PrimaryButton from './PrimaryButton';

interface InlineLocationRequestProps {
  onAllow: () => void;
  permissionStatus: string;
  message?: string;
}

const InlineLocationRequest: React.FC<InlineLocationRequestProps> = ({
  onAllow,
  permissionStatus,
  message,
}) => {
  const { t } = useTranslation();

  const handlePress = () => {
    if (permissionStatus === 'blocked') {
      Linking.openSettings();
    } else {
      onAllow();
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="location-outline"
        size={40}
        color={COLORS.primary}
        style={styles.icon}
      />
      <Text style={styles.title}>{t('location_required')}</Text>
      <Text style={styles.description}>
        {message ||
          t('enable_location_pandit_desc') ||
          'Enable location to find Panditji near you'}
      </Text>
      <PrimaryButton
        title={
          permissionStatus === 'blocked' ? t('open_settings') : t('allow_access')
        }
        onPress={handlePress}
        style={styles.button}
        textStyle={styles.buttonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    width: 160,
    height: 40,
  },
  buttonText: {
    fontSize: 14,
  },
});

export default InlineLocationRequest;
