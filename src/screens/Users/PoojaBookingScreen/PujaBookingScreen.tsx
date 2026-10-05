import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  COLORS,
  COMMON_LIST_STYLE,
} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import Calendar, {
  MONTH_NAMES,
  getMonthYearFromString,
} from '../../../components/Calendar';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import PanditjiSelectionModal from '../../../components/PanditjiSelectionModal';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {
  getMuhrat,
  getPanditAvailability,
  postAutoBooking,
  MuhuratSlot,
  MuhuratResponse,
  PanditAvailabilityResponse,
  AutoBookingRequestPayload,
  AutoBookingResponse,
} from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';
import PrimaryButton from '../../../components/PrimaryButton';
import { translateData } from '../../../utils/TranslateData';
import CustomModal from '../../../components/CustomModal';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { StackNavigationProp } from '@react-navigation/stack';

export interface PujaBookingRouteParams {
  poojaId: string | number;
  samagri_required: boolean;
  address?: string | number | null;
  tirth?: string | number | null;
  poojaName?: string;
  poojaDescription?: string;
  puja_image?: string;
  puja_name?: string;
  price?: string | number;
  selectTirthPlaceName?: string;
  selectAddressName?: string;
  panditId?: string | number;
  panditName?: string;
  panditImage?: string;
  description?: string;
  selectedAddressLatitude?: string;
  selectedAddressLongitude?: string;
}

interface StoredLocation {
  latitude?: string | number;
  longitude?: string | number;
  [key: string]: any;
}

const formatDateYYYYMMDD = (date: Date | string): string => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return formatDateYYYYMMDD(new Date());
    }
    date = parsedDate;
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return formatDateYYYYMMDD(new Date());
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateInPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const todayStr = formatDateYYYYMMDD(new Date());
  return dateStr < todayStr;
};

