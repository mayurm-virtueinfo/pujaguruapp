import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, THEMESHADOW, wp } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { getPanditji, postAutoBooking } from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import { useCommonToast } from '../../../common/CommonToast';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import { translateData } from '../../../utils/TranslateData';

interface PanditjiItem {
  id: string;
  name: string;
  location: string;
  languages: string;
  image: string;
  isSelected: boolean;
  isVerified: boolean;
  price?: number;
  priceStatus?: number;
}

const SelectPanditjiScreen: React.FC = () => {
  const { t, i18n }: { t: any; i18n: { language: string } } = useTranslation();
  const inset = useSafeAreaInsets();

  const route = useRoute();
  const currentLanguage: string = i18n.language;

  const {
    poojaId,
    samagri_required,
    address,
    tirth,
    booking_date,
    muhurat_time,
    muhurat_type,
    notes,
    puja_name,
    puja_image,
    price,
    selectAddress,
    AutoModeSelection,
    selectedAddressLatitude,
    selectedAddressLongitude,
    poojaDescription,
  } = route.params as any;

  console.log('SelectPanditjiScreen route?.params :: ', route?.params);

  const { showErrorToast, showSuccessToast } = useCommonToast();

  const navigation = useNavigation<StackNavigationProp<UserHomeParamList>>();
  const [searchText, setSearchText] = useState('');
  const [selectedPanditji, setSelectedPanditji] = useState<string | null>(null);
  const [selectedPanditjiName, setSelectedPanditjiName] = useState<
    string | null
  >(null);
  const [selectedPanditjiImage, setSelectedPanditjiImage] = useState<
    string | null
  >(null);
  const [selectPanditData, setSelectPanditData] = useState<any>(null);
  const [panditjiData, setPanditjiData] = useState<PanditjiItem[]>([]);
  const [originalPanditjiData, setOriginalPanditjiData] = useState<
    PanditjiItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: string;
    longitude: string;
  } | null>(null);

  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return null;
    }
    return `₹ ${Number(value).toLocaleString('en-IN')}`;
  };

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

  const postPujaBookingData = async (
    data: any,
    latitude: string,
    longitude: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await postAutoBooking(data, latitude, longitude);
      return response;
    } catch (error: any) {
      showErrorToast(error?.response?.data?.message || 'Failed to book puja');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPanditji = useCallback(
    async (
      pooja_id: string,
      latitude: string,
      longitude: string,
      mode: 'manual',
      booking_date: string,
      tirth: number,
    ) => {
      try {
        setIsLoading(true);

        const cachedData = translationCacheRef.current.get(currentLanguage);
        if (cachedData) {
          setPanditjiData(cachedData);
          setIsLoading(false);
          return;
        }

        const response = await getPanditji(
          pooja_id,
          latitude,
          longitude,
          mode,
          booking_date,
          tirth,
        );
        if (response.success) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            const transformedData: PanditjiItem[] = response.data.map(
              (item: any) => ({
                id: item.pandit_id,
                name: item.full_name,
                location: item.city,
                languages: item.supported_languages?.join(', '),
                image: item.profile_img,
                isSelected: false,
                isVerified: item.isVerified || false,
                price: samagri_required
                  ? item.price?.with_samagri
                  : item.price?.without_samagri,
                priceStatus: item.price_status,
              }),
            );
            setOriginalPanditjiData(transformedData);
            const translated: any = await translateData(
              transformedData,
              currentLanguage,
              ['name', 'location', 'languages'],
            );
            translationCacheRef.current.set(currentLanguage, translated);
            setPanditjiData(translated);
          }
        } else {
          setPanditjiData([]);
          setOriginalPanditjiData([]);
          showErrorToast(response.message || 'No Panditji found');
        }
      } catch (error: any) {
        setPanditjiData([]);
        setOriginalPanditjiData([]);
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          'No Panditji found';
        showErrorToast(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage],
  );

  useEffect(() => {
    if (location && poojaId && booking_date) {
      fetchPanditji(
        poojaId,
        selectedAddressLatitude,
        selectedAddressLongitude,
        'manual',
        booking_date,
        tirth || null,
      );
    }
  }, [location, poojaId, fetchPanditji]);

  const handlePanditjiSelect = (id: string) => {
    if (selectedPanditji === id) {
      setSelectedPanditji(null);
      setSelectPanditData(null);
      setSelectedPanditjiName(null);
      setSelectedPanditjiImage(null);
      setPanditjiData(prev =>
        prev.map(item => ({ ...item, isSelected: false })),
      );
      return;
    }
    const selected = originalPanditjiData.find(item => item.id === id);
    setSelectedPanditji(id);
    setSelectPanditData(selected);
    setSelectedPanditjiName(selected ? selected.name : null);
    setSelectedPanditjiImage(selected ? selected.image : null);
    setPanditjiData(prev =>
      prev.map(item => ({
        ...item,
        isSelected: item.id === id,
      })),
    );
  };

  const handleNextPress = async () => {
    const data = {
      pooja: poojaId,
      assignment_mode: 2,
      samagri_required: samagri_required,
      address: address,
      tirth_place: tirth,
      booking_date: booking_date,
      muhurat_time: muhurat_time,
      muhurat_type: muhurat_type,
      pandit: selectedPanditji,
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
          booking_date: booking_date,
          muhurat_time: muhurat_time,
          muhurat_type: muhurat_type,
          notes: notes,
          pandit: selectedPanditji,
          pandit_name: selectedPanditjiName,
          pandit_image: selectedPanditjiImage,
          puja_image: puja_image,
          puja_name: puja_name,
          price: selectPanditData?.price ?? price,
          selectAddress: selectAddress,
          selectManualPanitData: selectPanditData,
          booking_Id: response?.data?.booking_id,
          AutoModeSelection,
          auto: 'true',
          selectedAddressLatitude: selectedAddressLatitude,
          selectedAddressLongitude: selectedAddressLongitude,
          poojaDescription: poojaDescription,
        });
      }
    }
  };

  const handleSearchPandit = async () => {
    const data = {
      pooja: poojaId,
      assignment_mode: 1,
      samagri_required: samagri_required,
      address: address,
      tirth_place: tirth,
      booking_date: booking_date,
      muhurat_time: muhurat_time,
      muhurat_type: muhurat_type,
    };
    setIsLoading(true);
    try {
      const response: any = await postAutoBooking(
        data,
        selectedAddressLatitude,
        selectedAddressLongitude,
      );
      if (response && response.success) {
        navigation.navigate('PaymentScreen', {
          poojaId: poojaId,
          samagri_required: samagri_required,
          address: address,
          tirth: tirth,
          booking_date: booking_date,
          muhurat_time: muhurat_time,
          muhurat_type: muhurat_type,
          notes: notes,
          pandit: response?.data?.pandit_id || null,
          pandit_name: response?.data?.pandit_name || null,
          pandit_image: response?.data?.pandit_image || null,
          puja_image: puja_image,
          puja_name: puja_name,
          price: price,
          selectAddress: selectAddress,
          selectManualPanitData: null,
          booking_Id: response?.data?.booking_id,
          AutoModeSelection,
          auto: 'true',
          selectedAddressLatitude: selectedAddressLatitude,
          selectedAddressLongitude: selectedAddressLongitude,
          poojaDescription: poojaDescription,
        });
      } else {
        showErrorToast(
          response?.message || t('no_panditji_found') || 'No Panditji found',
        );
      }
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message ||
          error?.message ||
          t('no_panditji_found') ||
          'No Panditji found',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPanditjiData = useMemo(() => {
    if (!searchText.trim()) {
      return panditjiData;
    }
    const query = searchText.trim().toLowerCase();
    return panditjiData.filter(
      item =>
        item.name?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.languages?.toLowerCase().includes(query),
    );
  }, [panditjiData, searchText]);

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.pujaTextSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_panditji') || 'Search Panditji'}
          placeholderTextColor={COLORS.pujaTextSecondary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearSearchButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={COLORS.pujaTextSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPanditjiItem = ({
    item,
  }: {
    item: PanditjiItem;
    index: number;
  }) => {
    const formattedPrice = formatCurrency(item.price);
    const isSelected = selectedPanditji === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.panditCard,
          isSelected && styles.panditCardSelected,
        ]}
        onPress={() => handlePanditjiSelect(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.panditCardContent}>
          {/* Pandit Image & Verified Badge */}
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri:
                  item.image ||
                  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy3IRQZYt7VgvYzxEqdhs8R6gNE6cYdeJueyHS-Es3MXb9XVRQQmIq7tI0grb8GTlzBRU&usqp=CAU',
              }}
              style={styles.panditjiImage}
              resizeMode="cover"
            />
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons
                  name="verified"
                  size={15}
                  color={COLORS.success}
                />
              </View>
            )}
          </View>

          {/* Pandit Details */}
          <View style={styles.panditjiDetails}>
            <Text style={styles.panditjiName} numberOfLines={1}>
              {item.name}
            </Text>

            {item.location ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={COLORS.pujaTextSecondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.panditjiLocation} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}

            {item.languages ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="language-outline"
                  size={13}
                  color={COLORS.pujaTextSecondary}
                  style={styles.metaIcon}
                />
                <Text style={styles.panditjiLanguages} numberOfLines={1}>
                  {item.languages}
                </Text>
              </View>
            ) : null}

            {formattedPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {t('dakshina', 'Dakshina')}:{' '}
                </Text>
                <Text style={styles.priceValue}>{formattedPrice}</Text>
              </View>
            )}
          </View>

          {/* Selection Radio Icon */}
          <View style={styles.selectionWrapper}>
            {isSelected ? (
              <MaterialIcons
                name="radio-button-checked"
                size={24}
                color={COLORS.primary}
              />
            ) : (
              <MaterialIcons
                name="radio-button-unchecked"
                size={24}
                color="#CBD5E1"
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name="people-outline"
          size={36}
          color={COLORS.pujaCardSubtext}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {searchText.trim()
          ? t('no_matching_panditji') || 'No Matching Panditji'
          : t('no_panditji_found') || 'No Panditji found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchText.trim()
          ? t('try_different_search') || 'Try searching with another name or city'
          : t('no_pandit_available_sub') ||
            'Currently no Guruji is available for this location and date.'}
      </Text>
      {searchText.trim().length > 0 && (
        <TouchableOpacity
          style={styles.clearSearchFilterButton}
          onPress={() => setSearchText('')}
          activeOpacity={0.7}
        >
          <Text style={styles.clearSearchFilterText}>
            {t('clear_search') || 'Clear Search'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('select_panditji')} showBackButton={true} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalScale(90)}
      >
        <View style={styles.absoluteMainContainer}>
          {renderSearchInput()}
          <FlatList
            data={filteredPanditjiData}
            renderItem={renderPanditjiItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={renderEmptyComponent}
          />
        </View>
        {panditjiData.length > 0 && (
          <View style={styles.absoluteButtonContainer}>
            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              disabled={!selectedPanditji}
              textStyle={styles.buttonText}
              style={styles.nextButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gradientStart,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  absoluteMainContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(10),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: scale(12),
    height: verticalScale(44),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    padding: 0,
  },
  clearSearchButton: {
    padding: scale(4),
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(76),
  },
  panditCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: verticalScale(12),
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  panditCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBFB',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  panditCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: scale(12),
  },
  panditjiImage: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: COLORS.inputBoder,
  },
  verifiedBadge: {
    position: 'absolute',
    right: scale(-2),
    bottom: verticalScale(-2),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: scale(1),
    borderWidth: 1.5,
    borderColor: COLORS.white,
    elevation: 2,
  },
  panditjiDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  panditjiName: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    marginBottom: verticalScale(3),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  metaIcon: {
    marginRight: scale(4),
  },
  panditjiLocation: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    flex: 1,
  },
  panditjiLanguages: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
    backgroundColor: '#FFF1F2',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  priceLabel: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(11),
    color: COLORS.primary,
  },
  priceValue: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13),
    color: COLORS.primary,
  },
  selectionWrapper: {
    paddingLeft: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  emptyIconCircle: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  clearSearchFilterButton: {
    marginTop: verticalScale(14),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: '#FEE2E2',
    borderRadius: moderateScale(8),
  },
  clearSearchFilterText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: COLORS.primary,
  },
  nextButton: {
    marginTop: 0,
  },
  absoluteButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(12),
    backgroundColor: COLORS.pujaBackground,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    textTransform: 'uppercase',
  },
});

export default SelectPanditjiScreen;
