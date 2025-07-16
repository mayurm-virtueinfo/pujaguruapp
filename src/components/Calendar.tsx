import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Calendar as RNCalendar} from 'react-native-calendars';
import {COLORS, wp, hp} from '../theme/theme';
import Fonts from '../theme/fonts';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';

interface CalendarProps {
  onDateSelect?: (date: string) => void;
  month?: string;
  onMonthChange?: (direction: 'prev' | 'next') => void;
  date: number;
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
  return {month, year};
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
}) => {
  const [currentSelected, setCurrentSelected] = useState<string>();

  const {month: monthIdx, year} = useMemo(() => {
    if (month) return getMonthYearFromString(month);
    const today = new Date();
    return {month: today.getMonth(), year: today.getFullYear()};
  }, [month]);

  const initialDate = useMemo(() => {
    return `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
  }, [monthIdx, year]);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(
    todayObj.getMonth() + 1,
  ).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const markedDates: {[date: string]: any} = {};

  if (todayObj.getFullYear() === year && todayObj.getMonth() === monthIdx) {
    markedDates[todayStr] = {
      customStyles: {
        container: {
          backgroundColor: '#FA1927',
          borderRadius: 9999,
          width: wp(8),
          height: wp(8),
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        },
        text: {
          color: '#FFFFFF',
          fontFamily: Fonts.Sen_Medium,
          fontSize: moderateScale(12),
        },
      },
    };
  }

  if (currentSelected && currentSelected !== todayStr) {
    markedDates[currentSelected] = {
      customStyles: {
        container: {
          backgroundColor: COLORS.primaryBackgroundButton,
          borderRadius: 9999,
          width: wp(8),
          height: wp(8),
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        },
        text: {
          color: '#000000',
          fontFamily: Fonts.Sen_Medium,
          fontSize: moderateScale(12),
        },
      },
    };
  }

  const handleMonthChange = (dateObj: CalendarDayObject) => {
    if (!onMonthChange) return;
    const currentMonth = monthIdx + 1;
    if (dateObj.month < currentMonth || dateObj.year < year) {
      onMonthChange('prev');
    } else if (dateObj.month > currentMonth || dateObj.year > year) {
      onMonthChange('next');
    }
  };

  const handleDayPress = (day: CalendarDayObject) => {
    setCurrentSelected(day.dateString);
    onDateSelect?.(day.dateString);
  };

  return (
    <View style={styles.calendarContainer}>
      <RNCalendar
        current={initialDate}
        markingType={'custom'}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        theme={{
          backgroundColor: '#fff',
          calendarBackground: '#fff',
          textSectionTitleColor: '#8A8A8A',
          textSectionTitleDisabledColor: '#d9e1e8',
          dayTextColor: COLORS.primaryTextDark,
          textDisabledColor: '#8A8A8A',
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
            },
            text: {
              fontSize: moderateScale(12),
              fontFamily: Fonts.Sen_Medium,
              color: COLORS.primaryTextDark,
              textAlign: 'center',
            },
          },
        }}
        hideExtraDays={false}
        renderArrow={(direction: 'left' | 'right') => (
          <Text style={styles.arrowIcon}>
            {direction === 'left' ? '‹' : '›'}
          </Text>
        )}
        firstDay={0}
        enableSwipeMonths={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});

export default Calendar;
