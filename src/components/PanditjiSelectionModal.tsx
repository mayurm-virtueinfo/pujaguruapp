import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ModalProps,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';
import RadioButton from './RadioButton';

interface PanditjiSelectionModalProps extends Partial<ModalProps> {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selection: 'automatic' | 'manual') => void;
  initialSelection?: 'automatic' | 'manual';
}

const PanditjiSelectionModal: React.FC<PanditjiSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialSelection = 'automatic',
  ...modalProps
}) => {
  const [selectedOption, setSelectedOption] = useState<'automatic' | 'manual'>(
    initialSelection,
  );

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  const handleCancel = () => {
    setSelectedOption(initialSelection);
    onClose();
  };

  // Helper to render the right icon for the RadioButton
  const renderRadioButtonRightIcon = (selected: boolean) => {
    if (selected) {
      return (
        <Ionicons
          name="checkmark-circle-outline"
          size={24}
          color="#FA1927"
          style={{marginLeft: moderateScale(8)}}
        />
      );
    }
    return (
      <Ionicons
        name="ellipse-outline"
        size={24}
        color="#C4C4C4"
        style={{marginLeft: moderateScale(8)}}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...modalProps}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select option for Panditji</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeIconContainer}>
                <Ionicons name="close" size={20} color="#191313" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Select the method that best suits your preference for assigning a
            Panditji. You can allow the system to automatically assign the most
            suitable Panditji for your needs, or browse and choose from a list
            manually. This flexibility ensures a smooth and personalized
            experience.
          </Text>

          {/* Options Container */}
          <View style={styles.optionsContainer}>
            {/* Automatic Option */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setSelectedOption('automatic')}>
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Automatic</Text>
                  <Text style={styles.optionDescription}>
                    Let the system auto-assign the best available Panditji for
                    you.
                  </Text>
                </View>
                <View style={styles.radioButtonRightIconContainer}>
                  {renderRadioButtonRightIcon(selectedOption === 'automatic')}
                </View>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Manual Option */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setSelectedOption('manual')}>
              <View style={styles.optionContent}>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Manual</Text>
                  <Text style={styles.optionDescription}>
                    Browse the list and select a Panditji of your choice.
                  </Text>
                </View>
                <View style={styles.radioButtonRightIconContainer}>
                  {renderRadioButtonRightIcon(selectedOption === 'manual')}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContainer: {
    width: moderateScale(320),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    fontFamily: Fonts.Sen_Regular,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  closeButton: {
    padding: moderateScale(4),
  },
  closeIconContainer: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: COLORS.pujaBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#191313',
    lineHeight: moderateScale(19.6),
    marginBottom: verticalScale(24),
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(24),
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 4,
  },
  optionItem: {
    paddingVertical: verticalScale(12),
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: moderateScale(16),
  },
  radioButtonRightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
    marginBottom: verticalScale(4),
  },
  optionDescription: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    lineHeight: moderateScale(15.6),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(8),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(10),
  },
  cancelButton: {
    flex: 1,
    height: moderateScale(46),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
    letterSpacing: -0.15,
    lineHeight: moderateScale(21),
  },
  confirmButton: {
    flex: 1,
    height: moderateScale(46),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.primaryBackgroundButton,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  confirmButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: '#191313',
    textTransform: 'uppercase',
    letterSpacing: -0.15,
    lineHeight: moderateScale(21),
  },
});

export default PanditjiSelectionModal;
