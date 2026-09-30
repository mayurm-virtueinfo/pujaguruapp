import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { COLORS, wp, hp, THEMESHADOW, COMMON_LIST_STYLE } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getMonthYearFromString(monthStr?: string): {
  month: number;
  year: number;
} {
  const now = new Date();
  if (!monthStr || typeof monthStr !== 'string') {
    return { month: now.getMonth(), year: now.getFullYear() };
  }
  const parts = monthStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const monthName = parts[0].toLowerCase();
    const yearNum = parseInt(parts[1], 10);
    const mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName);
    if (mIdx !== -1 && !isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
      return { month: mIdx, year: yearNum };
    }
  }
  return { month: now.getMonth(), year: now.getFullYear() };
}

function getMonthName(month: number): string {
  return MONTH_NAMES[Math.max(0, Math.min(11, month))];
}

export type CalendarDayObject = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

interface CalendarProps {
  onDateSelect?: (date: string) => void;
  month?: string;
  onMonthChange?: (
    direction: 'prev' | 'next',
    dateObj?: CalendarDayObject,
  ) => void;
  date?: number;
  selectedDate?: string;
  selectableDates?: string[];
  disableMonthChange?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  onDateSelect,
  month,
  onMonthChange,
  selectableDates,
  disableMonthChange,
  selectedDate,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string>();

  const activeSelected =
    selectedDate !== undefined ? selectedDate : currentSelected;

  const { month: monthIdx, year } = useMemo(() => {
    return getMonthYearFromString(month);
  }, [month]);

  const initialDate = useMemo(() => {
    const safeMonth = Math.max(0, Math.min(11, monthIdx));
    const safeYear =
      isNaN(year) || year < 2000 ? new Date().getFullYear() : year;
    const mStr = String(safeMonth + 1).padStart(2, '0');
    return `${safeYear}-${mStr}-01`;
  }, [monthIdx, year]);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(
    todayObj.getMonth() + 1,
  ).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const isViewingCurrentMonth =
    todayObj.getFullYear() === year && todayObj.getMonth() === monthIdx;

  const isCurrentMonthOrPast =
    year < todayObj.getFullYear() ||
    (year === todayObj.getFullYear() && monthIdx <= todayObj.getMonth());

  const markedDates: { [date: string]: any } = {};

  // Always mark the current date with primaryBackgroundButton background color ONLY when viewing today's month
  if (isViewingCurrentMonth) {
    markedDates[todayStr] = {
      customStyles: {
        container: styles.todayContainer,
        text: styles.todayText,
      },
    };
  }

  // If the selected date is not today, mark it with primary color
  if (activeSelected && activeSelected !== todayStr) {
    markedDates[activeSelected] = {
      customStyles: {
        container: styles.selectedContainer,
        text: styles.selectedText,
      },
    };
  }

  // Mark selectable dates with border, if not already marked
  if (selectableDates) {
    selectableDates.forEach(date => {
      if (!markedDates[date]) {
        markedDates[date] = {
          customStyles: {
            container: styles.availableContainer,
            text: styles.availableText,
          },
        };
      }
    });
  }

  const handleMonthChange = (dateObj: CalendarDayObject) => {
    if (disableMonthChange) return;
    if (!onMonthChange) return;
    const currentMonthNum = monthIdx + 1;
    if (dateObj.month < currentMonthNum || dateObj.year < year) {
      onMonthChange('prev', dateObj);
    } else if (dateObj.month > currentMonthNum || dateObj.year > year) {
      onMonthChange('next', dateObj);
    }
  };

  const handleDayPress = (day: CalendarDayObject) => {
    if (selectableDates && !selectableDates.includes(day.dateString)) {
      onDateSelect?.(day.dateString);
      return;
    }
    setCurrentSelected(day.dateString);
    onDateSelect?.(day.dateString);
  };

  return (
    <View style={[styles.calendarContainer, COMMON_LIST_STYLE]}>
      <RNCalendar
        current={initialDate}
        minDate={todayStr}
        markingType={'custom'}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        disableArrowLeft={isCurrentMonthOrPast}
        disableArrowRight={disableMonthChange}
        theme={
          {
            backgroundColor: COLORS.white,
            calendarBackground: COLORS.white,
            textSectionTitleColor: COLORS.pujaCardSubtext,
            textSectionTitleDisabledColor: '#d9e1e8',
            dayTextColor: COLORS.primaryTextDark,
            textDisabledColor: COLORS.pujaCardSubtext,
            monthTextColor: COLORS.primaryTextDark,
            textMonthFontFamily: Fonts.Sen_Medium,
            textDayFontFamily: Fonts.Sen_Medium,
            textDayHeaderFontFamily: Fonts.Sen_Medium,
            textMonthFontSize: moderateScale(15),
            textDayFontSize: moderateScale(12),
            textDayHeaderFontSize: moderateScale(12),
            arrowColor: COLORS.primaryTextDark,
            'stylesheet.day.basic': {
              base: {
                width: wp(12),
                height: hp(4),
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              },
              text: {
                fontSize: moderateScale(12),
                fontFamily: Fonts.Sen_Medium,
                color: COLORS.primaryTextDark,
                textAlign: 'center',
                alignSelf: 'center',
              },
            },
          } as any
        }
        hideExtraDays={true}
        renderArrow={(direction: 'left' | 'right') => {
          if (direction === 'left' && isCurrentMonthOrPast) return null;
          if (direction === 'right' && disableMonthChange) return null;
          return (
            <Text style={styles.arrowIcon}>
              {direction === 'left' ? '‹' : '›'}
            </Text>
          );
        }}
        firstDay={0}
        enableSwipeMonths={!disableMonthChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  currentDataContainer: {
    marginBottom: verticalScale(8),
    alignItems: 'center',
  },
  currentDataText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  arrowIcon: {
    fontSize: moderateScale(18),
    color: COLORS.primaryTextDark,
    fontWeight: 'bold',
  },
  todayContainer: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: 100,
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  todayText: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  selectedContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  selectedText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
  availableContainer: {
    borderWidth: 1,
    borderColor: COLORS.gradientEnd,
    borderRadius: 100,
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  availableText: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
});

export default Calendar;
