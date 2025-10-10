import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {useGPS} from '../provider/GPSProvider';
import {COLORS} from '../theme/theme';

const GPSModal: React.FC = () => {
  const {isGPSEnabled, isLoading, promptForGPS} = useGPS();

  if (Platform.OS === 'android' || isGPSEnabled) return null;

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openSettings();
      } else {
        promptForGPS();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={!isGPSEnabled}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.message}>
            GPS is required. Please enable Location in Settings.
          </Text>
          <View style={styles.pathBox}>
            <Text style={styles.pathLabel}>Path:</Text>
            <Text style={styles.pathText}>
              Settings {'>'} Privacy & Security {'>'} Location Services
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleOpenSettings}>
            <Text style={styles.buttonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pathBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  pathLabel: {
    fontWeight: 'bold',
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 6,
  },
  pathText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '80%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  message: {fontSize: 16, textAlign: 'center', marginBottom: 20},
  button: {
    backgroundColor: COLORS.primaryBackground,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {color: COLORS.white, fontSize: 16},
});

export default GPSModal;
