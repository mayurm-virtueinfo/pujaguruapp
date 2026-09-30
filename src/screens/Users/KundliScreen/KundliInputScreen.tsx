import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Fonts from '../../../theme/fonts';
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
import CustomTextInput from '../../../components/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomeLoader from '../../../components/CustomeLoader';
import { useLocation } from '../../../context/LocationContext';
import { useCommonToast } from '../../../common/CommonToast';

const KundliInputScreen = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<UserProfileParamList>>();
  const { t } = useTranslation();
  const { location: userLocation } = useLocation();
  const { showErrorToast, showSuccessToast } = useCommonToast();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthTime, setBirthTime] = useState(new Date());
  const [birthPlace, setBirthPlace] = useState('');
  const [birthPlaceError, setBirthPlaceError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: string;
    lon: string;
  } | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        if (moment(selectedDate).isAfter(moment(), 'day')) {
          showErrorToast(
            t(
              'birth_date_cannot_be_future',
              'Birth date cannot be in the future',
            ),
          );
          return;
        }
        setBirthDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        if (moment(selectedDate).isAfter(moment(), 'day')) {
          showErrorToast(
            t(
              'birth_date_cannot_be_future',
              'Birth date cannot be in the future',
            ),
          );
          return;
        }
        setBirthDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        setBirthTime(selectedDate);
      }
    } else {
      if (selectedDate) setBirthTime(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    setShowDatePicker(false);
  };

  const confirmIOSTime = () => {
    setShowTimePicker(false);
  };

  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef('');

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const formatPlaceDetails = (item: any) => {
    const parts = (item.display_name || '')
      .split(',')
      .map((p: string) => p.trim());
    const mainTitle =
      item.name ||
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.suburb ||
      parts[0] ||
      '';

    let subtitle = '';
    if (item.address) {
      const secondaryParts = [
        item.address.city && item.address.city !== mainTitle
          ? item.address.city
          : null,
        item.address.state_district && item.address.state_district !== mainTitle
          ? item.address.state_district
          : null,
        item.address.state,
        item.address.country,
      ].filter(Boolean);

      if (secondaryParts.length > 0) {
        subtitle = Array.from(new Set(secondaryParts)).join(', ');
      }
    }

    if (!subtitle && parts.length > 1) {
      subtitle = parts.slice(1, 4).join(', ');
    }

    return { mainTitle, subtitle };
  };

  const handleSearchCity = (text: string) => {
    setBirthPlace(text);
    setSelectedLocation(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length > 2) {
      setIsSearchingCity(true);
      setShowSuggestions(true);
      setHasSearched(false);
      lastQuery.current = text.trim();

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchCity(text.trim());
          if (lastQuery.current === text.trim()) {
            setSuggestions(results || []);
            setShowSuggestions(true);
            setHasSearched(true);
          }
        } catch (e) {
          if (lastQuery.current === text.trim()) {
            setSuggestions([]);
            setHasSearched(true);
          }
        } finally {
          if (lastQuery.current === text.trim()) {
            setIsSearchingCity(false);
          }
        }
      }, 350);
    } else {
      setIsSearchingCity(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false);
    }
  };

  const handleClearBirthPlace = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setBirthPlace('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedLocation(null);
    setIsSearchingCity(false);
    setHasSearched(false);
  };

  const handleSelectCity = (item: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const { mainTitle, subtitle } = formatPlaceDetails(item);
    const formattedPlace = subtitle ? `${mainTitle}, ${subtitle}` : mainTitle;
    setBirthPlace(formattedPlace);
    setBirthPlaceError('');
    setSelectedLocation({ lat: item.lat, lon: item.lon });
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearchingCity(false);
    setHasSearched(false);
  };

  const handleAcceptTypedPlace = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const cleanPlace = birthPlace.trim();
    if (!cleanPlace) {
      return;
    }

    setBirthPlace(cleanPlace);
    setBirthPlaceError('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearchingCity(false);
    setHasSearched(false);

    if (userLocation) {
      setSelectedLocation({
        lat: userLocation.latitude.toString(),
        lon: userLocation.longitude.toString(),
      });
    } else {
      setSelectedLocation({
        lat: '20.5937',
        lon: '78.9629',
      });
    }
  };

  const renderBirthPlaceRightIcon = () => {
    if (isSearchingCity) {
      return <ActivityIndicator size="small" color={COLORS.primary} />;
    }
    if (birthPlace.trim().length > 0) {
      return <Ionicons name="close-circle" size={20} color={COLORS.textGray} />;
    }
    return (
      <Ionicons name="location-outline" size={20} color={COLORS.textGray} />
    );
  };

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPlace = birthPlace.trim();

    let hasError = false;

    if (!cleanName && !cleanPlace) {
      setNameError(t('name_required', 'Name is required'));
      setBirthPlaceError(t('birth_place_required', 'Birth place is required'));
      showErrorToast(
        t('please_fill_all_required_fields', 'Please fill all required fields'),
      );
      return;
    }

    if (!cleanName) {
      setNameError(t('name_required', 'Name is required'));
      showErrorToast(t('name_required', 'Name is required'));
      hasError = true;
    }

    if (!cleanPlace) {
      setBirthPlaceError(t('birth_place_required', 'Birth place is required'));
      showErrorToast(t('birth_place_required', 'Birth place is required'));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (moment(birthDate).isAfter(moment(), 'day')) {
      showErrorToast(
        t('birth_date_cannot_be_future', 'Birth date cannot be in the future'),
      );
      return;
    }

    setLoading(true);

    let lat = selectedLocation?.lat;
    let lon = selectedLocation?.lon;

    if (!lat || !lon) {
      try {
        const results = await searchCity(cleanPlace);
        if (results && results.length > 0 && results[0].lat && results[0].lon) {
          const foundLat: string = results[0].lat.toString();
          const foundLon: string = results[0].lon.toString();
          lat = foundLat;
          lon = foundLon;
          setSelectedLocation({ lat: foundLat, lon: foundLon });
        }
      } catch (err) {
        console.warn('searchCity failed on submit:', err);
      }
    }

    // Fallback to userLocation or India center coordinates if city is unlisted in Nominatim
    if (!lat || !lon) {
      lat = userLocation?.latitude
        ? userLocation.latitude.toString()
        : '20.5937';
      lon = userLocation?.longitude
        ? userLocation.longitude.toString()
        : '78.9629';
    }

    const payload = {
      name: cleanName,
      date_of_birth: moment(birthDate).format('YYYY-MM-DD'),
      time_of_birth: moment(birthTime).format('HH:mm:ss'),
      birth_place: cleanPlace,
      latitude: parseFloat(lat || '20.5937'),
      longitude: parseFloat(lon || '78.9629'),
    };

    try {
      const response = await postCreateKundli(payload);
      setLoading(false);
      console.log('Kundli created successfully:', response);
      showSuccessToast(
        t('kundli_created_successfully', 'Kundli generated successfully!'),
      );

      navigation.replace('KundliScreen', {
        kundliData: response,
        name: cleanName,
        birthDate: moment(birthDate).format('YYYY-MM-DD'),
        birthTime: moment(birthTime).format('HH:mm'),
        birthPlace: cleanPlace,
        latitude: parseFloat(lat || '20.5937'),
        longitude: parseFloat(lon || '78.9629'),
      });
    } catch (error) {
      setLoading(false);
      console.error('Failed to create kundli:', error);
      showErrorToast(
        t(
          'failed_to_create_kundli',
          'Failed to generate Kundli. Please try again.',
        ),
      );
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
        <View style={[styles.card, THEMESHADOW.shadow]}>
          <View style={styles.inputContainer}>
            <CustomTextInput
              label={t('name')}
              placeholder={t('enter_your_name')}
              value={name}
              onChangeText={text => {
                setName(text);
                if (nameError) setNameError('');
              }}
              error={nameError}
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
            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.modalButtonText}>
                          {t('cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmIOSDate}>
                        <Text
                          style={[styles.modalButtonText, styles.doneButton]}
                        >
                          {t('done')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={birthDate}
                      mode="date"
                      is24Hour={true}
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={onDateChange}
                      themeVariant="light"
                      style={styles.iosDatePicker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={birthDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )
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
            {Platform.OS === 'ios' ? (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showTimePicker}
                onRequestClose={() => setShowTimePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={styles.modalButtonText}>
                          {t('cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmIOSTime}>
                        <Text
                          style={[styles.modalButtonText, styles.doneButton]}
                        >
                          {t('done')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      testID="timePicker"
                      value={birthTime}
                      mode="time"
                      is24Hour={false}
                      display="spinner"
                      onChange={onTimeChange}
                      themeVariant="light"
                      style={styles.iosDatePicker}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              showTimePicker && (
                <DateTimePicker
                  testID="timePicker"
                  value={birthTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={onTimeChange}
                />
              )
            )}
          </View>

          <View style={styles.birthPlaceContainer}>
            <CustomTextInput
              label={t('birth_place')}
              placeholder={t('enter_birth_place')}
              value={birthPlace}
              onChangeText={text => {
                handleSearchCity(text);
                if (birthPlaceError) setBirthPlaceError('');
              }}
              error={birthPlaceError}
              rightIcon={renderBirthPlaceRightIcon()}
              onRightIconPress={
                birthPlace.trim().length > 0 ? handleClearBirthPlace : undefined
              }
              required={true}
            />
            {showSuggestions && (
              <View style={[styles.suggestionsContainer, THEMESHADOW.shadow]}>
                {isSearchingCity && suggestions.length === 0 ? (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.searchingText}>
                      {t(
                        'search_pandit_screen_scanning_location',
                        'Searching location...',
                      )}
                    </Text>
                  </View>
                ) : suggestions.length > 0 ? (
                  <ScrollView
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={styles.suggestionsScroll}
                  >
                    {suggestions.map((item, index) => {
                      const { mainTitle, subtitle } = formatPlaceDetails(item);
                      return (
                        <React.Fragment key={item.place_id || index}>
                          <TouchableOpacity
                            style={styles.suggestionItem}
                            activeOpacity={0.7}
                            onPress={() => handleSelectCity(item)}
                          >
                            <View style={styles.locationIconBadge}>
                              <Ionicons
                                name="location-sharp"
                                size={16}
                                color={COLORS.primary}
                              />
                            </View>
                            <View style={styles.suggestionTextContainer}>
                              <Text
                                style={styles.suggestionMainText}
                                numberOfLines={1}
                              >
                                {mainTitle}
                              </Text>
                              {subtitle ? (
                                <Text
                                  style={styles.suggestionSubText}
                                  numberOfLines={1}
                                >
                                  {subtitle}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={15}
                              color="#CBD5E1"
                            />
                          </TouchableOpacity>
                          {index < suggestions.length - 1 && (
                            <View style={styles.suggestionDivider} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </ScrollView>
                ) : hasSearched && !isSearchingCity ? (
                  <View style={styles.notFoundContainer}>
                    <View style={styles.emptyHeaderRow}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.emptyText}>{t('no_city_found')}</Text>
                    </View>
                    <View style={styles.notFoundDivider} />
                    <TouchableOpacity
                      style={styles.useTypedPlaceButton}
                      activeOpacity={0.7}
                      onPress={handleAcceptTypedPlace}
                    >
                      <View style={styles.checkIconBadge}>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={COLORS.white}
                        />
                      </View>
                      <View style={styles.suggestionTextContainer}>
                        <Text
                          style={styles.useTypedPlaceTitle}
                          numberOfLines={1}
                        >
                          {t('use_entered_location', {
                            name: birthPlace.trim(),
                            defaultValue: `Use "${birthPlace.trim()}"`,
                          })}
                        </Text>
                        <Text style={styles.useTypedPlaceSubtitle}>
                          {t('continue_with_this_place')}
                        </Text>
                      </View>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
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
    overflow: 'visible',
  },
  inputContainer: {
    marginBottom: 20,
  },
  birthPlaceContainer: {
    position: 'relative',
    zIndex: 1000,
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
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginTop: 6,
    maxHeight: 260,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 240,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  locationIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  suggestionMainText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.black,
    marginBottom: 2,
  },
  suggestionSubText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.textGray,
  },
  suggestionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 58,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  searchingText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textGray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.textGray,
  },
  notFoundContainer: {
    paddingVertical: 8,
  },
  emptyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  notFoundDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
    marginBottom: 8,
  },
  useTypedPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  useTypedPlaceTitle: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.black,
    marginBottom: 2,
  },
  useTypedPlaceSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.textGray,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  doneButton: {
    fontWeight: 'bold',
  },
  iosDatePicker: {
    height: 200,
  },
});

export default KundliInputScreen;
