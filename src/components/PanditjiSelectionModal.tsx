import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ModalProps,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import RadioButton from './RadioButton';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const [selectedOption, setSelectedOption] = useState<'automatic' | 'manual'>(
    initialSelection,
  );
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleConfirm = () => {
    if (selectedOption === 'manual' && !showDisclaimer) {
      setShowDisclaimer(true);
      return;
    }
    onConfirm(selectedOption);
    onClose();
  };

  const handleDisclaimerAcknowledge = () => {
    setShowDisclaimer(false);
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
          style={{ marginLeft: moderateScale(8) }}
        />
      );
    }
    return (
      <Ionicons
        name="ellipse-outline"
        size={24}
        color="#C4C4C4"
        style={{ marginLeft: moderateScale(8) }}
      />
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        {...modalProps}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('select_option_for_panditji')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <View style={styles.closeIconContainer}>
                  <Ionicons name="close" size={20} color="#191313" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              {t('description_for_select_pandit_type')}
            </Text>

            {/* Options Container */}
            <View style={styles.optionsContainer}>
              {/* Automatic Option */}
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setSelectedOption('automatic')}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{t('automatic')}</Text>
                    <Text style={styles.optionDescription}>
                      {t('description_for_automatic')}
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
                onPress={() => setSelectedOption('manual')}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{t('manual')}</Text>
                    <Text style={styles.optionDescription}>
                      {t('description_for_manual')}
                    </Text>
                  </View>
                  <View style={styles.radioButtonRightIconContainer}>
                    {renderRadioButtonRightIcon(selectedOption === 'manual')}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Manual Selection Disclaimer */}
            {selectedOption === 'manual' && (
              <View style={styles.manualNoteContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#FA1927"
                  style={{ marginRight: moderateScale(8) }}
                />
                <Text style={styles.manualNoteText}>
                  {t('manual_selection_disclaimer')}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={visible && showDisclaimer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisclaimer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.disclaimerContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color="#FA1927"
              style={styles.disclaimerIcon}
            />
            <Text style={styles.disclaimerTitle}>
              {t('manual_selection_notice_title')}
            </Text>
            <Text style={styles.disclaimerMessage}>
              {t('manual_selection_notice_message')}
            </Text>
            <TouchableOpacity
              style={styles.disclaimerButton}
              onPress={handleDisclaimerAcknowledge}
            >
              <Text style={styles.disclaimerButtonText}>
                {t('manual_selection_notice_acknowledge')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: verticalScale(24),
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(24),
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: verticalScale(4),
  },
  optionDescription: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
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
  },
  manualNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.pujaBackground,
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  manualNoteText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  disclaimerContainer: {
    width: moderateScale(300),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
  },
  disclaimerIcon: {
    marginBottom: verticalScale(12),
  },
  disclaimerTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  disclaimerMessage: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  disclaimerButton: {
    width: '100%',
    height: moderateScale(46),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.primaryBackgroundButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: '#191313',
    textTransform: 'uppercase',
  },
});

export default PanditjiSelectionModal;
