import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ModalProps,
  Animated,
} from 'react-native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';

interface PujaItemsModalProps extends Partial<ModalProps> {
  visible: boolean;
  onClose: () => void;
  userItems: {name: string; quantity: string | number}[];
  panditjiItems: {name: string; quantity: string | number}[];
}

const PujaItemsModal: React.FC<PujaItemsModalProps> = ({
  visible,
  onClose,
  userItems,
  panditjiItems,
  ...modalProps
}) => {
  const {t} = useTranslation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Animation for modal fade-in
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Animation for close button press
  const handleClosePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleClosePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
    onClose();
  };

  const CloseIcon = () => (
    <Animated.View
      style={[styles.closeIconContainer, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        onPressIn={handleClosePressIn}
        onPressOut={handleClosePressOut}
        accessibilityLabel={t('close_modal')}
        accessibilityRole="button">
        <MaterialIcons name="close" size={24} color={COLORS.primaryTextDark} />
      </TouchableOpacity>
    </Animated.View>
  );

  const ItemsList = ({
    items,
    index,
  }: {
    items: {name: string; quantity: string | number}[];
  }) => (
    <View style={styles.itemsList}>
      {items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          {/* <MaterialIcons
            name="fiber-manual-record"
            size={moderateScale(8)}
            color={COLORS.textPrimary}
            style={styles.itemBullet}
          /> */}
          <Text style={styles.itemNumber}>{index + 1}.</Text>
          <Text style={styles.itemText}>
            {item.name}
            <Text style={styles.quantityBadge}> ({item.quantity})</Text>
          </Text>
        </View>
      ))}
    </View>
  );

  console.log('panditjiItems :: ', panditjiItems);
  console.log('userItems :: ', userItems);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      {...modalProps}>
      <Animated.View style={[styles.modalOverlay, {opacity: fadeAnim}]}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('list_of_puja_items')}</Text>
            <CloseIcon />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}>
            {/* Items to be Arranged by You */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('items_to_be_arranged_by_you')}
              </Text>
              <Text style={styles.sectionDescription}>
                {t('arrenged_item_by_you')}
              </Text>
              <View style={styles.itemsContainer}>
                {userItems.length > 0 ? (
                  <ItemsList items={userItems} />
                ) : (
                  <Text style={styles.noItemsText}>{t('no_items_found')}</Text>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Items will be brought by the Panditji */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('items_will_be_brought_by_the_panditji')}
              </Text>
              <Text style={styles.sectionDescription}>
                {t('arrenged_item_by_panditji')}
              </Text>
              <View style={styles.itemsContainer}>
                {panditjiItems.length > 0 ? (
                  <ItemsList items={panditjiItems} />
                ) : (
                  <Text style={styles.noItemsText}>{t('no_items_found')}</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '95%',
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingTop: verticalScale(16),
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.separatorColor,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    letterSpacing: moderateScale(0.5),
  },
  closeIconContainer: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  contentContainer: {
    paddingBottom: verticalScale(20),
  },
  section: {
    marginBottom: verticalScale(18),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(8),
  },
  sectionDescription: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#666666',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(22),
  },
  itemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  itemsList: {
    gap: verticalScale(8),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(4),
  },
  itemBullet: {
    marginRight: moderateScale(8),
  },
  itemNumber: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginRight: moderateScale(8),
  },
  itemText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    lineHeight: moderateScale(24),
  },
  quantityBadge: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },
  noItemsText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: verticalScale(10),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(16),
  },
});

export default PujaItemsModal;
