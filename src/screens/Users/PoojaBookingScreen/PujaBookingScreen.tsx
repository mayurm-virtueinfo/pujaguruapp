import React, {useEffect, useState} from 'react';
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import Calendar from '../../../components/Calendar';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import PanditjiSelectionModal from '../../../components/PanditjiSelectionModal';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {
  getMuhrat,
  getPanditji,
  getPanditAvailability,
} from '../../../api/apiService';
import {useCommonToast} from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';
import PrimaryButton from '../../../components/PrimaryButton';

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

const PujaBookingScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation =
    useNavigation<StackNavigationProp<UserPoojaListParamList>>();

  const today = new Date();

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
  } = route?.params as any;
  console.log('panditId', panditId);
  const {showErrorToast, showSuccessToast} = useCommonToast();

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
  const [panditjiData, setPanditjiData] = useState({});
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);
  console.log('availableDates', availableDates);
  // If panditId is present, fetch available dates for that pandit
  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (panditId) {
      fetchPanditAvailableDate();
    }
  }, [panditId]);

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
  }, [selectedDateString, location, availableDates, panditId]);

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

  // Fetch available dates for the given panditId and poojaId
  const fetchPanditAvailableDate = async () => {
    try {
      setLoading(true);

      const response = await getPanditAvailability(panditId);

      if (response && Array.isArray(response)) {
        // Get all available dates from the response
        const availableDatesList = response
          .filter((item: any) => item.is_available && item.date)
          .map((item: any) => item.date);

        console.log('All available dates:', availableDatesList);

        if (availableDatesList.length > 0) {
          // Set all available dates as an array
          setAvailableDates(availableDatesList);

          // Set the first available date as selected by default
          const firstAvailable = availableDatesList[0];
          setSelectedDateString(firstAvailable);
          const parsedDate = new Date(firstAvailable);
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
      console.log('error :: ', error?.response?.data);

      showErrorToast(
        error?.message ||
          t('no_available_date_for_pandit') ||
          'No available date for selected pandit.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPanditji = async (
    pooja_id: string,
    latitude: string,
    longitude: string,
    mode: 'auto',
    booking_date: string,
  ) => {
    try {
      setLoading(true);
      const response = await getPanditji(
        pooja_id,
        latitude,
        longitude,
        mode,
        booking_date,
      );
      if (response.success) {
        if (Object.keys(response.data).length === 0) {
          showSuccessToast(response.message);
          return {};
        } else {
          setPanditjiData(response.data);
          return response.data;
        }
      }
      return [];
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to fetch panditji');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchMuhurat = async (dateString?: string) => {
    try {
      setLoading(true);
      const dateToFetch = formatDateYYYYMMDD(dateString || today);
      const response = await getMuhrat(
        dateToFetch,
        location?.latitude,
        location?.longitude,
      );
      if (response && Array.isArray(response.choghadiya)) {
        setMuhurats(response.choghadiya || []);
      } else {
        setMuhurats([]);
      }
    } catch (error: any) {
      showErrorToast(error);
      setMuhurats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(`${slot.start}_${slot.end}_${slot.type}`);
    setSelectedSlotObj(slot);
  };

  // Modified handleNextButtonPress to directly navigate to PaymentScreen if panditId exists
  const handleNextButtonPress = () => {
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

    // Prepare selected date in YYYY-MM-DD format
    let selectedDateISO = selectedDateString;
    if (!selectedDateISO) {
      selectedDateISO = formatDateYYYYMMDD(today);
    } else {
      selectedDateISO = formatDateYYYYMMDD(selectedDateISO);
    }

    // Prepare muhurat time and type
    let muhuratTime = '';
    let muhuratType = '';
    if (selectedSlotObj) {
      muhuratTime = `${selectedSlotObj.start} - ${selectedSlotObj.end}`;
      muhuratType = selectedSlotObj.type;
    }

    // If panditId exists, navigate directly to PaymentScreen
    if (panditId) {
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
        pandit: panditId,
        panditName: panditName,
        panditImage: panditImage,
      });
      return;
    }

    setModalVisible(true);
  };

  const handlePanditjiSelectionModalClose = () => {
    setModalVisible(false);
  };

  const handlePanditjiSelectionConfirm = (
    selection: 'automatic' | 'manual',
  ) => {
    setPanditjiSelection(selection);
    setModalVisible(false);

    // Prepare selected date in YYYY-MM-DD format
    let selectedDateISO = selectedDateString;
    // If selectedDateString is not set, fallback to today
    if (!selectedDateISO) {
      selectedDateISO = formatDateYYYYMMDD(today);
    } else {
      selectedDateISO = formatDateYYYYMMDD(selectedDateISO);
    }

    // Prepare muhurat time and type
    let muhuratTime = '';
    let muhuratType = '';
    if (selectedSlotObj) {
      muhuratTime = `${selectedSlotObj.start} - ${selectedSlotObj.end}`;
      muhuratType = selectedSlotObj.type;
    }

    // Final validation before navigation
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
    };
    if (selection === 'automatic') {
      fetchPanditji(
        poojaId,
        location?.latitude,
        location?.longitude,
        'auto',
        selectedDateISO,
      ).then(data => {
        if (Object.keys(data).length > 0) {
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
            panditjiData: data,
          });
        } else {
          showErrorToast(
            'No panditji available for selected date and location.',
          );
        }
      });
    } else if (selection === 'manual') {
      navigation.navigate('SelectPanditjiScreen', navigationParams);
    }
  };

  const renderMuhuratSlots = () => (
    <View style={styles.slotsContainer}>
      <Text style={styles.slotsTitle}>{t('select_muhurat_time_slot')}</Text>
      <View style={styles.slotsListContainer}>
        {muhurats.map((slot, index) => {
          const slotKey = `${slot.start}_${slot.end}_${slot.type}`;
          const isSelected = selectedSlot === slotKey;
          return (
            <View key={slotKey}>
              <TouchableOpacity
                style={styles.slotItem}
                onPress={() => handleSlotSelect(slot)}
                disabled={
                  panditId &&
                  availableDates &&
                  !availableDates.includes(selectedDateString)
                }>
                <View style={styles.slotContent}>
                  <View style={styles.slotTextContainer}>
                    <Text style={styles.slotName}>{slot.type}</Text>
                    <Text style={styles.slotTime}>
                      {slot.start} - {slot.end}
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
    </View>
  );

  // Calendar props for panditId: only show availableDates as selectable
  const calendarProps =
    panditId && availableDates && availableDates.length > 0
      ? {
          date: new Date(availableDates[0]).getDate(),
          month: `${new Date(availableDates[0]).toLocaleString('default', {
            month: 'long',
          })} ${new Date(availableDates[0]).getFullYear()}`,
          onDateSelect: (dateString: string) => {
            // Only allow selection if dateString is in availableDates
            if (!availableDates.includes(dateString)) {
              showErrorToast(
                t('only_this_date_available') ||
                  'Only available dates can be selected for this pandit.',
              );
              return;
            }
            setSelectedDate(new Date(dateString).getDate());
            setSelectedDateString(dateString);
            setSelectedSlot('');
            setSelectedSlotObj(null);
            setMuhurats([]);
          },
          onMonthChange: () => {}, // Disable month change if all dates are in one month; adjust if needed
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
            setMuhurats([]); // Clear muhurats immediately
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
              {month: 'long'},
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
    <SafeAreaView style={[styles.container]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.flex1}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Puja Description */}
            <Text style={styles.description}>
              Ganesh Chaturthi Pooja is a Hindu festival celebrating the birth
              of Lord Ganesha. It involves elaborate rituals, chanting of
              mantras, and offerings to the deity. This pooja is believed to...
            </Text>

            {/* Puja Place Section */}
            <View style={styles.pujaPlaceContainer}>
              <View style={styles.pujaPlaceContent}>
                <View style={styles.pujaPlaceTextContainer}>
                  <Text style={styles.pujaPlaceLabel}>{t('puja_place')}</Text>
                  <Text style={styles.pujaPlaceValue}>
                    {poojaName}: {poojaDescription}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.goBack()}>
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
              }}>
              {/* Current date legend */}
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#FA1927',
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: '#FA1927',
                }}
              />
              <Text
                style={{
                  fontSize: moderateScale(12),
                  color: COLORS.primaryTextDark,
                  marginRight: 16,
                }}>
                {t('current_date')}
              </Text>
              {/* Available date legend */}
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
                }}>
                {t('available_date')}
              </Text>
            </View>
            {renderMuhuratSlots()}

            {/* Additional Notes Section */}
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
          {/* Next Button at the bottom, fixed, not scrollable */}
          <View style={styles.bottomButtonContainerFixed}>
            <PrimaryButton title={t('next')} onPress={handleNextButtonPress} />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Panditji Selection Modal */}
      <PanditjiSelectionModal
        visible={modalVisible}
        onClose={handlePanditjiSelectionModalClose}
        onConfirm={handlePanditjiSelectionConfirm}
        initialSelection={panditjiSelection}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(24),
    paddingBottom: verticalScale(50),
    backgroundColor: COLORS.pujaBackground,
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
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  pujaPlaceContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  // Remove old bottomButtonContainer, add fixed one
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
    letterSpacing: -0.15,
  },
});

export default PujaBookingScreen;
