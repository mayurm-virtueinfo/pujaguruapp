import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import PrimaryButton from '../../../components/PrimaryButton';
import { useTranslation } from 'react-i18next';
import { postCreateKundli, searchCity } from '../../../api/apiService';
import { FlatList } from 'react-native';
import CustomTextInput from '../../../components/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomeLoader from '../../../components/CustomeLoader';

// ... existing imports

const KundliInputScreen = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<UserProfileParamList>>();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [birthPlace, setBirthPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: string, lon: string} | null>(null);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
    if (event.type === 'set' || event.type === 'dismissed') {
        setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthTime;
    setShowTimePicker(Platform.OS === 'ios');
    setBirthTime(currentDate);
    if (event.type === 'set' || event.type === 'dismissed') {
        setShowTimePicker(false);
    }
  };


  const lastQuery = React.useRef('');

  const handleSearchCity = async (text: string) => {
    setBirthPlace(text);
    lastQuery.current = text;
    if (text.length > 2) {
      const results = await searchCity(text);
      if (lastQuery.current === text) {
        setSuggestions(results);
        setShowSuggestions(true);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (item: any) => {
    setBirthPlace(item.display_name);
    setSelectedLocation({ lat: item.lat, lon: item.lon });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!birthPlace.trim()) {
      return;
    }

    if (!selectedLocation) {
        // Fallback to geocoding if user didn't select from dropdown
        // Or force selection. For now, let's try to geocode if not selected
        // But since we removed getCityCoordinates, we should rely on selection or re-implement it using searchCity
        const results = await searchCity(birthPlace);
        if (results.length > 0) {
            setSelectedLocation({ lat: results[0].lat, lon: results[0].lon });
        } else {
            console.warn('City not found');
            return;
        }
    }

    setLoading(true);
    
    // Use selectedLocation or fetch if needed (logic above handles it partially, but let's be safe)
    // Actually, state updates are async, so better to use local variable if we just fetched
    let lat = selectedLocation?.lat;
    let lon = selectedLocation?.lon;

    if (!lat || !lon) {
         const results = await searchCity(birthPlace);
        if (results.length > 0) {
            lat = results[0].lat;
            lon = results[0].lon;
        } else {
            setLoading(false);
            console.warn('City not found');
            return;
        }
    }

    const payload = {
        name,
        date_of_birth: moment(birthDate).format('YYYY-MM-DD'),
        time_of_birth: moment(birthTime).format('HH:mm:ss'),
        birth_place: birthPlace,
        latitude: parseFloat(lat || '0'),
        longitude: parseFloat(lon || '0'),
    };

      try {
        const response = await postCreateKundli(payload);
        setLoading(false);
        console.log('Kundli created successfully:', response);
        
        navigation.replace('KundliScreen', {
          kundliData: response,
          name,
          birthDate: moment(birthDate).format('YYYY-MM-DD'),
          birthTime: moment(birthTime).format('HH:mm'),
          birthPlace,
          latitude: parseFloat(lat || '0'),
          longitude: parseFloat(lon || '0'),
        });
      } catch (error) {
        setLoading(false);
        console.error('Failed to create kundli:', error);
      }
  };


  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <UserCustomHeader title={t('rashi_ful')} showBackButton={true} />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card,THEMESHADOW.shadow]}>
          <View style={styles.inputContainer}>
            <CustomTextInput
              label={t('name')}
              placeholder={t('enter_your_name')}
              value={name}
              onChangeText={setName}
              required={true}
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <CustomTextInput
                  label={t('birth_date')}
                  value={moment(birthDate).format('DD MMM YYYY')}
                  onChangeText={() => {}}
                  editable={false}
                  rightIcon={
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.textGray}
                    />
                  }
                  required={true}
                />
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={birthDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
              <View pointerEvents="none">
                <CustomTextInput
                  label={t('birth_time')}
                  value={moment(birthTime).format('hh:mm A')}
                  onChangeText={() => {}}
                  editable={false}
                  rightIcon={
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={COLORS.textGray}
                    />
                  }
                  required={true}
                />
              </View>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                testID="timePicker"
                value={birthTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>

          <View style={[styles.inputContainer, { zIndex: 1000 }]}>
            <CustomTextInput
              label={t('birth_place')}
              placeholder={t('enter_birth_place')}
              value={birthPlace}
              onChangeText={handleSearchCity}
              rightIcon={
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={COLORS.textGray}
                />
              }
              required={true}
            />
            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer,THEMESHADOW.shadow]}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectCity(item)}
                  >
                    <Text style={styles.suggestionText}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <PrimaryButton
            title={t('submit')}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
    paddingTop: 40,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});

export default KundliInputScreen;
