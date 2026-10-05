import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliInsightsProps {
  interpretation: any;
}

export const KundliInsights: React.FC<KundliInsightsProps> = ({
  interpretation,
}) => {
  const { t } = useTranslation();

  if (!interpretation) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {t('no_insights_available') || 'No predictions found.'}
        </Text>
      </View>
    );
  }

  const bullets: string[] = interpretation.summary_bullets || [];
  const yogas: string[] = interpretation.overview?.yogas || [];
  const strengths: string[] = interpretation.overview?.strengths || [];

  return (
    <View style={styles.insightsWrapper}>
      {/* Key Summary Highlights */}
      {bullets.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIconBadge}>
              <Ionicons name="sparkles" size={15} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>
              {t('key_life_insights') || 'Key Life Predictions'}
            </Text>
          </View>
          {bullets.map((bullet, idx) => {
            const cleanBullet = bullet.replace(/\*\*/g, '');
            return (
              <View key={idx} style={styles.bulletItem}>
                <Ionicons
                  name="ellipse"
                  size={6}
                  color={COLORS.primary}
                  style={styles.bulletDot}
                />
                <Text style={styles.bulletText}>{cleanBullet}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Auspicious Yogas */}
      {yogas.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.headerIconBadge, styles.yogaIconBg]}>
              <Ionicons name="trophy" size={15} color="#D97706" />
            </View>
            <Text style={styles.sectionTitle}>
              {t('auspicious_yogas') || 'Auspicious Yogas in Kundli'}
            </Text>
          </View>
          {yogas.map((yoga, idx) => (
            <View key={idx} style={styles.yogaCard}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color="#D97706"
                style={styles.yogaIcon}
              />
              <Text style={styles.yogaText}>{yoga.replace(/\*\*/g, '')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Planetary Strengths */}
      {strengths.length > 0 && (
        <View style={styles.insightCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.headerIconBadge, styles.strengthIconBg]}>
              <Ionicons name="fitness" size={15} color="#059669" />
            </View>
            <Text style={styles.sectionTitle}>
              {t('planetary_strengths') || 'Planetary Strengths'}
            </Text>
          </View>
          {strengths.map((str, idx) => (
            <View key={idx} style={styles.strengthRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#059669"
                style={styles.strengthIcon}
              />
              <Text style={styles.strengthText}>
                {str.replace(/\*\*/g, '')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  insightsWrapper: {
    gap: verticalScale(12),
  },
  insightCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  headerIconBadge: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  yogaIconBg: {
    backgroundColor: '#FEF3C7',
  },
  strengthIconBg: {
    backgroundColor: '#ECFDF5',
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  bulletDot: {
    marginTop: verticalScale(6),
    marginRight: scale(8),
  },
  bulletText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#334155',
    lineHeight: moderateScale(18),
  },
  yogaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  yogaIcon: {
    marginRight: scale(8),
    marginTop: 1,
  },
  yogaText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#78350F',
    lineHeight: moderateScale(18),
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  strengthIcon: {
    marginRight: scale(8),
    marginTop: 1,
  },
  strengthText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#065F46',
    lineHeight: moderateScale(18),
  },
});
