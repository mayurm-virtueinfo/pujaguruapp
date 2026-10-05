import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliPlanetaryTableProps {
  chartData: any;
}

export const KundliPlanetaryTable: React.FC<KundliPlanetaryTableProps> = ({
  chartData,
}) => {
  const { t } = useTranslation();

  const planets = chartData?.planets || {};
  const ascendant = chartData?.ascendant;
  const houses = chartData?.houses || [];

  const signLordMap: Record<string, string> = {
    Aries: 'Mars',
    Taurus: 'Venus',
    Gemini: 'Mercury',
    Cancer: 'Moon',
    Leo: 'Sun',
    Virgo: 'Mercury',
    Libra: 'Venus',
    Scorpio: 'Mars',
    Sagittarius: 'Jupiter',
    Capricorn: 'Saturn',
    Aquarius: 'Saturn',
    Pisces: 'Jupiter',
  };

  houses.forEach((h: any) => {
    if (h.sign && h['sign-lord']) {
      signLordMap[h.sign] = h['sign-lord'];
    }
  });

  return (
    <View style={styles.tableCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerIconBadge}>
          <Ionicons name="list" size={15} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>
          {t('planetary_positions') || 'Planetary Positions'}
        </Text>
      </View>

      {/* Table Header */}
      <View style={[styles.row, styles.tableHeader]}>
        <Text style={[styles.cell, styles.headerCell, styles.flexPlanet]}>
          {t('planet') || 'Planet'}
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.flexSign]}>
          {t('sign') || 'Sign'}
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.flexLord]}>
          {t('sign_lord') || 'Lord'}
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.flexDegree]}>
          {t('degree') || 'Degree'}
        </Text>
        <Text style={[styles.cell, styles.headerCell, styles.flexHouse]}>
          {t('house') || 'House'}
        </Text>
      </View>

      {/* Ascendant Row */}
      <View style={[styles.row, styles.ascendantRow]}>
        <Text
          style={[
            styles.cell,
            styles.planetText,
            styles.flexPlanet,
            styles.ascText,
          ]}
        >
          {t('ascendant_lagna') || 'Ascendant (Lagna)'}
        </Text>
        <Text style={[styles.cell, styles.flexSign, styles.cellBold]}>
          {ascendant?.sign || '-'}
        </Text>
        <Text style={[styles.cell, styles.flexLord]}>
          {signLordMap[ascendant?.sign] || '-'}
        </Text>
        <Text style={[styles.cell, styles.flexDegree]}>
          {ascendant?.pos?.deg ? `${ascendant.pos.deg.toFixed(2)}°` : '-'}
        </Text>
        <Text style={[styles.cell, styles.flexHouse]}>1</Text>
      </View>

      {/* Planets Rows */}
      {Object.entries(planets).map(
        ([planet, info]: [string, any], index, array) => {
          const isEven = index % 2 === 0;
          const isLast = index === array.length - 1;
          return (
            <View
              key={planet}
              style={[
                styles.row,
                isEven ? styles.rowEven : null,
                isLast ? styles.rowLast : null,
              ]}
            >
              <Text style={[styles.cell, styles.planetText, styles.flexPlanet]}>
                {planet}
              </Text>
              <Text style={[styles.cell, styles.flexSign]}>
                {info.sign || '-'}
              </Text>
              <Text style={[styles.cell, styles.flexLord]}>
                {signLordMap[info.sign] || '-'}
              </Text>
              <Text style={[styles.cell, styles.flexDegree]}>
                {info.pos?.deg ? `${info.pos.deg.toFixed(2)}°` : '-'}
              </Text>
              <Text style={[styles.cell, styles.flexHouse]}>
                {info['house-num'] ?? '-'}
              </Text>
            </View>
          );
        },
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
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
  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: verticalScale(7),
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(8),
  },
  cell: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#334155',
  },
  headerCell: {
    fontFamily: Fonts.Sen_Bold,
    color: '#64748B',
    fontSize: moderateScale(11),
    textTransform: 'uppercase',
  },
  flexPlanet: { flex: 2.2, paddingLeft: scale(4) },
  flexSign: { flex: 1.8 },
  flexLord: { flex: 1.6 },
  flexDegree: { flex: 1.6 },
  flexHouse: { flex: 1.2, textAlign: 'center' },
  ascendantRow: {
    backgroundColor: '#FFFBEB',
  },
  ascText: {
    fontFamily: Fonts.Sen_Bold,
    color: '#D97706',
  },
  rowEven: {
    backgroundColor: '#FAFBFD',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  planetText: {
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  cellBold: {
    fontFamily: Fonts.Sen_Bold,
  },
});
