import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';
import {useTranslation} from 'react-i18next';

interface AddressMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  position: {x: number; y: number};
}

const AddressMenu: React.FC<AddressMenuProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  position,
}) => {
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  const menuWidth = 76;
  const menuHeight = 72;

  const {t} = useTranslation();

  const adjustedLeft = Math.min(position.x, screenWidth - menuWidth - 40);
  const adjustedTop = Math.min(position.y, screenHeight - menuHeight - 0);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.menuOverlay} onPress={onClose}>
        <View
          style={[
            styles.menuContainer,
            {
              position: 'absolute',
              top: adjustedTop,
              left: adjustedLeft,
            },
          ]}>
          <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
            <Text style={styles.menuText}>{t('edit')}</Text>
          </TouchableOpacity>
          <View style={styles.menuSeparator} />
          <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
            <Text style={styles.menuText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default AddressMenu;

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    minWidth: 76,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: -15,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  menuText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
  },
});
