import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ModalProps,
  Platform,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

type PujaItem =
  | string
  | {
      name: string;
      quantity?: string | number;
      units?: string;
    };

interface NormalizedItem {
  name: string;
  quantity?: string | number;
  units?: string;
}

interface PujaItemsModalProps extends Partial<ModalProps> {
  visible: boolean;
  onClose: () => void;
  userItems: PujaItem[];
  panditjiItems: PujaItem[];
}

const normalizeItems = (items: PujaItem[]): NormalizedItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') {
      return { name: item };
    }
    return item;
  });
};

const PujaItemsModal: React.FC<PujaItemsModalProps> = ({
  visible,
  onClose,
  userItems,
  panditjiItems,
  ...modalProps
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'user' | 'pandit'>('user');
  const [checkedUserItems, setCheckedUserItems] = useState<
    Record<number, boolean>
  >({});

  const normalizedUserItems = normalizeItems(userItems);
  const normalizedPanditjiItems = normalizeItems(panditjiItems);

  const toggleUserItem = (index: number) => {
    setCheckedUserItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const checkedCount = Object.values(checkedUserItems).filter(Boolean).length;
  const currentItems =
    activeTab === 'user' ? normalizedUserItems : normalizedPanditjiItems;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      {...modalProps}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContainer,
            { paddingBottom: Math.max(insets.bottom, moderateScale(16)) },
          ]}
        >
          {/* Drag Handle Indicator */}
          <View style={styles.dragHandleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t('list_of_puja_items')}</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>
                  {normalizedUserItems.length + normalizedPanditjiItems.length}{' '}
                  items
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'user' && styles.tabButtonActiveUser,
              ]}
              onPress={() => setActiveTab('user')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="person"
                size={15}
                color={activeTab === 'user' ? COLORS.primary : '#64748B'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'user' && styles.tabTextActiveUser,
                ]}
                numberOfLines={1}
              >
                {t('your_items')}
              </Text>
              <View
                style={[
                  styles.tabCounter,
                  activeTab === 'user' && styles.tabCounterActiveUser,
                ]}
              >
                <Text
                  style={[
                    styles.tabCounterText,
                    activeTab === 'user' && styles.tabCounterTextActiveUser,
                  ]}
                >
                  {normalizedUserItems.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'pandit' && styles.tabButtonActivePandit,
              ]}
              onPress={() => setActiveTab('pandit')}
              activeOpacity={0.75}
            >
              <Ionicons
                name="gift"
                size={15}
                color={activeTab === 'pandit' ? COLORS.primary : '#64748B'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'pandit' && styles.tabTextActivePandit,
                ]}
                numberOfLines={1}
              >
                {t('panditji_items')}
              </Text>
              <View
                style={[
                  styles.tabCounter,
                  activeTab === 'pandit' && styles.tabCounterActivePandit,
                ]}
              >
                <Text
                  style={[
                    styles.tabCounterText,
                    activeTab === 'pandit' && styles.tabCounterTextActivePandit,
                  ]}
                >
                  {normalizedPanditjiItems.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tab Information Notice */}
          <View
            style={[
              styles.infoNotice,
              activeTab === 'user'
                ? styles.infoNoticeUser
                : styles.infoNoticePandit,
            ]}
          >
            <Ionicons
              name={
                activeTab === 'user'
                  ? 'checkmark-done-circle'
                  : 'shield-checkmark'
              }
              size={18}
              color={COLORS.primary}
              style={{ marginRight: moderateScale(8), marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.infoNoticeText,
                  activeTab === 'user'
                    ? styles.infoNoticeTextUser
                    : styles.infoNoticeTextPandit,
                ]}
              >
                {activeTab === 'user'
                  ? t('arrenged_item_by_you')
                  : t('arrenged_item_by_panditji')}
              </Text>
              {activeTab === 'user' && normalizedUserItems.length > 0 && (
                <Text style={styles.checklistSummaryText}>
                  Prepared: {checkedCount} / {normalizedUserItems.length} items
                  ready
                </Text>
              )}
            </View>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.itemsScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsScrollContent}
          >
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const isChecked =
                  activeTab === 'user' && !!checkedUserItems[index];

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.itemCard,
                      isChecked && styles.itemCardChecked,
                    ]}
                    onPress={
                      activeTab === 'user'
                        ? () => toggleUserItem(index)
                        : undefined
                    }
                    activeOpacity={activeTab === 'user' ? 0.7 : 1}
                  >
                    {/* Left Indicator: Interactive Checkbox for User, Number for Panditji */}
                    {activeTab === 'user' ? (
                      <View
                        style={[
                          styles.checkboxCircle,
                          isChecked && styles.checkboxCircleChecked,
                        ]}
                      >
                        {isChecked ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={COLORS.white}
                          />
                        ) : (
                          <Text style={styles.checkboxNumber}>{index + 1}</Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.panditNumberBadge}>
                        <Text style={styles.panditNumberText}>{index + 1}</Text>
                      </View>
                    )}

                    {/* Item Name */}
                    <View style={styles.itemTextContainer}>
                      <Text
                        style={[
                          styles.itemName,
                          isChecked && styles.itemNameChecked,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>

                    {/* Quantity Badge */}
                    {(item.quantity !== undefined || item.units) && (
                      <View
                        style={[
                          styles.quantityBadge,
                          isChecked && styles.quantityBadgeChecked,
                          activeTab === 'pandit' && styles.quantityBadgePandit,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quantityText,
                            isChecked && styles.quantityTextChecked,
                            activeTab === 'pandit' && styles.quantityTextPandit,
                          ]}
                        >
                          {item.quantity !== undefined
                            ? `${item.quantity} ${item.units ?? ''}`.trim()
                            : item.units}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="cube-outline"
                  size={42}
                  color="#CBD5E1"
                  style={{ marginBottom: moderateScale(10) }}
                />
                <Text style={styles.noItemsText}>{t('no_items_found')}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Confirmation Action */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.gotItButton}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItButtonText}>Close</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingTop: moderateScale(10),
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  dragHandleBar: {
    width: moderateScale(42),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: moderateScale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(12),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.textPrimary,
  },
  totalBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  totalBadgeText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#475569',
  },
  closeBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segmented Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(18),
    backgroundColor: '#E2E8F0',
    borderRadius: moderateScale(16),
    padding: moderateScale(4),
    gap: moderateScale(4),
    marginBottom: moderateScale(12),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(9),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(13),
    gap: moderateScale(6),
  },
  tabButtonActiveUser: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButtonActivePandit: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
    flexShrink: 1,
  },
  tabTextActiveUser: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  tabTextActivePandit: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  tabCounter: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(10),
    backgroundColor: '#CBD5E1',
  },
  tabCounterActiveUser: {
    backgroundColor: '#FFF1F2',
  },
  tabCounterActivePandit: {
    backgroundColor: '#FFF1F2',
  },
  tabCounterText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#475569',
  },
  tabCounterTextActiveUser: {
    color: COLORS.primary,
  },
  tabCounterTextActivePandit: {
    color: COLORS.primary,
  },

  // Notice Callout
  infoNotice: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(18),
    padding: moderateScale(12),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(12),
    borderWidth: 1,
  },
  infoNoticeUser: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  infoNoticePandit: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  infoNoticeText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    lineHeight: moderateScale(17),
  },
  infoNoticeTextUser: {
    color: '#991B1B',
  },
  infoNoticeTextPandit: {
    color: '#991B1B',
  },
  checklistSummaryText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    marginTop: moderateScale(4),
  },

  // Items Scroll
  itemsScrollView: {
    maxHeight: moderateScale(340),
  },
  itemsScrollContent: {
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(14),
    gap: moderateScale(8),
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: moderateScale(11),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#EDF2F7',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  itemCardChecked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkboxCircle: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  checkboxCircleChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxNumber: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#64748B',
  },
  panditNumberBadge: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(8),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  panditNumberText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  itemName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textPrimary,
  },
  itemNameChecked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  quantityBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  quantityBadgeChecked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  quantityBadgePandit: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  quantityText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  quantityTextChecked: {
    color: '#94A3B8',
  },
  quantityTextPandit: {
    color: COLORS.primary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(36),
  },
  noItemsText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#94A3B8',
  },

  // Footer Button
  footerContainer: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(12),
  },
  gotItButton: {
    backgroundColor: COLORS.primary,
    height: moderateScale(46),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gotItButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
  },
});

export default PujaItemsModal;
