import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import PrimaryButton from './PrimaryButton';

interface InlineLocationRequestProps {
  onAllow: () => void;
  permissionStatus: string;
  isLocationServiceEnabled?: boolean;
  message?: string;
}

const InlineLocationRequest: React.FC<InlineLocationRequestProps> = ({
  onAllow,
  permissionStatus,
  isLocationServiceEnabled = true,
  message,
}) => {
  const { t } = useTranslation();

  const isGlobalDisabled =
    permissionStatus === 'unavailable' || !isLocationServiceEnabled;
  const isAppBlocked = permissionStatus === 'blocked';

  console.log('🔍 [InlineLocationRequest Debug] State:', {
    permissionStatus,
    isLocationServiceEnabled,
    isGlobalDisabled,
    isAppBlocked,
    platform: Platform.OS,
  });

  const handlePress = async () => {
    console.log('🔘 [InlineLocationRequest Debug] Button tapped:', {
      isGlobalDisabled,
      isAppBlocked,
      platform: Platform.OS,
      action: isGlobalDisabled
        ? Platform.OS === 'android'
          ? 'open_android_location_settings'
          : 'retry_on_ios'
        : isAppBlocked
        ? 'open_app_settings'
        : 'on_allow',
    });

    if (isGlobalDisabled) {
      if (Platform.OS === 'android') {
        try {
          await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        } catch {
          Linking.openSettings();
        }
      } else {
        // On iOS: User guide is shown. Do NOT redirect to App Settings. Retry / re-check.
        onAllow();
      }
    } else if (isAppBlocked) {
      // Only redirect to App Settings when app-level permission is blocked!
      Linking.openSettings();
    } else {
      onAllow();
    }
  };

  const getTitle = (): string => {
    if (isGlobalDisabled) {
      return t('location_services_disabled') || 'Location Services Disabled';
    }
    return t('location_required') || 'Location is required';
  };

  const getDescription = (): string => {
    if (isGlobalDisabled) {
      if (Platform.OS === 'ios') {
        return (
          t('location_services_disabled_desc_ios') ||
          'Location Services are turned off on your iPhone.\n\nTo enable:\n1. Open iPhone Settings\n2. Go to Privacy & Security\n3. Tap Location Services and turn it ON'
        );
      }
      return (
        t('gps_enable_message') ||
        'GPS is currently disabled. Please enable GPS to use location-based features.'
      );
    }
    return (
      message ||
      t('enable_location_pandit_desc') ||
      'Enable location to find Panditji near you'
    );
  };

  const getButtonTitle = (): string => {
    if (isGlobalDisabled) {
      if (Platform.OS === 'android') {
        return t('enable_gps') || 'Enable GPS';
      }
      return t('retry') || 'Retry';
    }
    if (isAppBlocked) {
      return t('open_settings') || 'Open Settings';
    }
    return t('allow_access') || 'Allow Access';
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name={isGlobalDisabled ? 'navigate-circle-outline' : 'location-outline'}
        size={40}
        color={COLORS.primary}
        style={styles.icon}
      />
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.description}>{getDescription()}</Text>
      <PrimaryButton
        title={getButtonTitle()}
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
    lineHeight: 20,
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
