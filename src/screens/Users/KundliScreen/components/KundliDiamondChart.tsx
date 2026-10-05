import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliDiamondChartProps {
  chartData: any;
  chartTitle?: string;
}

const houseOrder = [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

const planetSymbols: Record<string, string> = {
  Ascendant: 'As',
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const signMap: Record<string, number> = {
  Aries: 1,
  Taurus: 2,
  Gemini: 3,
  Cancer: 4,
  Leo: 5,
  Virgo: 6,
  Libra: 7,
  Scorpio: 8,
  Sagittarius: 9,
  Capricorn: 10,
  Aquarius: 11,
  Pisces: 12,
};

const chartBoxSize = scale(310);
const diagonalLength = Math.hypot(chartBoxSize, chartBoxSize);

export const KundliDiamondChart: React.FC<KundliDiamondChartProps> = ({
  chartData,
  chartTitle,
}) => {
  const planets = chartData?.planets || {};
  const ascendant = chartData?.ascendant;

  return (
    <View style={styles.chartCard}>
      {chartTitle ? (
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleBadge}>
            <Ionicons name="planet" size={15} color={COLORS.primary} />
          </View>
          <Text style={styles.chartCardTitle}>{chartTitle}</Text>
        </View>
      ) : null}

      <View style={styles.diamondChartWrapper}>
        <View style={styles.diamondChart}>
          {/* Diagonals */}
          <View style={styles.diagonal1} />
          <View style={styles.diagonal2} />

          {/* Inner Diamond */}
          <View style={styles.innerDiamond} />

          {/* 12 Houses */}
          {houseOrder.map(houseNum => {
            const ascSignName = ascendant?.sign;
            const ascSignNum = signMap[ascSignName] || 1;
            const currentHouseSignNum = ((ascSignNum + houseNum - 2) % 12) + 1;

            // Find planets in this Sign
            const planetsInHouse = Object.entries(planets)
              .filter(([, val]: [string, any]) => {
                const pSign = val.sign;
                const pSignNum = signMap[pSign];
                return pSignNum === currentHouseSignNum;
              })
              .map(([key]) => planetSymbols[key] || key);

            const isAscHouse = houseNum === 1;

            return (
              <View
                key={houseNum}
                style={[
                  styles.house,
                  styles[`house${houseNum}` as keyof typeof styles] as any,
                ]}
              >
                <Text style={styles.houseNumber}>{currentHouseSignNum}</Text>
                {isAscHouse && <Text style={styles.asc}>Lagna</Text>}
                {planetsInHouse.map((p, i) => (
                  <Text key={i} style={styles.planet}>
                    {p}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: verticalScale(12),
  },
  chartTitleBadge: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  chartCardTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  diamondChartWrapper: {
    padding: scale(4),
  },
  diamondChart: {
    width: chartBoxSize,
    height: chartBoxSize,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFDF9',
  },
  diagonal1: {
    position: 'absolute',
    width: diagonalLength,
    height: 1.5,
    backgroundColor: COLORS.primary,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -diagonalLength / 2 }, { rotate: '45deg' }],
  },
  diagonal2: {
    position: 'absolute',
    width: diagonalLength,
    height: 1.5,
    backgroundColor: COLORS.primary,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -diagonalLength / 2 }, { rotate: '-45deg' }],
  },
  innerDiamond: {
    position: 'absolute',
    width: '70.71%',
    height: '70.71%',
    top: '14.64%',
    left: '14.64%',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
  },
  house: {
    position: 'absolute',
    width: moderateScale(48),
    height: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  house1: { top: '25%', left: '50%', marginLeft: -24, marginTop: -24 },
  house2: { top: '8%', left: '25%', marginLeft: -24, marginTop: -24 },
  house3: { top: '25%', left: '8%', marginLeft: -24, marginTop: -24 },
  house4: { top: '50%', left: '25%', marginLeft: -24, marginTop: -24 },
  house5: { top: '75%', left: '8%', marginLeft: -24, marginTop: -24 },
  house6: { top: '92%', left: '25%', marginLeft: -24, marginTop: -24 },
  house7: { top: '75%', left: '50%', marginLeft: -24, marginTop: -24 },
  house8: { top: '92%', left: '75%', marginLeft: -24, marginTop: -24 },
  house9: { top: '75%', left: '92%', marginLeft: -24, marginTop: -24 },
  house10: { top: '50%', left: '75%', marginLeft: -24, marginTop: -24 },
  house11: { top: '25%', left: '92%', marginLeft: -24, marginTop: -24 },
  house12: { top: '8%', left: '75%', marginLeft: -24, marginTop: -24 },
  houseNumber: {
    fontSize: moderateScale(9),
    fontFamily: Fonts.Sen_Bold,
    color: '#94A3B8',
    marginBottom: 1,
  },
  planet: {
    fontSize: moderateScale(10),
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  asc: {
    fontSize: moderateScale(9),
    color: '#D97706',
    fontFamily: Fonts.Sen_Bold,
  },
});
