import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/theme';
import Fonts from '../../theme/fonts';
import { moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const AURA_COLORS = [
  { color: ['#FF9A9E', '#FECFEF'], name: 'Rose Pink', meaning: 'Love, Compassion, and Peace' },
  { color: ['#a18cd1', '#fbc2eb'], name: 'Lavender Mist', meaning: 'Spiritual Awakening and Intuition' },
  { color: ['#84fab0', '#8fd3f4'], name: 'Mint Breeze', meaning: 'Healing, Growth, and Balance' },
  { color: ['#fccb90', '#d57eeb'], name: 'Sunset Gold', meaning: 'Creativity, Confidence, and Joy' },
  { color: ['#e0c3fc', '#8ec5fc'], name: 'Celestial Blue', meaning: 'Wisdom, Truth, and Clarity' },
];

const AuraScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Animation values
  const scanLineY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for the fingerprint
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const startScan = () => {
    setScanning(true);
    Vibration.vibrate(100);

    // Start scanning animation
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(moderateScale(150), { duration: 1000, easing: Easing.linear }),
        withTiming(0, { duration: 1000, easing: Easing.linear })
      ),
      3, // Run 3 times (approx 3 seconds)
      true,
      (finished) => {
        if (finished) {
          runOnJS(finishScan)();
        }
      }
    );

    glowOpacity.value = withTiming(1, { duration: 500 });
  };

  const finishScan = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    const randomAura = AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)];
    setResult(randomAura);
    setScanning(false);
    glowOpacity.value = withTiming(0, { duration: 500 });
  };

  const resetScan = () => {
    setResult(null);
    scanLineY.value = 0;
  };

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background */}
      <LinearGradient
        colors={result ? result.color : ['#1a2a6c', '#b21f1f', '#fdbb2d']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!result ? (
          <>
            <Text style={styles.title}>{t('aura_scanner') || 'Divine Aura Scanner'}</Text>
            <Text style={styles.instruction}>
              {scanning
                ? (t('scanning_aura') || 'Reading your energy...')
                : (t('place_thumb') || 'Place your thumb on the scanner to reveal your aura.')}
            </Text>

            <View style={styles.scannerContainer}>
              <Animated.View style={[styles.fingerprintContainer, animatedPulseStyle]}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={startScan}
                  disabled={scanning}
                >
                  <Ionicons 
                    name="finger-print" 
                    size={moderateScale(120)} 
                    color={scanning ? COLORS.white : 'rgba(255,255,255,0.5)'} 
                  />
                </TouchableOpacity>
              </Animated.View>

              {scanning && (
                <Animated.View style={[styles.scanLine, animatedScanLineStyle]} />
              )}
              
              <Animated.View style={[styles.glow, animatedGlowStyle]} />
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>{t('your_aura_is') || 'Your Aura is'}</Text>
            <Text style={styles.auraName}>{result.name}</Text>
            <View style={styles.divider} />
            <Text style={styles.auraMeaning}>{result.meaning}</Text>
            
            <TouchableOpacity style={styles.button} onPress={resetScan}>
              <Text style={styles.buttonText}>{t('scan_again') || 'Scan Again'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: moderateScale(50),
    paddingHorizontal: moderateScale(20),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(30),
  },
  title: {
    fontSize: moderateScale(28),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  instruction: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: moderateScale(50),
  },
  scannerContainer: {
    width: moderateScale(150),
    height: moderateScale(180),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fingerprintContainer: {
    zIndex: 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    width: '120%',
    height: 4,
    backgroundColor: '#00ff00',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 3,
  },
  glow: {
    position: 'absolute',
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: moderateScale(30),
    borderRadius: moderateScale(20),
    width: '100%',
  },
  resultTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.white,
    marginBottom: moderateScale(10),
  },
  auraName: {
    fontSize: moderateScale(32),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  divider: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: moderateScale(20),
  },
  auraMeaning: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: moderateScale(30),
    lineHeight: moderateScale(26),
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(25),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
});

export default AuraScannerScreen;
