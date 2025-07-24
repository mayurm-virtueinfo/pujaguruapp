import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
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
import {getMuhrat} from '../../../api/apiService';
import {useCommonToast} from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';

const formatDateYYYYMMDD = (date: Date | string) => {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    date = new Date(date);
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
  } = route.params as any;

  const {showErrorToast} = useCommonToast();

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
  console.log('selectedSlot', selectedSlot);
  useEffect(() => {
    fetchLocation();
  }, []);

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

  useEffect(() => {
    if (location) {
      fetchMuhurat();
    }
  }, [location]);

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
      }
    } catch (error: any) {
      console.error('Error fetching muhurat:', error);
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(`${slot.start}_${slot.end}_${slot.type}`);
    setSelectedSlotObj(slot);
  };

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
      navigation.navigate('PaymentScreen', navigationParams);
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
                onPress={() => handleSlotSelect(slot)}>
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

  return (
    <SafeAreaView style={[styles.container]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_booking')} showBackButton={true} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {/* Puja Description */}
        <Text style={styles.description}>
          Ganesh Chaturthi Pooja is a Hindu festival celebrating the birth of
          Lord Ganesha. It involves elaborate rituals, chanting of mantras, and
          offerings to the deity. This pooja is believed to...
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

        {/* Calendar Section */}
        <Calendar
          date={selectedDate}
          onDateSelect={dateString => {
            // dateString is expected to be in YYYY-MM-DD
            setSelectedDate(new Date(dateString).getDate());
            setSelectedDateString(formatDateYYYYMMDD(dateString));
            // Clear selected muhurat when date changes
            setSelectedSlot('');
            setSelectedSlotObj(null);
            if (!location) {
              showErrorToast(
                t('location_not_found') ||
                  'Location not found. Please set your location first.',
              );
              return;
            }
            fetchMuhurat(formatDateYYYYMMDD(dateString));
          }}
          month={currentMonth}
          onMonthChange={direction => {
            // Calculate new month/year
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
            // Also update selectedDateString to first of new month in YYYY-MM-DD
            const newDate = new Date(newYear, newMonthIdx, 1);
            const formattedDate = formatDateYYYYMMDD(newDate);
            setSelectedDateString(formattedDate);
            // Clear selected muhurat when month changes
            setSelectedSlot('');
            setSelectedSlotObj(null);
            fetchMuhurat(formattedDate);
          }}
        />

        {/* Muhurat Slots Section */}
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

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextButtonPress}>
          <Text style={styles.nextButtonText}>{t('next')}</Text>
        </TouchableOpacity>
      </ScrollView>

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
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    marginBottom: Platform.OS === 'ios' ? -40 : 0,
  },
  contentContainer: {
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
