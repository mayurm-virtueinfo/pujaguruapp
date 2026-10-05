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
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Fonts from '../../../theme/fonts';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { useTranslation } from 'react-i18next';
import { postCreateKundli, searchCity } from '../../../api/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomeLoader from '../../../components/CustomeLoader';
import { useLocation } from '../../../context/LocationContext';
import { useCommonToast } from '../../../common/CommonToast';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

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
    } else if (selectedDate) {
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
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        setBirthTime(selectedDate);
      }
    } else if (selectedDate) {
      setBirthTime(selectedDate);
    }
  };

  const confirmIOSDate = () => {
    setShowDatePicker(false);
  };

  const confirmIOSTime = () => {
    setShowTimePicker(false);
  };

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
        } catch {
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

  const containerDynamic = { paddingTop: inset.top };
  const bottomBarDynamic = {
    paddingBottom: Math.max(inset.bottom + verticalScale(6), verticalScale(14)),
  };

  return (
    <View style={[styles.container, containerDynamic]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <CustomeLoader loading={loading} />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.headerGradient}
      />
      <UserCustomHeader
        title={t('create_new_kundli') || 'Create New Kundli'}
        showBackButton={true}
      />

      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Celestial Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroIconBadge}>
                <Ionicons
                  name="planet-outline"
                  size={26}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>
                  {t('generate_kundli') || 'Generate Vedic Kundli'}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {t('vedic_kundli_desc') ||
                    'Enter accurate birth details to calculate your Vedic planetary charts.'}
                </Text>
              </View>
            </View>

            {/* Form Section Card */}
            <View style={styles.formCard}>
              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('name') || 'Full Name'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    nameError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color="#94A3B8"
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder={
                      t('enter_your_name') ||
                      'Enter full name (e.g. Smit Patel)'
                    }
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={text => {
                      setName(text);
                      if (nameError) setNameError('');
                    }}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
              </View>

              {/* Birth Date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('birth_date') || 'Date of Birth'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDatePicker(true)}
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color="#94A3B8"
                    style={styles.inputLeftIcon}
                  />
                  <Text style={styles.pickerValueText}>
                    {moment(birthDate).format('DD MMM YYYY')}
                  </Text>
                  <Ionicons
                    name="calendar"
                    size={17}
                    color={COLORS.primary}
                    style={styles.pickerActionIcon}
                  />
                </TouchableOpacity>

                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.modalCancelText}>
                              {t('cancel') || 'Cancel'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.modalTitleText}>
                            {t('birth_date') || 'Date of Birth'}
                          </Text>
                          <TouchableOpacity onPress={confirmIOSDate}>
                            <Text style={styles.modalDoneText}>
                              {t('done') || 'Done'}
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

              {/* Birth Time */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t('birth_time') || 'Time of Birth'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowTimePicker(true)}
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color="#94A3B8"
                    style={styles.inputLeftIcon}
                  />
                  <Text style={styles.pickerValueText}>
                    {moment(birthTime).format('hh:mm A')}
                  </Text>
                  <Ionicons
                    name="time"
                    size={17}
                    color={COLORS.primary}
                    style={styles.pickerActionIcon}
                  />
                </TouchableOpacity>

                {Platform.OS === 'ios' ? (
                  <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showTimePicker}
                    onRequestClose={() => setShowTimePicker(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <TouchableOpacity
                            onPress={() => setShowTimePicker(false)}
                          >
                            <Text style={styles.modalCancelText}>
                              {t('cancel') || 'Cancel'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.modalTitleText}>
                            {t('birth_time') || 'Time of Birth'}
                          </Text>
                          <TouchableOpacity onPress={confirmIOSTime}>
                            <Text style={styles.modalDoneText}>
                              {t('done') || 'Done'}
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

              {/* Birth Place */}
              <View style={styles.birthPlaceGroup}>
                <Text style={styles.fieldLabel}>
                  {t('birth_place') || 'Birth Place (City / Town)'}
                  <Text style={styles.redAsterisk}> *</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    birthPlaceError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color="#94A3B8"
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder={
                      t('enter_birth_place') || 'Search city, town, or state'
                    }
                    placeholderTextColor="#94A3B8"
                    value={birthPlace}
                    onChangeText={text => {
                      handleSearchCity(text);
                      if (birthPlaceError) setBirthPlaceError('');
                    }}
                  />
                  {isSearchingCity ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : birthPlace.trim().length > 0 ? (
                    <TouchableOpacity
                      onPress={handleClearBirthPlace}
                      style={styles.clearBtn}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                {birthPlaceError ? (
                  <Text style={styles.errorText}>{birthPlaceError}</Text>
                ) : null}

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {isSearchingCity && suggestions.length === 0 ? (
                      <View style={styles.searchingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
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
                          const { mainTitle, subtitle } =
                            formatPlaceDetails(item);
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
                                    size={15}
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
                            size={18}
                            color="#94A3B8"
                          />
                          <Text style={styles.emptyText}>
                            {t('no_city_found') || 'No matching city found'}
                          </Text>
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
                              size={16}
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
                              {t('continue_with_this_place') ||
                                'Continue with this location'}
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
            </View>
          </ScrollView>

          {/* Fixed Bottom Action Bar */}
          <View style={[styles.bottomBar, bottomBarDynamic]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading ? styles.submitButtonDisabled : null,
              ]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color={COLORS.white}
                    style={styles.submitIcon}
                  />
                  <Text style={styles.submitButtonText}>
                    {t('generate_kundli') || 'Generate Kundli'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default KundliInputScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
    marginTop: verticalScale(6),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(24),
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  heroIconBadge: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    color: '#0F172A',
    marginBottom: verticalScale(2),
  },
  heroSubtitle: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    color: '#64748B',
    lineHeight: moderateScale(17),
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    zIndex: 10,
  },
  fieldGroup: {
    marginBottom: verticalScale(14),
  },
  birthPlaceGroup: {
    marginBottom: verticalScale(6),
    position: 'relative',
    zIndex: 1000,
  },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.inputLabelText,
    marginBottom: verticalScale(6),
  },
  redAsterisk: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    height: moderateScale(48),
    paddingHorizontal: scale(12),
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF8F8',
  },
  inputLeftIcon: {
    marginRight: scale(10),
  },
  inputField: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  pickerValueText: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: '#0F172A',
  },
  pickerActionIcon: {
    marginLeft: scale(8),
  },
  clearBtn: {
    padding: scale(4),
  },
  errorText: {
    color: COLORS.error,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    marginTop: verticalScale(4),
    marginLeft: scale(2),
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(14),
    marginTop: verticalScale(6),
    maxHeight: verticalScale(220),
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  suggestionsScroll: {
    maxHeight: verticalScale(210),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
  },
  locationIconBadge: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  suggestionTextContainer: {
    flex: 1,
    marginRight: scale(6),
  },
  suggestionMainText: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  suggestionSubText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  suggestionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: scale(52),
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    gap: scale(8),
  },
  searchingText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  notFoundContainer: {
    paddingVertical: verticalScale(6),
  },
  emptyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    gap: scale(6),
  },
  emptyText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  notFoundDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: scale(12),
    marginBottom: verticalScale(6),
  },
  useTypedPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(10),
    marginHorizontal: scale(8),
    marginBottom: verticalScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkIconBadge: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  useTypedPlaceTitle: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  useTypedPlaceSubtitle: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  bottomBar: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitIcon: {
    marginRight: scale(8),
  },
  submitButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingBottom: verticalScale(24),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  modalCancelText: {
    fontSize: moderateScale(15),
    color: '#64748B',
    fontFamily: Fonts.Sen_Medium,
  },
  modalDoneText: {
    fontSize: moderateScale(15),
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Bold,
  },
  iosDatePicker: {
    height: 200,
  },
});
