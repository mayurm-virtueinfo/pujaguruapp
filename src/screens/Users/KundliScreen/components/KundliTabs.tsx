import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export type KundliTabKey =
  | 'Lagna'
  | 'Navamsa'
  | 'Sun'
  | 'Moon'
  | 'Dasamsa'
  | 'Dasha'
  | 'Insights';

interface KundliTabsProps {
  activeTab: KundliTabKey;
  onSelectTab: (tab: KundliTabKey) => void;
  hasDashas?: boolean;
  hasInterpretation?: boolean;
}

export const KundliTabs: React.FC<KundliTabsProps> = ({
  activeTab,
  onSelectTab,
  hasDashas = false,
  hasInterpretation = false,
}) => {
  const { t } = useTranslation();

  const tabs: Array<{ key: KundliTabKey; label: string }> = [
    { key: 'Lagna', label: t('lagna_chart') || 'Lagna (D1)' },
    { key: 'Navamsa', label: t('navamsa_chart') || 'Navamsa (D9)' },
    { key: 'Sun', label: t('sun_chart') || 'Sun Chart' },
    { key: 'Moon', label: t('moon_chart') || 'Moon Chart' },
    { key: 'Dasamsa', label: t('dasamsa_chart') || 'Dasamsa (D10)' },
    ...(hasDashas
      ? [
          {
            key: 'Dasha' as KundliTabKey,
            label: t('vimshottari_dasha') || 'Dashas',
          },
        ]
      : []),
    ...(hasInterpretation
      ? [
          {
            key: 'Insights' as KundliTabKey,
            label: t('insights') || 'AI Predictions',
          },
        ]
      : []),
  ];

  return (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.75}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    marginBottom: verticalScale(14),
  },
  tabButton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(22),
    backgroundColor: '#F1F5F9',
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: '#64748B',
  },
  activeTabText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
  },
});
