import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  Directions,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import {
  getPanchangCalendarGrid,
  getPanchangDayDetails,
  getMuhrat,
  CalendarDay,
} from '../../../api/apiService';
import { useLocation } from '../../../context/LocationContext';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import CalendarDayCell from './components/CalendarDayCell';
import DayDetails from './components/DayDetails';
import PermissionDeniedView from './components/PermissionDeniedView';
import { getCityName } from '../../../helper/helper';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_MARGIN = 4;
const CELL_WIDTH = (SCREEN_WIDTH - CELL_MARGIN * 14 - 16) / 7;

const CalendarScreen = () => {
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [calendarData, setCalendarData] = useState<(CalendarDay | null)[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<CalendarDay | null>(null);
  const [choghadiyaData, setChoghadiyaData] = useState<any[]>([]);
  const [cityName, setCityName] = useState<string | null>(null);

  const {
    location: locationData,
    refreshLocation,
    permissionStatus,
  } = useLocation();

  const inset = useSafeAreaInsets();
  const { t } = useTranslation();

  const location = useMemo(() => {
    if (locationData) {
      return { lat: locationData.latitude, lon: locationData.longitude };
    }
    return null;
  }, [locationData]);

  const fetchCalendar = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const data = await getPanchangCalendarGrid(
        currentMonth,
        currentYear,
        location.lat,
        location.lon,
      );

      // Calculate padding for the first day
      // Date(year, monthIndex, 1) -> monthIndex is 0-based
      const firstDay = new Date(currentYear, currentMonth - 1, 1);
      const startDayIndex = firstDay.getDay(); // 0 = Sun, 1 = Mon, etc.

      const padding = Array(startDayIndex).fill(null);
      const fullGrid = [...padding, ...data];
      setCalendarData(fullGrid);

      // Auto-select today or first available day
      if (fullGrid.length > 0) {
        const today = new Date();
        const isCurrentMonth =
          currentMonth === today.getMonth() + 1 &&
          currentYear === today.getFullYear();

        if (isCurrentMonth) {
          const todayStr = `${today.getFullYear()}-${String(
            today.getMonth() + 1,
          ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const todayItem = data.find(item => item && item.date === todayStr);
          if (todayItem) {
            handleDateSelect(todayItem);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, location]);

  const handleDateSelect = useCallback(
    async (item: CalendarDay) => {
      if (!item || !location) return;
      setDetailsLoading(true);
      // Set selected date immediately to update UI selection state (even if partial)
      setSelectedDate(item);

      try {
        const [details, muhratResponse] = await Promise.all([
          getPanchangDayDetails(item.date, location.lat, location.lon),
          getMuhrat(
            item.date,
            location.lat.toString(),
            location.lon.toString(),
          ),
        ]);

        if (details) {
          setSelectedDate(details);
        }

        if (muhratResponse && Array.isArray(muhratResponse.choghadiya)) {
          setChoghadiyaData(muhratResponse.choghadiya);
        } else if (
          muhratResponse &&
          Array.isArray(muhratResponse.data?.choghadiya)
        ) {
          setChoghadiyaData(muhratResponse.data.choghadiya);
        } else if (Array.isArray(muhratResponse)) {
          setChoghadiyaData(muhratResponse);
        } else {
          console.log('Unexpected Choghadiya response:', muhratResponse);
          setChoghadiyaData([]);
        }
      } catch (error) {
        console.error('Error fetching day details:', error);
      } finally {
        setDetailsLoading(false);
      }
    },
    [location],
  );

  const changeMonth = useCallback(
    (increment: number) => {
      let newMonth = currentMonth + increment;
      let newYear = currentYear;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }

      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    },
    [currentMonth, currentYear],
  );

  const panGesture = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(() => {
        scheduleOnRN(changeMonth, 1);
      }),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .onEnd(() => {
        scheduleOnRN(changeMonth, -1);
      }),
  );

  const renderHeader = () => {
    let displayMonthName = '';
    let displayYear = currentYear;
    let displayGujMonth = '...';
    let displayVikramSamvat: number | string = '...';

    if (selectedDate) {
      const d = new Date(selectedDate.date);
      displayMonthName = d.toLocaleString('default', { month: 'long' });
      displayYear = d.getFullYear();
      displayGujMonth = selectedDate.gujarati.month_name;
      displayVikramSamvat = selectedDate.gujarati.vikram_samvat;
    } else {
      const validDay = calendarData.find(d => d !== null);
      if (validDay) {
        displayGujMonth = validDay.gujarati.month_name;
        displayVikramSamvat = validDay.gujarati.vikram_samvat;
      }
      displayMonthName = new Date(currentYear, currentMonth - 1).toLocaleString(
        'default',
        { month: 'long' },
      );
    }

    return (
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              {displayMonthName} {displayYear}
            </Text>
            <Text style={styles.headerSubtitle}>
              {displayGujMonth} - Vikram Samvat {displayVikramSamvat}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const renderDay = useCallback(
    ({ item }: { item: CalendarDay | null }) => {
      return (
        <CalendarDayCell
          item={item}
          isSelected={selectedDate?.date === item?.date}
          isToday={item?.date === todayStr}
          onPress={handleDateSelect}
        />
      );
    },
    [selectedDate, handleDateSelect, todayStr],
  );

  const renderDetails = useCallback(() => {
    return (
      <DayDetails
        selectedDate={selectedDate}
        choghadiyaData={choghadiyaData}
        cityName={cityName}
      />
    );
  }, [selectedDate, choghadiyaData, cityName]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderScrollableHeader = () => (
    <View>
      {renderHeader()}
      <View style={styles.weekRow}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDayContainer}>
            <Text style={styles.weekDayText}>{day}</Text>
            <View style={styles.weekDayUnderline} />
          </View>
        ))}
      </View>
    </View>
  );

  // Wait for location before showing main content unless denied
  useEffect(() => {
    if (locationData && loading) {
      fetchCalendar(); // Only fetch if we have location
    } else if (!locationData) {
      setLoading(false); // Stop loading if no location (so we can show denied view)
    }
  }, [locationData, fetchCalendar]);

  // Original fetchCalendar effect handles the location update triggers
  useEffect(() => {
    if (location) {
      setSelectedDate(null);
      setChoghadiyaData([]);
      fetchCalendar();
    }
  }, [currentMonth, currentYear, location, fetchCalendar]);

  // Fetch city name when location changes
  useEffect(() => {
    const fetchCity = async () => {
      if (location) {
        const city = await getCityName(location.lat, location.lon);
        setCityName(city);
      }
    };
    fetchCity();
  }, [location]);

  if (!locationData && !loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: inset.top }]}>
        <StatusBar barStyle="dark-content" />
        <UserCustomHeader title={t('panchang')} />
        <PermissionDeniedView
          onRetry={refreshLocation}
          isPermanent={
            permissionStatus === 'denied' || permissionStatus === 'blocked'
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: inset.top }]}>
      <StatusBar barStyle="dark-content" />
      <CustomeLoader loading={loading || detailsLoading} />
      <UserCustomHeader title={t('panchang')} />
      <View style={styles.flexGrow}>
        {!loading && (
          <GestureDetector gesture={panGesture}>
            <FlatList
              data={calendarData}
              renderItem={renderDay}
              ListHeaderComponent={renderScrollableHeader}
              keyExtractor={(item, index) =>
                item ? item.date : `empty-${index}`
              }
              numColumns={7}
              contentContainerStyle={styles.grid}
              ListFooterComponent={renderDetails}
              removeClippedSubviews={true} // Performance optimization
              initialNumToRender={42} // Render full month at once usually
              maxToRenderPerBatch={42}
            />
          </GestureDetector>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    display: 'none', // Removed, keeping for safety if referenced elsewhere or just delete
  },
  headerTitle: {
    fontSize: 28,
    color: COLORS.textPrimary,
    fontFamily: Fonts.Sen_Bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontFamily: Fonts.Sen_Medium,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  weekDayContainer: {
    alignItems: 'center',
    width: CELL_WIDTH,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  weekDayUnderline: {
    width: '80%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  grid: {
    paddingHorizontal: 8,
  },
});

export default CalendarScreen;
