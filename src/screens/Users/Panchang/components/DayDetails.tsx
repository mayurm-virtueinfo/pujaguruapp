import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, COMMON_LIST_STYLE } from '../../../../theme/theme';
import { CalendarDay } from '../../../../api/apiService';
import { PanchangIcon, AstronomyIcon } from './PanchangIcons';
import CurrentChoghadiyaCard from './CurrentChoghadiyaCard';
import RealisticMoon from './RealisticMoon';
import { useTranslation } from 'react-i18next';
import { moderateScale } from 'react-native-size-matters';

interface DayDetailsProps {
  selectedDate: CalendarDay | null;
  choghadiyaData: any[];
  cityName: string | null;
}

const getChoghadiyaColor = (quality: string) => {
  switch (quality) {
    case 'Good':
      return COLORS.choghadiya.good;
    case 'Bad':
      return COLORS.choghadiya.bad;
    case 'Neutral':
    case 'Normal':
      return COLORS.choghadiya.normal;
    default:
      return { bg: '#F5F5F5', text: '#616161' };
  }
};

const DayDetails: React.FC<DayDetailsProps> = ({
  selectedDate,
  choghadiyaData,
  cityName,
}) => {
  if (!selectedDate) return null;

  // Safety check for panchang data which is not in grid data
  if (!selectedDate.panchang) {
    return null;
  }

  const dayChoghadiya = choghadiyaData.filter(item => item.period === 'Day');
  const nightChoghadiya = choghadiyaData.filter(
    item => item.period === 'Night',
  );

  const { t } = useTranslation();

  const renderChoghadiyaLegend = () => {
    const items = [
      { label: t('Good'), color: COLORS.choghadiya.good.text },
      { label: t('Bad'), color: COLORS.choghadiya.bad.text },
      { label: t('Normal'), color: COLORS.choghadiya.normal.text },
    ];

    return (
      <View style={styles.legendContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendIndicator, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderChoghadiyaTable = (title: string, data: any[]) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.panchangCard}>
        <Text style={styles.chogadiaSectionTitle}>{title}</Text>
        {/* Table Header */}
        <View style={styles.chogadiaTableHeader}>
          <Text style={[styles.chogadiaHeaderText, styles.tableColName]}>
            {t('Choghadiya')}
          </Text>
          <Text style={[styles.chogadiaHeaderText, styles.tableColTime]}>
            {t('StartTime')}
          </Text>
          <Text style={[styles.chogadiaHeaderText, styles.tableColTime]}>
            {t('EndTime')}
          </Text>
        </View>

        {/* Table Rows */}
        {data.map((item, index) => {
          const chogadiaName = item.type.replace(' Muhurat', '');
          const colors = getChoghadiyaColor(item.quality);

          return (
            <View
              key={index}
              style={[
                styles.chogadiaRow,
                {
                  backgroundColor: colors.bg,
                },
                index === data.length - 1 && styles.lastTableRow,
              ]}
            >
              <Text
                style={[
                  styles.chogadiaName,
                  styles.tableColName,
                  { color: colors.text, fontWeight: '700' },
                ]}
              >
                {chogadiaName}
              </Text>

              <Text
                style={[
                  styles.chogadiaTime,
                  styles.tableColTime,
                  { color: colors.text },
                ]}
              >
                {item.start}
              </Text>
              <Text
                style={[
                  styles.chogadiaTime,
                  styles.tableColTime,
                  { color: colors.text },
                ]}
              >
                {item.end}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.detailsContainer}>
      {/* GROUP 1 & 2: HEADER + PANCHANG ELEMENTS */}
      {/* This card contains both the header (Date, Paksha, Moon) and Panchang grid (Tithi, Nakshatra, Yoga, Karana) */}
      <View style={styles.panchangCard}>
        <View style={styles.cardHeader}>
          {/* Left Side: Date and Paksha */}
          <View style={styles.headerLeftContainer}>
            <Text style={styles.cardDate}>
              {new Date(selectedDate.date).toLocaleDateString('default', {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
              })}
            </Text>
            <View style={styles.pakshaBadge}>
              <Text style={styles.pakshaText}>
                {selectedDate.panchang.paksha} {t('Paksha')}
              </Text>
            </View>
          </View>

          {/* Right Side: Moon Image */}
          <View>
            <RealisticMoon
              phase={selectedDate.astronomy.moon_phase}
              size={56}
              displayText={
                (selectedDate.gujarati as any).original_display_text ||
                selectedDate.gujarati.display_text
              }
            />
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Group 2: Panchang Elements Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <PanchangIcon name="tithi" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.gridLabel}>{t('Tithi')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.panchang.tithi?.name}
              </Text>
              {selectedDate.panchang.tithi?.end_time && (
                <Text style={styles.gridTime}>
                  {t('Ends')}: {selectedDate.panchang.tithi.end_time}
                </Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <PanchangIcon
                    name="nakshatra"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Nakshatra')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.panchang.nakshatra?.name}
              </Text>
              {selectedDate.panchang.nakshatra?.end_time && (
                <Text style={styles.gridTime}>
                  {t('Ends')}: {selectedDate.panchang.nakshatra.end_time}
                </Text>
              )}
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <PanchangIcon name="yoga" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.gridLabel}>{t('Yoga')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.panchang.yoga?.name}
              </Text>
              {selectedDate.panchang.yoga?.end_time && (
                <Text style={styles.gridTime}>
                  {t('Ends')}: {selectedDate.panchang.yoga.end_time}
                </Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <PanchangIcon
                    name="karana"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Karana')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.panchang.karana?.name}
              </Text>
              {selectedDate.panchang.karana?.end_time && (
                <Text style={styles.gridTime}>
                  {t('Ends')}: {selectedDate.panchang.karana.end_time}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* GROUP 3: ASTRONOMY (SUN & MOON TIMES) */}
      <View style={styles.panchangCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardDate, styles.headerTitle]}>
            {t('Sun_Moon')}
          </Text>
          {cityName && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.locationText}>{cityName}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={[styles.gridItem, styles.astroItemOverride]}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <AstronomyIcon
                    name="sunrise"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Sunrise')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.astronomy.sunrise}
              </Text>
            </View>

            <View style={[styles.gridItem, styles.astroItemOverride]}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <AstronomyIcon
                    name="sunset"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Sunset')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.astronomy.sunset}
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={[styles.gridItem, styles.astroItemOverride]}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <AstronomyIcon
                    name="moonrise"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Moonrise')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.astronomy.moonrise || '--:--'}
              </Text>
            </View>

            <View style={[styles.gridItem, styles.astroItemOverride]}>
              <View style={styles.gridHeader}>
                <View style={styles.iconContainer}>
                  <AstronomyIcon
                    name="moonset"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.gridLabel}>{t('Moonset')}</Text>
              </View>
              <Text style={styles.gridValue}>
                {selectedDate.astronomy.moonset || '--:--'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* GROUP 4: CURRENT CHOGHADIYA (Today Only) */}
      {selectedDate.date === new Date().toISOString().split('T')[0] && (
        <CurrentChoghadiyaCard choghadiyaData={choghadiyaData} />
      )}

      {/* GROUP 5: CHOGHADIYA LEGEND */}
      {choghadiyaData.length > 0 && renderChoghadiyaLegend()}

      {/* GROUP 6: DAY CHOGHADIYA TABLE */}
      {renderChoghadiyaTable(t('Day_Choghadiya'), dayChoghadiya)}

      {/* GROUP 7: NIGHT CHOGHADIYA TABLE */}
      {renderChoghadiyaTable(t('Night_Choghadiya'), nightChoghadiya)}
    </View>
  );
};

const styles = StyleSheet.create({
  detailsContainer: {
    width: '100%',
    paddingHorizontal: moderateScale(14),
    gap: moderateScale(24),
    marginVertical: moderateScale(24),
  },
  panchangCard: {
    ...COMMON_LIST_STYLE,
    width: '100%',
    borderRadius: moderateScale(20),
    padding: moderateScale(14),
    borderWidth: moderateScale(1),
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  cardDate: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: moderateScale(8),
  },
  pakshaBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  pakshaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: moderateScale(12),
  },
  gridContainer: {
    gap: moderateScale(12),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: moderateScale(10),
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    borderColor: COLORS.border,
    alignItems: 'flex-start',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  iconContainer: {
    marginRight: moderateScale(8),
    backgroundColor: COLORS.white,
    padding: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  gridLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'left',
  },
  gridTime: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'left',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(16),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    marginRight: moderateScale(6),
    borderRadius: moderateScale(2),
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chogadiaSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  chogadiaTableHeader: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  chogadiaHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  chogadiaRow: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chogadiaName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chogadiaTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: moderateScale(4),
  },
  locationText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerLeftContainer: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  headerTitle: {
    color: COLORS.primary,
    flex: 1,
  },
  tableColName: {
    flex: 1.2,
  },
  tableColTime: {
    flex: 1,
  },
  lastTableRow: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
  },
  astroItemOverride: {},
  whiteBg: {
    backgroundColor: COLORS.white,
  },
});

export default React.memo(DayDetails);
