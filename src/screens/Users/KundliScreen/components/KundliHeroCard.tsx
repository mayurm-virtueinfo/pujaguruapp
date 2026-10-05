import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../../theme/theme';
import Fonts from '../../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliHeroCardProps {
  name?: string;
  user: any;
  formattedDate: string;
  formattedTime: string;
  place: string;
  currentDasha: any;
  onDownload: () => void;
  onShare: () => void;
}

export const KundliHeroCard: React.FC<KundliHeroCardProps> = ({
  name,
  user,
  formattedDate,
  formattedTime,
  place,
  currentDasha,
  onDownload,
  onShare,
}) => {
  const { t } = useTranslation();

  const displayName =
    name || user?.name || t('kundli_profile') || 'Kundli Profile';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'K';

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
          <View style={styles.avatarMiniBadge}>
            <Ionicons name="sparkles" size={9} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.heroInfoCol}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>

          {/* Birth Pills */}
          <View style={styles.birthPillRow}>
            {!!formattedDate && (
              <View style={styles.miniPill}>
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color="#64748B"
                  style={styles.pillIcon}
                />
                <Text style={styles.pillText}>{formattedDate}</Text>
              </View>
            )}
            {!!formattedTime && (
              <View style={styles.miniPill}>
                <Ionicons
                  name="time-outline"
                  size={11}
                  color="#64748B"
                  style={styles.pillIcon}
                />
                <Text style={styles.pillText}>{formattedTime}</Text>
              </View>
            )}
          </View>

          {!!place && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color="#64748B"
                style={styles.locationIcon}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {place}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Panchang Astrological Details Row */}
      {(user?.rashi || user?.nakshatra || user?.tithi) && (
        <View style={styles.panchangGrid}>
          {!!user.rashi && (
            <View style={styles.panchangCell}>
              <Text style={styles.panchangLabel}>{t('rashi') || 'Rashi'}</Text>
              <Text style={styles.panchangValue}>{user.rashi}</Text>
            </View>
          )}
          {!!user.nakshatra && (
            <View style={styles.panchangCell}>
              <Text style={styles.panchangLabel}>
                {t('Nakshatra') || 'Nakshatra'}
              </Text>
              <Text style={styles.panchangValue}>{user.nakshatra}</Text>
            </View>
          )}
          {!!user.tithi && (
            <View style={styles.panchangCell}>
              <Text style={styles.panchangLabel}>{t('Tithi') || 'Tithi'}</Text>
              <Text style={styles.panchangValue}>{user.tithi}</Text>
            </View>
          )}
          {!!user.yoga && (
            <View style={styles.panchangCell}>
              <Text style={styles.panchangLabel}>{t('Yoga') || 'Yoga'}</Text>
              <Text style={styles.panchangValue}>{user.yoga}</Text>
            </View>
          )}
        </View>
      )}

      {/* Current Dasha Pill */}
      {currentDasha && (
        <View style={styles.dashaBanner}>
          <Ionicons
            name="sparkles"
            size={14}
            color="#059669"
            style={styles.dashaIcon}
          />
          <Text style={styles.dashaText} numberOfLines={1}>
            {t('current_dasha') || 'Current Dasha'}:{' '}
            <Text style={styles.dashaBold}>
              {currentDasha.dasha} • {currentDasha.bhukti}
              {currentDasha.paryantardasha
                ? ` • ${currentDasha.paryantardasha}`
                : ''}
            </Text>
          </Text>
        </View>
      )}

      {/* Actions: Download PDF & Share */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.downloadButton}
          activeOpacity={0.85}
          onPress={onDownload}
        >
          <Ionicons
            name="download-outline"
            size={17}
            color={COLORS.white}
            style={styles.actionButtonIcon}
          />
          <Text style={styles.downloadButtonText}>
            {t('download_pdf') || t('download') || 'Download PDF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          activeOpacity={0.85}
          onPress={onShare}
        >
          <Ionicons
            name="share-social-outline"
            size={17}
            color={COLORS.primary}
            style={styles.actionButtonIcon}
          />
          <Text style={styles.shareButtonText}>{t('share') || 'Share'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  avatarCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#FFF0F1',
    borderWidth: 1.5,
    borderColor: '#FFE0E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    position: 'relative',
  },
  avatarText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(20),
    color: COLORS.primary,
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(6),
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFE0E3',
  },
  heroInfoCol: {
    flex: 1,
  },
  name: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: verticalScale(3),
  },
  birthPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginBottom: verticalScale(4),
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
  },
  pillIcon: {
    marginRight: scale(4),
  },
  pillText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#475569',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: scale(4),
  },
  locationText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    flex: 1,
  },
  panchangGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFDF5',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    marginBottom: verticalScale(10),
  },
  panchangCell: {
    width: '50%',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
  },
  panchangLabel: {
    fontSize: moderateScale(9),
    fontFamily: Fonts.Sen_Bold,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  panchangValue: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: '#451A03',
    marginTop: verticalScale(1),
  },
  dashaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(12),
  },
  dashaIcon: {
    marginRight: scale(6),
  },
  dashaText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#166534',
    flex: 1,
  },
  dashaBold: {
    fontFamily: Fonts.Sen_Bold,
    color: '#14532D',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: scale(10),
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(11),
    borderRadius: moderateScale(12),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13),
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: verticalScale(11),
    borderRadius: moderateScale(12),
  },
  shareButtonText: {
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13),
  },
  actionButtonIcon: {
    marginRight: scale(6),
  },
});
