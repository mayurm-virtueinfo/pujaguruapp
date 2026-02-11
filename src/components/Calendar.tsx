import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { COLORS, wp, hp, THEMESHADOW, COMMON_LIST_STYLE } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface CalendarProps {
  onDateSelect?: (date: string) => void;
  month?: string;
  onMonthChange?: (direction: 'prev' | 'next') => void;
  date: number;
  selectableDates?: string[];
  disableMonthChange?: boolean;
}

function getMonthYearFromString(monthStr: string) {
  const [monthName, yearStr] = monthStr.split(' ');
  const month = [
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
  ].findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  const year = parseInt(yearStr, 10);
  return { month, year };
}

function getMonthName(month: number): string {
  return [
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
  ][month];
}

type CalendarDayObject = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

const Calendar: React.FC<CalendarProps> = ({
  onDateSelect,
  month,
  onMonthChange,
  selectableDates,
  disableMonthChange,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string>();

  const { month: monthIdx, year } = useMemo(() => {
    if (month) return getMonthYearFromString(month);
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  }, [month]);

  const initialDate = useMemo(() => {
    return `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
  }, [monthIdx, year]);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(
    todayObj.getMonth() + 1,
  ).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const markedDates: { [date: string]: any } = {};

  // Always mark the current date with primaryBackgroundButton background color
  markedDates[todayStr] = {
    customStyles: {
      container: styles.todayContainer,
      text: styles.todayText,
    },
  };

  // If the selected date is not today, mark it with primary color
  if (currentSelected && currentSelected !== todayStr) {
    markedDates[currentSelected] = {
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
    const currentMonth = monthIdx + 1;
    if (dateObj.month < currentMonth || dateObj.year < year) {
      onMonthChange('prev');
    } else if (dateObj.month > currentMonth || dateObj.year > year) {
      onMonthChange('next');
    }
  };

  const handleDayPress = (day: CalendarDayObject) => {
    if (selectableDates && !selectableDates.includes(day.dateString)) {
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
        hideExtraDays={false}
        renderArrow={(direction: 'left' | 'right') => (
          <Text style={styles.arrowIcon}>
            {direction === 'left' ? '‹' : '›'}
          </Text>
        )}
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
