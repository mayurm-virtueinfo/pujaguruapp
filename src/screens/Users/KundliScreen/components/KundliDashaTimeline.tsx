import moment from 'moment';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliDashaTimelineProps {
  mahadashas: any;
}

export const KundliDashaTimeline: React.FC<KundliDashaTimelineProps> = ({
  mahadashas,
}) => {
  const { t } = useTranslation();

  const dashaList: any[] = Object.values(mahadashas || {}).sort(
    (a: any, b: any) => a.dashaNum - b.dashaNum,
  );

  const now = moment();

  return (
    <View style={styles.tableCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerIconBadge}>
          <Ionicons name="time" size={15} color={COLORS.primary} />
        </View>
        <Text style={styles.sectionTitle}>
          {t('vimshottari_dasha') || 'Vimshottari Mahadasha Periods'}
        </Text>
      </View>

      <View style={styles.dashaCardsContainer}>
        {dashaList.map((dasha: any, index: number) => {
          const startM = moment(dasha.startDate);
          const endM = moment(dasha.endDate);
          const isCurrent =
            now.isSameOrAfter(startM) && now.isSameOrBefore(endM);

          return (
            <View
              key={index}
              style={[
                styles.dashaItemCard,
                isCurrent ? styles.dashaItemCurrent : null,
              ]}
            >
              <View style={styles.dashaLordCol}>
                <View
                  style={[
                    styles.dashaLordCircle,
                    isCurrent ? styles.dashaLordCircleCurrent : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dashaLordInitial,
                      isCurrent ? styles.dashaLordInitialCurrent : null,
                    ]}
                  >
                    {dasha.lord ? dasha.lord.charAt(0) : 'D'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.dashaLordText}>{dasha.lord}</Text>
                  {isCurrent && (
                    <View style={styles.currentActiveBadge}>
                      <Text style={styles.currentActiveText}>
                        {t('active_now') || 'Active Now'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.dashaDatesCol}>
                <Text style={styles.dashaDateText}>
                  {dasha.startDate?.split(' ')[0]} -{' '}
                  {dasha.endDate?.split(' ')[0]}
                </Text>
                <Text style={styles.dashaDurationText}>
                  {dasha.duration} {t('years') || 'Years'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
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
  dashaCardsContainer: {
    gap: verticalScale(8),
  },
  dashaItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dashaItemCurrent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
  },
  dashaLordCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  dashaLordCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashaLordCircleCurrent: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dashaLordInitial: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#475569',
  },
  dashaLordInitialCurrent: {
    color: '#D97706',
  },
  dashaLordText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
  },
  currentActiveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: scale(6),
    paddingVertical: 1,
    borderRadius: moderateScale(6),
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  currentActiveText: {
    fontSize: moderateScale(9),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  dashaDatesCol: {
    alignItems: 'flex-end',
  },
  dashaDateText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  dashaDurationText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#334155',
    marginTop: 1,
  },
});
