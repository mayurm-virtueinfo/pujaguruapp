import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { COLORS } from '../../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Fonts from '../../../../theme/fonts';

const { width } = Dimensions.get('window');

interface PermissionDeniedViewProps {
  onRetry: () => void;
  isPermanent?: boolean;
  isGlobalDisabled?: boolean;
}

const PermissionDeniedView: React.FC<PermissionDeniedViewProps> = ({
  onRetry,
  isPermanent = false,
  isGlobalDisabled = false,
}) => {
  const { t } = useTranslation();

  const handlePrimaryAction = async () => {
    if (isGlobalDisabled) {
      if (Platform.OS === 'android') {
        try {
          await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
          return;
        } catch {
          onRetry();
          return;
        }
      }
      // On iOS: User guide is shown. Do NOT redirect to App Settings. Retry / re-check.
      onRetry();
    } else if (isPermanent) {
      // Only redirect to App Settings when app-level permission is permanently blocked!
      Linking.openSettings();
    } else {
      onRetry();
    }
  };

  const getTitle = (): string => {
    if (isGlobalDisabled) {
      return t('location_services_disabled') || 'Location Services Disabled';
    }
    return t('location_required') || 'Location Access Required';
  };

  const getSubtitle = (): string => {
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
      t('location_permission_desc') ||
      'To provide you with accurate Panchang, Muhurat, and nearby Panditji recommendations, we need access to your location.'
    );
  };

  const getButtonTitle = (): string => {
    if (isGlobalDisabled) {
      if (Platform.OS === 'android') {
        return t('enable_gps') || 'Enable GPS';
      }
      return t('retry') || 'Retry';
    }
    if (isPermanent) {
      return t('open_settings') || 'Open Settings';
    }
    return t('allow_access') || 'Allow Access';
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[COLORS.gradientStart || '#FF9933', COLORS.gradientEnd || '#FF512F']}
        style={styles.gradientBackground}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isGlobalDisabled ? 'navigate-circle' : 'location'}
              size={64}
              color={COLORS.primary}
            />
          </View>
          
          <Text style={styles.title}>
            {getTitle()}
          </Text>
          
          <Text style={styles.subtitle}>
            {getSubtitle()}
          </Text>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePrimaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {getButtonTitle()}
              </Text>
              <Ionicons 
                name={
                  isGlobalDisabled || isPermanent
                    ? 'settings-outline'
                    : 'navigate-circle-outline'
                } 
                size={20} 
                color={COLORS.primary} 
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
            
            {!isPermanent && !isGlobalDisabled && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => Linking.openSettings()}
              >
                 <Text style={styles.secondaryButtonText}>
                  {t('open_settings') || 'Open Settings'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: Fonts.Sen_Bold,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: Fonts.Sen_Bold,
  },
});

export default PermissionDeniedView;
