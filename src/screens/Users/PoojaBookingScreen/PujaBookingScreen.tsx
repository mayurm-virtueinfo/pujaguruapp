import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import Calendar from '../../../components/Calendar';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import PanditjiSelectionModal from '../../../components/PanditjiSelectionModal';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {
  getMuhrat,
  getPanditji,
  getPanditAvailability,
  postAutoBooking,
} from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';
import PrimaryButton from '../../../components/PrimaryButton';
import { translateData } from '../../../utils/TranslateData';
import CustomModal from '../../../components/CustomModal';

const formatDateYYYYMMDD = (date: Date | string) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date string in formatDateYYYYMMDD:', date);
      return formatDateYYYYMMDD(new Date());
    }
    date = parsedDate;
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('Invalid date object in formatDateYYYYMMDD:', date);
    return formatDateYYYYMMDD(new Date());
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateInPast = (dateStr: string) => {
  if (!dateStr) return false;
  const todayStr = formatDateYYYYMMDD(new Date());
  return dateStr < todayStr;
};

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const todayStr = formatDateYYYYMMDD(new Date());
  return dateStr === todayStr;
};

const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();

  const ampmMatch = trimmed.match(/^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/);
  if (!ampmMatch) return null;
  let hours = parseInt(ampmMatch[1], 10);
  const minutes = parseInt(ampmMatch[2], 10);
  const meridian = ampmMatch[3]?.toLowerCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (meridian) {
    // Convert to 24h
    if (meridian === 'pm' && hours !== 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

function addDaysToDate(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateYYYYMMDD(d);
}

// Adds is_next_day logic for "booking_date"
function shouldSlotSetIsNextDay(slot: any): boolean {
  return slot && typeof slot.is_next_day === 'boolean'
    ? slot.is_next_day
    : false;
}

const PujaBookingScreen: React.FC = () => {
  const route = useRoute();
  const {
    poojaId,
    samagri_required,
    address,
    tirth,
    poojaName,
    poojaDescription,
    puja_image,
    puja_name,
    price,
    selectTirthPlaceName,
    selectAddressName,
    panditId,
    panditName,
    panditImage,
    description,
    selectedAddressLatitude,
    selectedAddressLongitude,
  } = route?.params as any;

  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const { showErrorToast } = useCommonToast();

  const [translatedPoojaName, setTranslatedPoojaName] = useState<string>(
    poojaName || '',
  );
  const [translatedPoojaDescription, setTranslatedPoojaDescription] =
    useState<string>(poojaDescription || '');

  useEffect(() => {
    let isMounted = true;
    const translatePoojaFields = async () => {
      if (currentLanguage === 'en') {
        if (isMounted) {
          setTranslatedPoojaName(poojaName || '');
          setTranslatedPoojaDescription(poojaDescription || '');
        }
        return;
      }
      try {
        const result = (await translateData(
          [{ poojaName, poojaDescription }],
          currentLanguage,
          ['poojaName', 'poojaDescription'],
        )) as Array<{ poojaName: string; poojaDescription: string }>;
        if (isMounted) {
          setTranslatedPoojaName(result[0]?.poojaName || poojaName || '');
          setTranslatedPoojaDescription(
            result[0]?.poojaDescription || poojaDescription || '',
          );
        }
      } catch {
        if (isMounted) {
          setTranslatedPoojaName(poojaName || '');
          setTranslatedPoojaDescription(poojaDescription || '');
        }
      }
    };
    translatePoojaFields();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage, poojaName, poojaDescription]);

  const navigation =
    useNavigation<StackNavigationProp<UserPoojaListParamList>>();

  const today = new Date();

  const [translatedDescription, setTranslatedDescription] = useState<string>(
    description || '',
  );

  useEffect(() => {
    let isMounted = true;
    const translateDescription = async () => {
      if (currentLanguage === 'en' || !description) {
        if (isMounted) setTranslatedDescription(description || '');
        return;
      }
      try {
        const result = (await translateData(
          [{ description }],
          currentLanguage,
          ['description'],
        )) as Array<{ description: string }>;
        if (isMounted)
          setTranslatedDescription(result[0]?.description || description || '');
      } catch {
        if (isMounted) setTranslatedDescription(description || '');
      }
    };
    translateDescription();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage, description]);

  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedSlotObj, setSelectedSlotObj] = useState<any>(null);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [selectedDateString, setSelectedDateString] = useState<string>(
    formatDateYYYYMMDD(today),
  );
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${today.toLocaleString('default', {
      month: 'long',
    })} ${today.getFullYear()}`,
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [panditjiSelection, setPanditjiSelection] = useState<
    'automatic' | 'manual'
  >('automatic');
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<any>(null);
  const [muhurats, setMuhurats] = useState<any[]>([]);
  const [originalMuhurats, setOriginalMuhurats] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);
  const insets = useSafeAreaInsets();
  const [customModalVisible, setCustomModalVisible] = useState<boolean>(false);
  const [customModalTitle, setCustomModalTitle] = useState<string>('');
  const [customModalMessage, setCustomModalMessage] = useState<string>('');

  const translationCacheRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (panditId) {
      fetchPanditAvailableDate();
    }
  }, [panditId]);

  const fetchLocation = async () => {
    try {
      const location = await AsyncStorage.getItem(AppConstant.LOCATION);
      if (location) {
        const parsedLocation = JSON.parse(location);
        setLocation(parsedLocation);
      }
    } catch (error) {
      console.error('Error fetching  location ::', error);
    }
  };

  const fetchPanditAvailableDate = async () => {
    try {
      setLoading(true);

      const response = await getPanditAvailability(panditId);

      const Data = response?.data;

      if (Data && Array.isArray(Data)) {
        // Get all available dates from the response
        const availableDatesList = Data.filter(
          (item: any) => item.is_available && item.date,
        ).map((item: any) => item.date);

        if (availableDatesList.length > 0) {
          setAvailableDates(availableDatesList);

          const todayFormatted = formatDateYYYYMMDD(new Date());
          const defaultDate = availableDatesList.includes(todayFormatted)
            ? todayFormatted
            : availableDatesList[0];

          setSelectedDateString(defaultDate);
          const parsedDate = new Date(defaultDate);
          setSelectedDate(parsedDate.getDate());
          setCurrentMonth(
            `${parsedDate.toLocaleString('default', {
              month: 'long',
            })} ${parsedDate.getFullYear()}`,
          );
        } else {
          setAvailableDates(null);
          showErrorToast(
            t('no_available_date_for_pandit') ||
              'No available date for selected pandit.',
          );
        }
      } else {
        setAvailableDates(null);
        showErrorToast(
          t('no_available_date_for_pandit') ||
            'No available date for selected pandit.',
        );
      }
    } catch (error: any) {
      setAvailableDates(null);
      showErrorToast(
        error?.message ||
          t('no_available_date_for_pandit') ||
          'No available date for selected pandit.',
      );
    } finally {
      setLoading(false);
    }
  };

  const postPujaBookingData = async (
    data: any,
    latitude: string,
    longitude: string,
  ) => {
    setLoading(true);
    try {
      const response = await postAutoBooking(data, latitude, longitude);
      return response;
    } catch (error: any) {
      showErrorToast(error?.response?.data?.message || 'Failed to book puja');
    } finally {
      setLoading(false);
    }
  };

  const fetchMuhurat = useCallback(
    async (dateString?: string) => {
      try {
        setLoading(true);
        const dateToFetch = formatDateYYYYMMDD(dateString || today);
        const response = await getMuhrat(
          dateToFetch,
          location?.latitude,
          location?.longitude,
        );
        if (response && Array.isArray(response.choghadiya)) {
          setOriginalMuhurats(response.choghadiya);

          const translated: any = await translateData(
            response.choghadiya,
            currentLanguage,
            ['type'],
          );
          const cacheKey = `${currentLanguage}_${dateToFetch}`;
          const cachedData = translationCacheRef.current.get(cacheKey);

          if (cachedData) {
            // We NEVER show all muhurats for today, always only show future slots.
            let result = cachedData;
            if (dateToFetch === formatDateYYYYMMDD(new Date())) {
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              result = cachedData.filter((slot: any) => {
                const startMinutes = parseTimeToMinutes(slot.start);
                return startMinutes !== null && startMinutes > nowMinutes;
              });
            }
            setMuhurats(result);
            setLoading(false);
            return;
          }

          translationCacheRef.current.set(cacheKey, translated);

          // -- Always for "today", show only future slots, never all --
          let filteredMuhurats = translated;
          if (dateToFetch === formatDateYYYYMMDD(new Date())) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            filteredMuhurats = translated.filter((slot: any) => {
              const startMinutes = parseTimeToMinutes(slot.start);
              return startMinutes !== null && startMinutes > nowMinutes;
            });
          }
          setMuhurats(filteredMuhurats);
        } else {
          setMuhurats([]);
          setOriginalMuhurats([]);
        }
      } catch (error: any) {
        showErrorToast(error);
        setMuhurats([]);
        setOriginalMuhurats([]);
      } finally {
        setLoading(false);
      }
    },
    [currentLanguage, location],
  );

  // Always fetch muhurat for selectedDateString, never show all muhurats for today
  useEffect(() => {
    if (
      location &&
      (!panditId ||
        (panditId &&
          availableDates &&
          availableDates.includes(selectedDateString)))
    ) {
      fetchMuhurat(selectedDateString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateString, location, availableDates, panditId, fetchMuhurat]);

  const handleSlotSelect = (slot: any) => {
    const slotKey = `${slot.start}_${slot.end}_${slot.type}`;
    if (selectedSlot === slotKey) {
      setSelectedSlot('');
      setSelectedSlotObj(null);
      return;
    }
    setSelectedSlot(slotKey);
    setSelectedSlotObj(slot);
  };

  // The booking date may be next day for certain muhurat slots
  function getBookingDateWithNextDay(
    selectedDateString: string,
    slotObj: any,
  ): string {
    const isNextDay = shouldSlotSetIsNextDay(slotObj);
    if (isNextDay) {
      return addDaysToDate(selectedDateString, 1);
    }
    return formatDateYYYYMMDD(selectedDateString);
  }

  const handleNextButtonPress = async () => {
    if (!selectedDateString) {
      showErrorToast(t('please_select_date') || 'Please select a date.');
      return;
    }
    if (!selectedSlot) {
      showErrorToast(
        t('please_select_muhurat_slot') || 'Please select a muhurat slot.',
      );
      return;
    }
    // Use is_next_day logic for booking_date
    let selectedDateISO = '';
    if (!selectedSlotObj) {
      selectedDateISO = formatDateYYYYMMDD(selectedDateString || today);
    } else {
      selectedDateISO = getBookingDateWithNextDay(
        selectedDateString,
        selectedSlotObj,
      );
    }

    if (isDateInPast(selectedDateISO)) {
      showErrorToast(
        t('cannot_select_past_date') || 'You cannot select a past date.',
      );
      return;
    }

    let muhuratTime = '';
    let muhuratType = '';
    if (selectedSlotObj) {
      muhuratTime = `${selectedSlotObj.start} - ${selectedSlotObj.end}`;
      const originalSlot = originalMuhurats.find(
        slot =>
          slot.start === selectedSlotObj.start &&
          slot.end === selectedSlotObj.end,
      );
      muhuratType = originalSlot ? originalSlot.type : selectedSlotObj.type;
    }

    if (isToday(selectedDateString) && selectedSlotObj) {
      const startMinutes = parseTimeToMinutes(selectedSlotObj.start);
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes !== null && startMinutes <= nowMinutes) {
        showErrorToast(
          t('muhurat_time_passed') ||
            'Selected muhurat has already passed. Choose a future slot.',
        );
        return;
      }
      if (startMinutes !== null && startMinutes < nowMinutes + 120) {
        showErrorToast(
          t('muhurat_time_must_be_2_hours_later') ||
            'Please select a muhurat slot that starts at least 2 hours from now. This allows enough time for preparation and arrival.',
        );
        return;
      }
    }

    if (panditId) {
      const data = {
        pooja: poojaId,
        assignment_mode: 2,
        samagri_required: samagri_required,
        address: address,
        tirth_place: tirth,
        booking_date: selectedDateISO,
        muhurat_time: muhuratTime,
        muhurat_type: muhuratType,
        pandit: panditId,
        long_distance: false,
      };
      if (data) {
        const response: any = await postPujaBookingData(
          data,
          selectedAddressLatitude,
          selectedAddressLongitude,
        );
        if (response) {
          navigation.navigate('PaymentScreen', {
            poojaId: poojaId,
            samagri_required: samagri_required,
            address: address,
            tirth: tirth,
            booking_date: selectedDateISO,
            muhurat_time: muhuratTime,
            muhurat_type: muhuratType,
            notes: additionalNotes,
            puja_image: puja_image,
            puja_name: puja_name,
            price: price,
            selectAddress: selectTirthPlaceName || selectAddressName,
            booking_Id: response?.data?.booking_id,
            pandit: panditId,
            panditName: panditName,
            panditImage: panditImage,
            AutoModeSelection: false,
            poojaDescription: poojaDescription,
          });
        }
      }
      return;
    }
    setModalVisible(true);
  };

  const handlePanditjiSelectionModalClose = () => {
    setModalVisible(false);
  };

  const handlePanditjiSelectionConfirm = async (
    selection: 'automatic' | 'manual',
  ) => {
    setPanditjiSelection(selection);
    setModalVisible(false);
    // Use is_next_day logic for booking_date
    let selectedDateISO = '';
    if (!selectedSlotObj) {
      selectedDateISO = formatDateYYYYMMDD(selectedDateString || today);
    } else {
      selectedDateISO = getBookingDateWithNextDay(
        selectedDateString,
        selectedSlotObj,
      );
    }
    let muhuratTime = '';
    let muhuratType = '';
    if (selectedSlotObj) {
      muhuratTime = `${selectedSlotObj.start} - ${selectedSlotObj.end}`;
      const originalSlot = originalMuhurats.find(
        slot =>
          slot.start === selectedSlotObj.start &&
          slot.end === selectedSlotObj.end,
      );
      muhuratType = originalSlot ? originalSlot.type : selectedSlotObj.type;
    }
    if (!selectedDateISO) {
      showErrorToast(t('please_select_date') || 'Please select a date.');
      return;
    }
    if (!selectedSlot) {
      showErrorToast(
        t('please_select_muhurat_slot') || 'Please select a muhurat slot.',
      );
      return;
    }
    if (isDateInPast(selectedDateISO)) {
      showErrorToast(
        t('cannot_select_past_date') || 'You cannot select a past date.',
      );
      return;
    }
    if (isToday(selectedDateString) && selectedSlotObj) {
      const startMinutes = parseTimeToMinutes(selectedSlotObj.start);
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes !== null && startMinutes <= nowMinutes) {
        showErrorToast(
          t('muhurat_time_passed') ||
            'Selected muhurat has already passed. Choose a future slot.',
        );
        return;
      }
    }

    const navigationParams: any = {
      poojaId: poojaId,
      samagri_required: samagri_required,
      address: address,
      tirth: tirth,
      booking_date: selectedDateISO,
      muhurat_time: muhuratTime,
      muhurat_type: muhuratType,
      notes: additionalNotes,
      puja_image: puja_image,
      puja_name: puja_name,
      price: price,
      selectAddress: selectTirthPlaceName || selectAddressName,
      AutoModeSelection: false,
      selectedAddressLatitude: selectedAddressLatitude,
      selectedAddressLongitude: selectedAddressLongitude,
      poojaDescription: poojaDescription,
    };
    if (selection === 'automatic') {
      const data = {
        pooja: poojaId,
        assignment_mode: 1,
        samagri_required: samagri_required,
        address: address,
        tirth_place: tirth,
        booking_date: selectedDateISO,
        muhurat_time: muhuratTime,
        muhurat_type: muhuratType,
        long_distance: false,
      };

      if (data) {
        const response: any = await postPujaBookingData(
          data,
          selectedAddressLatitude,
          selectedAddressLongitude,
        );
        if (response) {
          const autoBookingEnabled = response?.auto_booking_enabled;
          const autoBookingMessage = response?.auto_booking_message;

          if (autoBookingEnabled === false) {
            setCustomModalTitle(
              t('feature_coming_soon') || 'Feature Coming Soon',
            );
            setCustomModalMessage(autoBookingMessage);
            setCustomModalVisible(true);
          } else {
            navigation.navigate('PaymentScreen', {
              poojaId: poojaId,
              samagri_required: samagri_required,
              address: address,
              tirth: tirth,
              booking_date: selectedDateISO,
              muhurat_time: muhuratTime,
              muhurat_type: muhuratType,
              notes: additionalNotes,
              puja_image: puja_image,
              puja_name: puja_name,
              price: price,
              selectAddress: selectTirthPlaceName || selectAddressName,
              booking_Id: response?.data?.booking_id,
              AutoModeSelection: true,
              poojaDescription: poojaDescription,
            });
          }
        }
      }
    } else if (selection === 'manual') {
      navigation.navigate('SelectPanditjiScreen', navigationParams);
    }
  };

  const handleCustomModalConfirm = () => {
    setCustomModalVisible(false);
    setModalVisible(true);
  };

  const renderMuhuratSlots = () => (
    <View style={styles.slotsContainer}>
      <Text style={styles.slotsTitle}>{t('select_muhurat_time_slot')}</Text>
      {loading ? (
        <View style={styles.slotsListContainer}>
          <Text>Muhurat Loading...</Text>
        </View>
      ) : (
        <View style={[styles.slotsListContainer, THEMESHADOW.shadow]}>
          {muhurats.map((slot, index) => {
            const slotKey = `${slot.start}_${slot.end}_${slot.type}`;
            const isSelected = selectedSlot === slotKey;
            // is_next_day presentation
            const isNextDay = shouldSlotSetIsNextDay(slot);

            // Calculate which date the booking would be
            const shownBookingDate = isNextDay
              ? addDaysToDate(selectedDateString, 1)
              : formatDateYYYYMMDD(selectedDateString);

            return (
              <View key={slotKey}>
                <TouchableOpacity
                  style={styles.slotItem}
                  onPress={() => handleSlotSelect(slot)}
                  disabled={
                    panditId &&
                    availableDates &&
                    !availableDates.includes(selectedDateString)
                  }
                >
                  <View style={styles.slotContent}>
                    <View style={styles.slotTextContainer}>
                      <Text style={styles.slotName}>{slot.type}</Text>
                      <Text style={styles.slotTime}>
                        {slot.start} - {slot.end}{' '}
                        <Text
                          style={{
                            color: COLORS.primaryTextDark,
                            fontSize: moderateScale(12),
                          }}
                        >
                          {isNextDay && (
                            <>
                              {'\n'}
                              {t('pooja_will_be_on') || 'Pooja on'}{' '}
                              {new Date(shownBookingDate).toLocaleDateString(
                                'en-IN',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                },
                              )}
                            </>
                          )}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.slotSelection}>
                      <Ionicons
                        name={
                          isSelected
                            ? 'checkmark-circle-outline'
                            : 'ellipse-outline'
                        }
                        size={24}
                        color={isSelected ? COLORS.gradientEnd : '#E4E8E9'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                {index < muhurats.length - 1 && (
                  <View style={styles.slotDivider} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const calendarProps =
    panditId && availableDates && availableDates.length > 0
      ? {
          date: selectedDate,
          month: currentMonth,
          onDateSelect: (dateString: string) => {
            if (!availableDates.includes(dateString)) {
              showErrorToast(
                t('only_this_date_available') ||
                  'Only available dates can be selected for this pandit.',
              );
              return;
            }
            const parsedDate = new Date(dateString);
            setSelectedDate(parsedDate.getDate());
            setSelectedDateString(dateString);
            setSelectedSlot('');
            setSelectedSlotObj(null);
            setMuhurats([]);
            fetchMuhurat(dateString);
          },
          onMonthChange: () => {},
          selectableDates: availableDates,
          disableMonthChange: true,
        }
      : {
          date: selectedDate,
          month: currentMonth,
          onDateSelect: (dateString: string) => {
            if (
              !dateString ||
              typeof dateString !== 'string' ||
              !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
            ) {
              showErrorToast(
                t('please_select_date') || 'Please select a valid date.',
              );
              return;
            }
            const parsedDate = new Date(dateString);
            if (isNaN(parsedDate.getTime())) {
              showErrorToast(
                t('please_select_date') || 'Please select a valid date.',
              );
              return;
            }
            setSelectedDate(parsedDate.getDate());
            setSelectedDateString(dateString);
            setSelectedSlot('');
            setSelectedSlotObj(null);
            setMuhurats([]);
            setCurrentMonth(
              `${parsedDate.toLocaleString('default', {
                month: 'long',
              })} ${parsedDate.getFullYear()}`,
            );
            if (!location) {
              showErrorToast(
                t('location_not_found') ||
                  'Location not found. Please set your location first.',
              );
            }
            fetchMuhurat(dateString);
          },
          onMonthChange: (direction: 'prev' | 'next') => {
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
            setCurrentMonth(`${newMonthName} ${newYear}`);
            setSelectedDate(1);
            const newDate = new Date(newYear, newMonthIdx, 1);
            const formattedDate = formatDateYYYYMMDD(newDate);
            setSelectedDateString(formattedDate);
            setSelectedSlot('');
            setSelectedSlotObj(null);
            setMuhurats([]);
            fetchMuhurat(formattedDate);
          },
        };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.flex1}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.description}>{translatedDescription}</Text>
            <View style={[styles.pujaPlaceContainer, THEMESHADOW.shadow]}>
              <View style={styles.pujaPlaceContent}>
                <View style={styles.pujaPlaceTextContainer}>
                  <Text style={styles.pujaPlaceLabel}>{t('puja_place')}</Text>
                  <Text style={styles.pujaPlaceValue}>
                    {translatedPoojaName}: {translatedPoojaDescription}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={COLORS.gradientEnd}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Calendar {...calendarProps} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: verticalScale(12),
              }}
            >
              {/* Current date legend */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: COLORS.primaryBackgroundButton,
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: COLORS.primaryBackgroundButton,
                }}
              />
              <Text
                style={{
                  fontSize: moderateScale(12),
                  color: COLORS.primaryTextDark,
                  marginRight: 16,
                }}
              >
                {t('current_date')}
              </Text>
              {panditId && (
                <>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1,
                      borderColor: COLORS.gradientEnd,
                      marginRight: 6,
                      backgroundColor: '#fff',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: moderateScale(12),
                      color: COLORS.primaryTextDark,
                    }}
                  >
                    {t('available_date')}
                  </Text>
                </>
              )}
            </View>
            {renderMuhuratSlots()}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>{t('additional_notes')}</Text>
              <TextInput
                style={styles.notesInput}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                placeholder={t('please_arrange_for_flowers')}
                placeholderTextColor={COLORS.inputLabelText}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          <View style={styles.bottomButtonContainerFixed}>
            <PrimaryButton title={t('next')} onPress={handleNextButtonPress} />
          </View>
        </View>
      </KeyboardAvoidingView>

      <PanditjiSelectionModal
        visible={modalVisible}
        onClose={handlePanditjiSelectionModalClose}
        onConfirm={handlePanditjiSelectionConfirm}
        initialSelection={panditjiSelection}
      />
      <CustomModal
        visible={customModalVisible}
        title={customModalTitle}
        message={customModalMessage}
        onConfirm={handleCustomModalConfirm}
        onCancel={() => setCustomModalVisible(false)}
        confirmText={t('ok') || 'OK'}
        cancelText={t('cancel') || 'Cancel'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flex1: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.pujaBackground,
  },
  scrollContent: {
    padding: moderateScale(24),
    paddingBottom: verticalScale(50),
  },
  content: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    marginBottom: 0,
    padding: moderateScale(24),
  },
  description: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(24),
  },
  pujaPlaceContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(24),
  },
  pujaPlaceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pujaPlaceTextContainer: {
    flex: 1,
  },
  pujaPlaceLabel: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
    marginBottom: verticalScale(4),
  },
  pujaPlaceValue: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  editButton: {
    padding: moderateScale(8),
  },

  slotsContainer: {
    marginBottom: verticalScale(24),
  },
  slotsTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(16),
  },
  slotsListContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
  },
  slotItem: {
    paddingVertical: verticalScale(12),
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTextContainer: {
    flex: 1,
  },
  slotName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(4),
  },
  slotTime: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: '#8A8A8A',
  },
  slotSelection: {
    padding: moderateScale(4),
  },
  slotDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginVertical: verticalScale(4),
  },
  notesContainer: {
    marginBottom: verticalScale(24),
  },
  notesLabel: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: '#6C7278',
    marginBottom: verticalScale(8),
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E4E8E9',
    padding: moderateScale(14),
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    minHeight: verticalScale(100),
    textAlignVertical: 'top',
  },
  bottomButtonContainerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: moderateScale(24),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(24) : verticalScale(16),
    backgroundColor: COLORS.pujaBackground,
    zIndex: 10,
  },
  nextButton: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
  },
});

export default PujaBookingScreen;
