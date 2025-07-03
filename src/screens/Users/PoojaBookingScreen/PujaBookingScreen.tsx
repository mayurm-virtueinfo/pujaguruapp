import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import Calendar from '../../../components/Calendar';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import PanditjiSelectionModal from '../../../components/PanditjiSelectionModal';
import UserCustomHeader from '../../../components/UserCustomHeader';

interface MuhuratSlot {
  id: string;
  name: string;
  time: string;
  isSelected: boolean;
}

const PujaBookingScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PaymentScreen'
  >;

  const navigation =
    useNavigation<StackNavigationProp<UserPoojaListParamList>>();

  const [selectedSlot, setSelectedSlot] = useState<string>('shubh');
  const [additionalNotes, setAdditionalNotes] = useState(
    'Please arrange for flowers.',
  );
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [currentMonth, setCurrentMonth] = useState<string>(
    `${today.toLocaleString('default', {
      month: 'long',
    })} ${today.getFullYear()}`,
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [panditjiSelection, setPanditjiSelection] = useState<
    'automatic' | 'manual'
  >('automatic');

  const muhuratSlots: MuhuratSlot[] = [
    {
      id: 'shubh',
      name: 'Shubh Muhurat',
      time: '10:00 AM - 12:00 PM',
      isSelected: selectedSlot === 'shubh',
    },
    {
      id: 'labh',
      name: 'Labh Muhurat',
      time: '01:00 PM - 03:00 PM',
      isSelected: selectedSlot === 'labh',
    },
    {
      id: 'amrit',
      name: 'Amrit Muhurat',
      time: '03:30 PM - 05:30 PM',
      isSelected: selectedSlot === 'amrit',
    },
    {
      id: 'char',
      name: 'Char Muhurat',
      time: '06:00 PM - 08:00 PM',
      isSelected: selectedSlot === 'char',
    },
    {
      id: 'rog',
      name: 'Rog Muhurat',
      time: '08:30 PM - 10:30 PM',
      isSelected: selectedSlot === 'rog',
    },
  ];

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handlePanditjiSelectionModalOpen = () => {
    setModalVisible(true);
  };

  const handlePanditjiSelectionModalClose = () => {
    setModalVisible(false);
  };

  // Modified: On confirm, navigate to PaymentScreen if automatic, else SelectPanditjiScreen
  const handlePanditjiSelectionConfirm = (
    selection: 'automatic' | 'manual',
  ) => {
    setPanditjiSelection(selection);
    setModalVisible(false);
    if (selection === 'automatic') {
      navigation.navigate('PaymentScreen');
    } else if (selection === 'manual') {
      navigation.navigate('SelectPanditjiScreen');
    }
  };

  const renderMuhuratSlots = () => (
    <View style={styles.slotsContainer}>
      <Text style={styles.slotsTitle}>Select Muhurat Time Slot</Text>
      <View style={styles.slotsListContainer}>
        {muhuratSlots.map((slot, index) => (
          <View key={slot.id}>
            <TouchableOpacity
              style={styles.slotItem}
              onPress={() => handleSlotSelect(slot.id)}>
              <View style={styles.slotContent}>
                <View style={styles.slotTextContainer}>
                  <Text style={styles.slotName}>{slot.name}</Text>
                  <Text style={styles.slotTime}>{slot.time}</Text>
                </View>
                <View style={styles.slotSelection}>
                  <Ionicons
                    name={
                      slot.isSelected
                        ? 'checkmark-circle-outline'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={slot.isSelected ? COLORS.gradientEnd : '#E4E8E9'}
                  />
                </View>
              </View>
            </TouchableOpacity>
            {index < muhuratSlots.length - 1 && (
              <View style={styles.slotDivider} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title="Puja Booking" showBackButton={true} />

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
              <Text style={styles.pujaPlaceLabel}>Puja Place</Text>
              <Text style={styles.pujaPlaceValue}>Home: Primary residence</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
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
          onDateSelect={setSelectedDate}
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
            setSelectedDate(1); // Optionally reset selected date
          }}
        />

        {/* Muhurat Slots Section */}
        {renderMuhuratSlots()}

        {/* Additional Notes Section */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Please arrange for flowers."
            placeholderTextColor="#191313"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handlePanditjiSelectionModalOpen}>
          <Text style={styles.nextButtonText}>NEXT</Text>
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