const isToday = (dateStr: string): boolean => {
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
    if (meridian === 'pm' && hours !== 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateYYYYMMDD(d);
}

function shouldSlotSetIsNextDay(slot: MuhuratSlot | null | undefined): boolean {
  return slot && typeof slot.is_next_day === 'boolean' ? slot.is_next_day : false;
}

const getMuhuratAuspiciousBadge = (type: string) => {
  const norm = (type || '').toLowerCase();
  if (norm.includes('amrit') || norm.includes('shubh') || norm.includes('good')) {
    return {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#065F46',
      icon: 'sparkles' as const,
      label: 'Auspicious',
    };
  }
  if (norm.includes('labh') || norm.includes('gain')) {
    return {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      icon: 'star' as const,
      label: 'Beneficial',
    };
  }
  if (norm.includes('chal')) {
    return {
      bg: '#F3F4F6',
      border: '#E5E7EB',
      text: '#4B5563',
      icon: 'time-outline' as const,
      label: 'Neutral',
    };
  }
  return {
    bg: '#F9FAFB',
    border: '#E5E7EB',
    text: '#4B5563',
    icon: 'time-outline' as const,
    label: 'Muhurat',
  };
};

const PujaBookingScreen: React.FC = () => {
  const route = useRoute();
  const routeParams = (route?.params as PujaBookingRouteParams) || {};
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
  } = routeParams;

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const { showErrorToast } = useCommonToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<UserPoojaListParamList>>();

  const initialDateStr = useMemo(() => formatDateYYYYMMDD(new Date()), []);
  const initialDateObj = useMemo(() => new Date(), []);

  const [translatedPoojaName, setTranslatedPoojaName] = useState<string>(
    poojaName || '',
  );
  const [translatedPoojaDescription, setTranslatedPoojaDescription] =
    useState<string>(poojaDescription || '');
  const [translatedDescription, setTranslatedDescription] = useState<string>(
    description || '',
  );

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

  useEffect(() => {
    let isMounted = true;
    const translateDesc = async () => {
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
    translateDesc();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage, description]);

  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedSlotObj, setSelectedSlotObj] = useState<MuhuratSlot | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<number>(initialDateObj.getDate());
  const [selectedDateString, setSelectedDateString] = useState<string>(
    panditId ? '' : initialDateStr,
  );
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${initialDateObj.toLocaleString('default', {
      month: 'long',
    })} ${initialDateObj.getFullYear()}`,
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [panditjiSelection, setPanditjiSelection] = useState<'automatic' | 'manual'>('automatic');
  const [loading, setLoading] = useState<boolean>(false);
  const [muhuratLoading, setMuhuratLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [muhurats, setMuhurats] = useState<MuhuratSlot[]>([]);
  const [originalMuhurats, setOriginalMuhurats] = useState<MuhuratSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState<boolean>(false);
  const [customModalTitle, setCustomModalTitle] = useState<string>('');
  const [customModalMessage, setCustomModalMessage] = useState<string>('');

  const translationCacheRef = useRef<Map<string, MuhuratSlot[]>>(new Map());
  const lastFetchedKeyRef = useRef<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [isNotesFocused, setIsNotesFocused] = useState<boolean>(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const effectiveLat =
    location?.latitude != null && location.latitude !== ''
      ? String(location.latitude)
      : selectedAddressLatitude
      ? String(selectedAddressLatitude)
      : '';
  const effectiveLng =
    location?.longitude != null && location.longitude !== ''
      ? String(location.longitude)
      : selectedAddressLongitude
      ? String(selectedAddressLongitude)
      : '';

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
      const storedLocation = await AsyncStorage.getItem(AppConstant.LOCATION);
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        setLocation(parsedLocation);
      }
    } catch (error) {
      console.error('Error fetching location ::', error);
    }
  };

  const fetchPanditAvailableDate = async () => {
    if (!panditId) return;
    try {
      setLoading(true);
      const response: PanditAvailabilityResponse = await getPanditAvailability(panditId);
      const data = response?.data;

      if (data && Array.isArray(data)) {
        const availableDatesList = data
          .filter(item => item.is_available && item.date)
          .map(item => item.date);

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
          setAvailableDates([]);
          setSelectedDateString('');
          setMuhurats([]);
          setOriginalMuhurats([]);
          showErrorToast(
            t('no_available_date_for_pandit') ||
              'No available date for selected pandit.',
          );
        }
      } else {
        setAvailableDates([]);
        setSelectedDateString('');
        setMuhurats([]);
        setOriginalMuhurats([]);
        showErrorToast(
          t('no_available_date_for_pandit') ||
            'No available date for selected pandit.',
        );
      }
    } catch (error: any) {
      setAvailableDates([]);
      setSelectedDateString('');
      setMuhurats([]);
      setOriginalMuhurats([]);
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
    data: AutoBookingRequestPayload,
    latitude?: string,
    longitude?: string,
  ): Promise<AutoBookingResponse | undefined> => {
    setLoading(true);
    try {
      const response = await postAutoBooking(data, latitude, longitude);
      return response;
    } catch (error: any) {
      showErrorToast(error?.response?.data?.message || 'Failed to book puja');
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const fetchMuhurat = useCallback(
    async (dateString?: string) => {
      const dateToFetch = formatDateYYYYMMDD(dateString || new Date());

      if (!effectiveLat || !effectiveLng) {
        setMuhuratLoading(false);
        return;
      }

      if (panditId) {
        if (
          !availableDates ||
          availableDates.length === 0 ||
          !availableDates.includes(dateToFetch)
        ) {
          setMuhurats([]);
          setOriginalMuhurats([]);
          setMuhuratLoading(false);
          return;
        }
      }

      const fetchKey = `${dateToFetch}_${effectiveLat}_${effectiveLng}_${currentLanguage}`;
      if (lastFetchedKeyRef.current === fetchKey) {
        return;
      }
      lastFetchedKeyRef.current = fetchKey;

      try {
        setMuhuratLoading(true);

        const cacheKey = `${currentLanguage}_${dateToFetch}`;
        const cachedData = translationCacheRef.current.get(cacheKey);

        if (cachedData) {
          let result = cachedData;
          if (dateToFetch === formatDateYYYYMMDD(new Date())) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            result = cachedData.filter((slot: MuhuratSlot) => {
              const startMinutes = parseTimeToMinutes(slot.start);
              return startMinutes !== null && startMinutes > nowMinutes;
            });
          }
          setMuhurats(result);
          setMuhuratLoading(false);
          return;
        }

        const response: MuhuratResponse = await getMuhrat(
          dateToFetch,
          effectiveLat,
          effectiveLng,
        );

        if (response && Array.isArray(response.choghadiya)) {
          setOriginalMuhurats(response.choghadiya);

          const translated = (await translateData(
            response.choghadiya,
            currentLanguage,
            ['type'],
          )) as MuhuratSlot[];

          translationCacheRef.current.set(cacheKey, translated);

          let filteredMuhurats = translated;
          if (dateToFetch === formatDateYYYYMMDD(new Date())) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            filteredMuhurats = translated.filter((slot: MuhuratSlot) => {
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
        showErrorToast(error?.message || 'Error fetching muhurat');
        setMuhurats([]);
        setOriginalMuhurats([]);
      } finally {
        setMuhuratLoading(false);
      }
    },
    [
      currentLanguage,
      effectiveLat,
      effectiveLng,
      panditId,
      availableDates,
      showErrorToast,
    ],
  );

  useEffect(() => {
    if (
      effectiveLat &&
      effectiveLng &&
      selectedDateString &&
      (!panditId ||
        (panditId &&
          availableDates &&
          availableDates.includes(selectedDateString)))
    ) {
      fetchMuhurat(selectedDateString);
    } else if (
      panditId &&
      (!availableDates ||
        availableDates.length === 0 ||
        !availableDates.includes(selectedDateString))
    ) {
      setMuhurats([]);
      setOriginalMuhurats([]);
      setMuhuratLoading(false);
    }
  }, [
    selectedDateString,
    effectiveLat,
    effectiveLng,
    availableDates,
    panditId,
    fetchMuhurat,
  ]);

  const handleSlotSelect = (slot: MuhuratSlot) => {
    const slotKey = `${slot.start}_${slot.end}_${slot.type}`;
    if (selectedSlot === slotKey) {
      setSelectedSlot('');
      setSelectedSlotObj(null);
      return;
    }
    setSelectedSlot(slotKey);
    setSelectedSlotObj(slot);
  };

  function getBookingDateWithNextDay(
    dateStr: string,
    slotObj: MuhuratSlot | null,
  ): string {
    const isNextDay = shouldSlotSetIsNextDay(slotObj);
    if (isNextDay) {
      return addDaysToDate(dateStr, 1);
    }
    return formatDateYYYYMMDD(dateStr);
  }

  const handleNextButtonPress = async () => {
    if (panditId) {
      if (
        !availableDates ||
        availableDates.length === 0 ||
        !selectedDateString ||
        !availableDates.includes(selectedDateString)
      ) {
        showErrorToast(
          t('no_available_date_for_pandit') || 'No available date for pandit',
        );
        return;
      }
    }
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

    const selectedDateISO = !selectedSlotObj
      ? formatDateYYYYMMDD(selectedDateString || initialDateStr)
      : getBookingDateWithNextDay(selectedDateString, selectedSlotObj);

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
      const data: AutoBookingRequestPayload = {
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

      const response = await postPujaBookingData(
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

    const selectedDateISO = !selectedSlotObj
      ? formatDateYYYYMMDD(selectedDateString || initialDateStr)
      : getBookingDateWithNextDay(selectedDateString, selectedSlotObj);

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
      const data: AutoBookingRequestPayload = {
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

      const response = await postPujaBookingData(
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
          setCustomModalMessage(autoBookingMessage || '');
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
    } else if (selection === 'manual') {
      navigation.navigate('SelectPanditjiScreen', navigationParams);
    }
  };

  const handleCustomModalConfirm = () => {
    setCustomModalVisible(false);
    setModalVisible(true);
  };

  const handleMonthChangeCommon = (
    direction: 'prev' | 'next',
    dateObj?: any,
  ) => {
    let newYear: number;
    let newMonthIdx: number;

    if (
      dateObj &&
      typeof dateObj.month === 'number' &&
      typeof dateObj.year === 'number'
    ) {
      newYear = dateObj.year;
      newMonthIdx = dateObj.month - 1;
    } else {
      const { month: mIdx, year: yNum } = getMonthYearFromString(currentMonth);
      newMonthIdx = mIdx;
      newYear = yNum;
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
    }

    const safeMonthIdx = Math.max(0, Math.min(11, newMonthIdx));
    const newMonthName = MONTH_NAMES[safeMonthIdx];
    setCurrentMonth(`${newMonthName} ${newYear}`);
    return { year: newYear, monthIdx: safeMonthIdx };
  };

  const calendarProps = panditId
    ? {
        date: selectedDate,
        selectedDate: selectedDateString,
        month: currentMonth,
        onDateSelect: (dateString: string) => {
          if (
            !availableDates ||
            availableDates.length === 0 ||
            !availableDates.includes(dateString)
          ) {
            showErrorToast(
              t('no_available_date_for_pandit', 'No available date for selected pandit.'),
            );
            return;
          }
          const parsedDate = new Date(dateString);
          setSelectedDate(parsedDate.getDate());
          setSelectedDateString(dateString);
          setCurrentMonth(
            `${parsedDate.toLocaleString('default', {
              month: 'long',
            })} ${parsedDate.getFullYear()}`,
          );
          setSelectedSlot('');
          setSelectedSlotObj(null);
          setMuhurats([]);
        },
        onMonthChange: (direction: 'prev' | 'next', dateObj?: any) => {
          handleMonthChangeCommon(direction, dateObj);
        },
        selectableDates: availableDates || [],
        disableMonthChange: false,
      }
    : {
        date: selectedDate,
        selectedDate: selectedDateString,
        month: currentMonth,
        onDateSelect: (dateString: string) => {
          if (
            !dateString ||
            typeof dateString !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
          ) {
            showErrorToast(
              t('please_select_date', 'Please select a valid date.'),
            );
            return;
          }
          const parsedDate = new Date(dateString);
          if (isNaN(parsedDate.getTime())) {
            showErrorToast(
              t('please_select_date', 'Please select a valid date.'),
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
          if (!effectiveLat || !effectiveLng) {
            showErrorToast(
              t('location_not_found', 'Location not found. Please set your location first.'),
            );
          }
        },
        onMonthChange: (direction: 'prev' | 'next', dateObj?: any) => {
          const { year: newYear, monthIdx: newMonthIdx } =
            handleMonthChangeCommon(direction, dateObj);
          setSelectedDate(1);
          const formattedDate = `${newYear}-${String(newMonthIdx + 1).padStart(
            2,
            '0',
          )}-01`;
          setSelectedDateString(formattedDate);
          setSelectedSlot('');
          setSelectedSlotObj(null);
          setMuhurats([]);
        },
      };

  const venueTitle = tirth
    ? selectTirthPlaceName || translatedPoojaName || t('tirth_place') || 'Tirth Place'
    : selectAddressName || t('my_place') || 'My Place';

  const venueSubtitle = tirth
    ? translatedPoojaDescription || ''
    : poojaDescription || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />

      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentWrapper}>
              {/* 1. PUJA & VENUE SUMMARY CARD */}
              <View style={[styles.summaryCard, COMMON_LIST_STYLE]}>
                <View style={styles.summaryPujaRow}>
                  {puja_image ? (
                    <Image
                      source={{ uri: puja_image }}
                      style={styles.pujaImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.pujaImagePlaceholder}>
                      <Ionicons
                        name="flame"
                        size={moderateScale(24)}
                        color={COLORS.primary}
                      />
                    </View>
                  )}
                  <View style={styles.pujaInfoCol}>
                    <Text style={styles.pujaTitleText} numberOfLines={1}>
                      {puja_name || translatedDescription || t('pooja')}
                    </Text>

                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.samagriBadge,
                          {
                            backgroundColor: samagri_required
                              ? '#FFFBEB'
                              : '#F3F4F6',
                            borderColor: samagri_required
                              ? '#FDE68A'
                              : '#E5E7EB',
                          },
                        ]}
                      >
                        <Ionicons
                          name={samagri_required ? 'cube' : 'cube-outline'}
                          size={moderateScale(11)}
                          color={samagri_required ? '#D97706' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.samagriBadgeText,
                            {
                              color: samagri_required ? '#B45309' : '#4B5563',
                            },
                          ]}
                        >
                          {samagri_required
                            ? t('with_samagri') || 'With Samagri'
                            : t('without_samagri') || 'Without Samagri'}
                        </Text>
                      </View>

                      {price ? (
                        <View style={styles.priceChip}>
                          <Text style={styles.priceChipText}>₹{price}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Venue Details */}
                <View style={styles.summaryVenueRow}>
                  <View
                    style={[
                      styles.venueIconBox,
                      {
                        backgroundColor: tirth ? '#FFF1ED' : '#EFF6FF',
                        borderColor: tirth ? '#FED7AA' : '#BFDBFE',
                      },
                    ]}
                  >
                    <Ionicons
                      name={tirth ? 'business' : 'home'}
                      size={moderateScale(16)}
                      color={tirth ? '#EA580C' : '#2563EB'}
                    />
                  </View>

                  <View style={styles.venueInfoCol}>
                    <Text style={styles.venueSubtext}>
                      {tirth
                        ? t('tirth_place') || 'Tirth Place (Pilgrimage)'
                        : t('puja_place') || 'Puja Location'}
                    </Text>
                    <Text style={styles.venueTitleText} numberOfLines={1}>
                      {venueTitle}
                    </Text>
                    {venueSubtitle ? (
                      <Text style={styles.venueDescText} numberOfLines={2}>
                        {venueSubtitle}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.changeVenueButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="create-outline"
                      size={moderateScale(13)}
                      color={COLORS.primary}
                    />
                    <Text style={styles.changeVenueButtonText}>
                      {t('change') || 'Change'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. CALENDAR SECTION */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionIconBadge}>
                    <Ionicons
                      name="calendar"
                      size={moderateScale(15)}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>
                    {t('select_booking_date') || 'Select Booking Date'}
                  </Text>
                </View>

                <View style={styles.calendarWrapper}>
                  <Calendar {...calendarProps} />

                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={styles.currentDateIndicator} />
                      <Text style={styles.legendText}>
                        {t('current_date') || 'Today'}
                      </Text>
                    </View>

                    <View style={styles.legendItem}>
                      <View style={styles.selectedDateIndicator} />
                      <Text style={styles.legendText}>
                        {t('selected_date') || 'Selected'}
                      </Text>
                    </View>

                    {panditId ? (
                      <View style={styles.legendItem}>
                        <View style={styles.availableDateIndicator} />
                        <Text style={styles.legendText}>
                          {t('available_date') || 'Available'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* 3. MUHURAT TIME SLOTS */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons
                      name="sunny"
                      size={moderateScale(15)}
                      color="#D97706"
                    />
                  </View>
                  <View style={styles.sectionHeaderCol}>
                    <Text style={styles.sectionHeaderTitle}>
                      {t('select_muhurat_time_slot') || 'Auspicious Muhurat'}
                    </Text>
                    <Text style={styles.sectionHeaderSub}>
                      {t('choose_muhurat_sub') ||
                        'Select the most favorable Vedic choghadiya slot'}
                    </Text>
                  </View>
                </View>

                {muhuratLoading ? (
                  <View style={[styles.loadingMuhuratCard, COMMON_LIST_STYLE]}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingMuhuratText}>
                      {t('fetching_auspicious_muhurats') ||
                        'Fetching auspicious timings...'}
                    </Text>
                  </View>
                ) : muhurats.length === 0 ? (
                  <View style={[styles.emptyMuhuratCard, COMMON_LIST_STYLE]}>
                    <Ionicons
                      name="calendar-outline"
                      size={moderateScale(32)}
                      color="#9CA3AF"
                    />
                    <Text style={styles.emptyMuhuratTitle}>
                      {t('no_muhurat_slots') || 'No Muhurat Slots Available'}
                    </Text>
                    <Text style={styles.emptyMuhuratSub}>
                      {t('no_muhurat_slots_desc') ||
                        'All auspicious slots for this date have passed or none are available. Please select another date.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.slotsGrid}>
                    {muhurats.map((slot) => {
                      const slotKey = `${slot.start}_${slot.end}_${slot.type}`;
                      const isSelected = selectedSlot === slotKey;
                      const isNextDay = shouldSlotSetIsNextDay(slot);
                      const badgeInfo = getMuhuratAuspiciousBadge(slot.type);

                      const shownBookingDate = isNextDay
                        ? addDaysToDate(selectedDateString, 1)
                        : formatDateYYYYMMDD(selectedDateString);

                      return (
                        <TouchableOpacity
                          key={slotKey}
                          style={[
                            styles.slotCard,
                            COMMON_LIST_STYLE,
                            isSelected && styles.slotCardSelected,
                          ]}
                          onPress={() => handleSlotSelect(slot)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.slotMainRow}>
                            <View style={styles.slotClockBadge}>
                              <Ionicons
                                name="time-outline"
                                size={moderateScale(18)}
                                color={isSelected ? COLORS.primary : '#6B7280'}
                              />
                            </View>

                            <View style={styles.slotDetailsCol}>
                              <View style={styles.slotTypeRow}>
                                <Text style={styles.slotTypeName}>
                                  {slot.type}
                                </Text>
                                <View
                                  style={[
                                    styles.slotQualityBadge,
                                    {
                                      backgroundColor: badgeInfo.bg,
                                      borderColor: badgeInfo.border,
                                    },
                                  ]}
                                >
                                  <Ionicons
                                    name={badgeInfo.icon}
                                    size={moderateScale(10)}
                                    color={badgeInfo.text}
                                  />
                                  <Text
                                    style={[
                                      styles.slotQualityText,
                                      { color: badgeInfo.text },
                                    ]}
                                  >
                                    {badgeInfo.label}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.slotTimeRange}>
                                {slot.start} - {slot.end}
                              </Text>
                            </View>

                            <View style={styles.slotRadioWrapper}>
                              <Ionicons
                                name={
                                  isSelected
                                    ? 'checkmark-circle'
                                    : 'ellipse-outline'
                                }
                                size={moderateScale(22)}
                                color={
                                  isSelected ? COLORS.primary : '#D1D5DB'
                                }
                              />
                            </View>
                          </View>

                          {isNextDay && (
                            <View style={styles.nextDayBanner}>
                              <Ionicons
                                name="information-circle"
                                size={moderateScale(13)}
                                color="#D97706"
                              />
                              <Text style={styles.nextDayBannerText}>
                                {t('pooja_will_be_on') || 'Pooja on'}{' '}
                                {new Date(shownBookingDate).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  },
                                )}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 4. ADDITIONAL NOTES */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons
                      name="document-text-outline"
                      size={moderateScale(15)}
                      color="#4B5563"
                    />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>
                    {t('additional_notes') || 'Special Requests & Notes'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.notesCard,
                    COMMON_LIST_STYLE,
                    isNotesFocused && styles.notesCardFocused,
                  ]}
                >
                  <TextInput
                    style={styles.notesInput}
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                    placeholder={
                      t('please_arrange_for_flowers') ||
                      'e.g. Please bring extra flowers, or special sankalp details'
                    }
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    maxLength={300}
                    onFocus={() => {
                      setIsNotesFocused(true);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 250);
                    }}
                    onBlur={() => setIsNotesFocused(false)}
                  />
                  <View style={styles.notesBottomRow}>
                    {isKeyboardVisible ? (
                      <TouchableOpacity
                        style={styles.dismissKeyboardBtn}
                        onPress={() => Keyboard.dismiss()}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={moderateScale(14)}
                          color={COLORS.primary}
                        />
                        <Text style={styles.dismissKeyboardText}>
                          {t('done') || 'Done'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <Text style={styles.notesCharCount}>
                      {additionalNotes.length}/300
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* BOTTOM ACTION BAR */}
          <View
            style={[
              styles.bottomActionBar,
              {
                paddingBottom: isKeyboardVisible
                  ? verticalScale(6)
                  : insets.bottom > 0
                  ? insets.bottom - 6
                  : verticalScale(12),
              },
            ]}
          >
            <PrimaryButton
              title={
                panditId
                  ? t('proceed_to_payment') || 'PROCEED TO PAYMENT'
                  : t('next') || 'NEXT'
              }
              onPress={handleNextButtonPress}
              style={styles.primaryBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

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
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    backgroundColor: COLORS.pujaBackground,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(20),
  },
  contentWrapper: {
    paddingHorizontal: moderateScale(18),
    gap: verticalScale(16),
  },

  // 1. SUMMARY CARD
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  summaryPujaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pujaImage: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F4F6',
  },
  pujaImagePlaceholder: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(12),
    backgroundColor: '#FDF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pujaInfoCol: {
    flex: 1,
    marginLeft: moderateScale(12),
    justifyContent: 'center',
  },
  pujaTitleText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(5),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  samagriBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
    borderWidth: 1,
  },
  samagriBadgeText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_SemiBold,
  },
  priceChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priceChipText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#92400E',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: verticalScale(12),
  },
  summaryVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueIconBox: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  venueInfoCol: {
    flex: 1,
    marginLeft: moderateScale(10),
    marginRight: moderateScale(8),
  },
  venueSubtext: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  venueTitleText: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginTop: verticalScale(1),
  },
  venueDescText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    marginTop: verticalScale(2),
    lineHeight: moderateScale(15),
  },
  changeVenueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  changeVenueButtonText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },

  // 2. SECTION BLOCK & HEADERS
  sectionBlock: {
    gap: verticalScale(10),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  sectionHeaderCol: {
    flex: 1,
  },
  sectionIconBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(8),
    backgroundColor: '#FDF2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  sectionHeaderSub: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    marginTop: verticalScale(1),
  },

  // CALENDAR WRAPPER & LEGEND
  calendarWrapper: {},
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: verticalScale(10),
    backgroundColor: COLORS.white,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    flex: 1,
    justifyContent: 'center',
  },
  currentDateIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: COLORS.primaryBackgroundButton,
    flexShrink: 0,
  },
  selectedDateIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },
  availableDateIndicator: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: COLORS.gradientEnd,
    backgroundColor: COLORS.white,
    flexShrink: 0,
  },
  legendText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flexShrink: 1,
  },

  // 3. MUHURAT SLOTS
  loadingMuhuratCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(8),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  loadingMuhuratText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  emptyMuhuratCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(24),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(6),
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  emptyMuhuratTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
  emptyMuhuratSub: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  slotsGrid: {
    gap: verticalScale(10),
  },
  slotCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(13),
    borderWidth: 1.5,
    borderColor: '#F0ECE6',
  },
  slotCardSelected: {
    borderColor: COLORS.primaryBackgroundButton,
    backgroundColor: '#FFFDF9',
  },
  slotMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotClockBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotDetailsCol: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  slotTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  slotTypeName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  slotQualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    paddingHorizontal: moderateScale(7),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
  },
  slotQualityText: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.Sen_Bold,
    textTransform: 'uppercase',
  },
  slotTimeRange: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
    marginTop: verticalScale(2),
  },
  slotRadioWrapper: {
    marginLeft: moderateScale(8),
  },
  nextDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(8),
  },
  nextDayBannerText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#92400E',
  },

  // 4. NOTES CARD
  notesCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#F0ECE6',
  },
  notesCardFocused: {
    borderColor: COLORS.primaryBackgroundButton,
    backgroundColor: '#FFFDF9',
  },
  notesInput: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    minHeight: verticalScale(70),
    textAlignVertical: 'top',
    padding: 0,
  },
  notesBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(6),
  },
  dismissKeyboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    paddingVertical: verticalScale(2),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: '#FFF5F5',
  },
  dismissKeyboardText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primary,
  },
  notesCharCount: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },

  // BOTTOM ACTION BAR
  bottomActionBar: {
    paddingHorizontal: moderateScale(18),
    paddingTop: verticalScale(6),
    backgroundColor: COLORS.pujaBackground,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryBtn: {
    marginTop: 0,
  },
});

export default PujaBookingScreen;

