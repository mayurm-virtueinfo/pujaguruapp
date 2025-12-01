import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import Calendar from '../../../components/Calendar';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import { getLocationForAPI } from '../../../helper/helper';
import { getMuhrat } from '../../../api/apiService';
import { translateData } from '../../../utils/TranslateData';

type Slot = {
  type: string;
  start: string;
  end: string;
  [key: string]: any;
};

const formatDateYYYYMMDD = (date: Date | string) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) return formatDateYYYYMMDD(parsed);
    return formatDateYYYYMMDD(new Date());
  }
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return formatDateYYYYMMDD(new Date());
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr
    .trim()
    .match(/^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toLowerCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (meridian === 'pm' && hours !== 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  return dateStr === formatDateYYYYMMDD(new Date());
};

const formatReadableDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const filterSlotsForDay = (slots: Slot[], dateStr: string) => {
  if (!isToday(dateStr)) {
    return slots;
  }
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter(slot => {
    const startMinutes = parseTimeToMinutes(slot.start);
    return startMinutes !== null && startMinutes > nowMinutes;
  });
};

const MuhuratCalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const { showErrorToast } = useCommonToast();

  const todayRef = useRef(new Date());
  const today = todayRef.current;

  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [selectedDateString, setSelectedDateString] = useState<string>(
    formatDateYYYYMMDD(today),
  );
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${today.toLocaleString('default', {
      month: 'long',
    })} ${today.getFullYear()}`,
  );
  const [muhurats, setMuhurats] = useState<Slot[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const translationCacheRef = useRef<Map<string, Slot[]>>(new Map());

  useEffect(() => {
    let isMounted = true;
    const fetchLocation = async () => {
      const loc = await getLocationForAPI();
      if (isMounted) {
        setLocation(
          loc
            ? {
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
              }
            : null,
        );
      }
    };
    fetchLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchMuhurats = useCallback(
    async (dateStr?: string) => {
      if (!location?.latitude || !location?.longitude) {
        setMuhurats([]);
        setRefreshing(false);
        return;
      }
      const dateToFetch = formatDateYYYYMMDD(dateStr || selectedDateString);
      const cacheKey = `${currentLanguage}_${dateToFetch}`;
      try {
        setLoading(true);
        const cached = translationCacheRef.current.get(cacheKey);
        if (cached) {
          setMuhurats(filterSlotsForDay(cached, dateToFetch));
          return;
        }
        const response = await getMuhrat(
          dateToFetch,
          String(location.latitude),
          String(location.longitude),
        );
        const slots: Slot[] = Array.isArray(response?.choghadiya)
          ? response.choghadiya
          : [];
        if (!slots.length) {
          setMuhurats([]);
          return;
        }
        const translated = await translateData(slots, currentLanguage, [
          'type',
        ]);
        const translatedSlots: Slot[] = Array.isArray(translated)
          ? translated
          : slots;
        translationCacheRef.current.set(cacheKey, translatedSlots);
        setMuhurats(filterSlotsForDay(translatedSlots, dateToFetch));
      } catch (error) {
        console.error('Failed to fetch muhurat calendar', error);
        setMuhurats([]);
        showErrorToast(
          t('unable_to_fetch_muhurat') ||
            'Unable to load muhurat slots right now.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentLanguage, location, selectedDateString, showErrorToast, t],
  );

  useEffect(() => {
    if (location) {
      fetchMuhurats(selectedDateString);
    }
  }, [location, selectedDateString, fetchMuhurats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMuhurats(selectedDateString);
  }, [fetchMuhurats, selectedDateString]);

  const handleDateSelect = useCallback((dateString: string) => {
    if (!dateString) {
      return;
    }
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }
    const formatted = formatDateYYYYMMDD(parsed);
    setSelectedDate(parsed.getDate());
    setSelectedDateString(formatted);
    setCurrentMonth(
      `${parsed.toLocaleString('default', {
        month: 'long',
      })} ${parsed.getFullYear()}`,
    );
  }, []);

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      const [monthName, yearStr] = currentMonth.split(' ');
      const monthIdx = new Date(`${monthName} 1, ${yearStr}`).getMonth();
      let newMonthIdx = monthIdx;
      let newYear = parseInt(yearStr, 10);
      if (direction === 'prev') {
        newMonthIdx -= 1;
        if (newMonthIdx < 0) {
          newMonthIdx = 11;
          newYear -= 1;
        }
      } else {
        newMonthIdx += 1;
        if (newMonthIdx > 11) {
          newMonthIdx = 0;
          newYear += 1;
        }
      }
      const newMonthName = new Date(newYear, newMonthIdx).toLocaleString(
        'default',
        { month: 'long' },
      );
      const newDate = new Date(newYear, newMonthIdx, 1);
      const formattedDate = formatDateYYYYMMDD(newDate);
      setCurrentMonth(`${newMonthName} ${newYear}`);
      setSelectedDate(newDate.getDate());
      setSelectedDateString(formattedDate);
    },
    [currentMonth],
  );

  const calendarProps = useMemo(
    () => ({
      date: selectedDate,
      month: currentMonth,
      onDateSelect: handleDateSelect,
      onMonthChange: handleMonthChange,
    }),
    [currentMonth, handleDateSelect, handleMonthChange, selectedDate],
  );

  const formattedSelectedDate = useMemo(
    () => formatReadableDate(selectedDateString),
    [selectedDateString],
  );

  const renderSlots = () => {
    if (!location) {
      return (
        <Text style={styles.placeholderText}>
          {t('location_not_available')}
        </Text>
      );
    }
    if (muhurats.length === 0 && !loading) {
      return (
        <Text style={styles.placeholderText}>{t('no_muhurats_available')}</Text>
      );
    }
    return muhurats.map(slot => {
      const key = `${slot.start}-${slot.end}-${slot.type}`;
      return (
        <View key={key} style={[styles.slotCard, THEMESHADOW.shadow]}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotType}>{slot.type}</Text>
            <Text style={styles.slotTime}>
              {slot.start} - {slot.end}
            </Text>
          </View>
          {slot?.phase && <Text style={styles.slotMeta}>{slot.phase}</Text>}
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading && !refreshing} />
      <StatusBar
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <UserCustomHeader title={t('muhurat_calendar')} showBackButton />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primaryBackground]}
            tintColor={COLORS.primaryBackground}
          />
        }
      >
        <Calendar {...calendarProps} />
        <View style={[styles.dateChip, THEMESHADOW.shadow]}>
          <Text style={styles.dateChipLabel}>{t('date')}</Text>
          <Text style={styles.dateChipValue}>{formattedSelectedDate}</Text>
        </View>
        <View style={styles.slotSection}>
          <Text style={styles.slotSectionTitle}>
            {t('muhurats_for_date', { date: formattedSelectedDate })}
          </Text>
          {renderSlots()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContent: {
    backgroundColor: COLORS.white,
    padding: moderateScale(20),
    paddingBottom: verticalScale(40),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  dateChip: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(20),
  },
  dateChipLabel: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    color: COLORS.inputLabelText,
  },
  dateChipValue: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(16),
    color: COLORS.primaryTextDark,
    marginTop: verticalScale(4),
  },
  slotSection: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  slotSectionTitle: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(16),
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(12),
  },
  slotCard: {
    backgroundColor: COLORS.lightGray || '#F4F7FF',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotType: {
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(15),
    color: COLORS.primaryTextDark,
  },
  slotTime: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: COLORS.primary,
  },
  slotMeta: {
    marginTop: verticalScale(8),
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    color: COLORS.inputLabelText,
  },
  placeholderText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: COLORS.inputLabelText,
    textAlign: 'center',
    paddingVertical: verticalScale(12),
  },
});

export default MuhuratCalendarScreen;
