import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking,
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
}

const PermissionDeniedView: React.FC<PermissionDeniedViewProps> = ({
  onRetry,
  isPermanent = false,
}) => {
  const { t } = useTranslation();

  const handlePrimaryAction = () => {
    if (isPermanent) {
      Linking.openSettings();
    } else {
      onRetry();
    }
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
            <Ionicons name="location" size={64} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>
            {t('location_required') || 'Location Access Required'}
          </Text>
          
          <Text style={styles.subtitle}>
            {t('location_permission_desc') || 
             'To provide you with accurate Panchang, Muhurat, and nearby Panditji recommendations, we need access to your location.'}
          </Text>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePrimaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isPermanent ? (t('open_settings') || 'Open Settings') : (t('allow_access') || 'Allow Access')}
              </Text>
              <Ionicons 
                name={isPermanent ? "settings-outline" : "navigate-circle-outline"} 
                size={20} 
                color={COLORS.primary} 
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
            
            {!isPermanent && (
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
