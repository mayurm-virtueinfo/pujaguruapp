import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {COLORS, THEMESHADOW, wp} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {getPanditji, postAutoBooking} from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {useCommonToast} from '../../../common/CommonToast';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';

interface PanditjiItem {
  id: string;
  name: string;
  location: string;
  languages: string;
  image: string;
  isSelected: boolean;
  isVerified: boolean;
}

const SelectPanditjiScreen: React.FC = () => {
  const {t} = useTranslation();
  const inset = useSafeAreaInsets();

  const route = useRoute();
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
  } = route.params as any;
  const {showErrorToast, showSuccessToast} = useCommonToast();

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
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: string;
    longitude: string;
  } | null>(null);

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
    if (location && poojaId && booking_date) {
      fetchPanditji(
        poojaId,
        location.latitude,
        location.longitude,
        'manual',
        booking_date,
      );
    }
  }, [location, poojaId]);

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

  const fetchPanditji = async (
    pooja_id: string,
    latitude: string,
    longitude: string,
    mode: 'manual',
    booking_date: string,
  ) => {
    try {
      setIsLoading(true);
      const response = await getPanditji(
        pooja_id,
        latitude,
        longitude,
        mode,
        booking_date,
      );
      console.log('Fetched Panditji :: ', response);
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
            }),
          );
          setPanditjiData(transformedData);
        } else {
          setPanditjiData([]);
          showSuccessToast(
            response.message ||
              'No Panditji available for the selected date and pooja',
          );
        }
      } else {
        setPanditjiData([]);
        showErrorToast(response.message || 'No Panditji found');
      }
    } catch (error: any) {
      console.error('Error fetching panditji :: ', JSON.stringify(error));
      setPanditjiData([]);
      const errorMsg =
        error?.response?.data?.message || error?.message || 'No Panditji found';
      showErrorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePanditjiSelect = (id: string) => {
    const selected = panditjiData.find(item => item.id === id);
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
        location?.latitude || '',
        location?.longitude || '',
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
          price: price,
          selectAddress: selectAddress,
          selectManualPanitData: selectPanditData,
          booking_Id: response?.data?.booking_id,
        });
      }
    }
  };

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Ionicons
          name="search"
          size={16}
          color={COLORS.pujaTextSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_panditji')}
          placeholderTextColor={COLORS.pujaTextSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
    </View>
  );

  const renderPanditjiItem = ({
    item,
    index,
  }: {
    item: PanditjiItem;
    index: number;
  }) => (
    <View style={styles.panditjiContainer}>
      <TouchableOpacity
        style={styles.panditjiItem}
        onPress={() => handlePanditjiSelect(item.id)}
        activeOpacity={0.7}>
        <View style={styles.panditjiContent}>
          <View style={styles.imageContainer}>
            <Image source={{uri: item.image}} style={styles.panditjiImage} />
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons
                  name="verified"
                  size={16}
                  color={COLORS.success}
                />
              </View>
            )}
          </View>
          <View style={styles.panditjiDetails}>
            <Text style={styles.panditjiName}>{item.name}</Text>
            <Text style={styles.panditjiLocation}>{item.location}</Text>
            <Text style={styles.panditjiLanguages}>{item.languages}</Text>
          </View>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => handlePanditjiSelect(item.id)}>
            {item.isSelected ? (
              <Octicons
                name={'check-circle'}
                size={24}
                color={item.isSelected ? COLORS.primary : COLORS.inputBoder}
              />
            ) : (
              <MaterialIcons
                name={'radio-button-unchecked'}
                size={24}
                color={item.isSelected ? COLORS.primary : COLORS.inputBoder}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {index !== panditjiData.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('select_panditji')} showBackButton={true} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalScale(90)}>
        <View style={styles.absoluteMainContainer}>
          {renderSearchInput()}
          <FlatList
            data={panditjiData}
            renderItem={renderPanditjiItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[styles.listContent, THEMESHADOW.shadow]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={() => (
              <View style={{alignItems: 'center', padding: 20}}>
                <Text
                  style={{
                    color: COLORS.pujaCardSubtext,
                    fontFamily: Fonts.Sen_Regular,
                    fontSize: moderateScale(15),
                  }}>
                  {t('no_panditji_found') || 'No Panditji found'}
                </Text>
              </View>
            )}
          />
        </View>
        <View
          style={[
            styles.absoluteButtonContainer,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: verticalScale(14),
              backgroundColor: COLORS.pujaBackground,
            },
          ]}>
          <PrimaryButton
            title={t('next')}
            onPress={handleNextPress}
            disabled={!selectedPanditji}
            textStyle={styles.buttonText}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.gradientStart,
  },
  headerBackground: {
    backgroundColor: COLORS.gradientStart,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    height: verticalScale(136),
  },
  backButton: {
    padding: scale(5),
    marginRight: scale(10),
  },
  headerTitle: {
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(18),
    fontWeight: '700',
    flex: 1,
    marginRight: scale(39),
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
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(12),
    backgroundColor: COLORS.pujaBackground,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: scale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    padding: 0,
  },
  listContent: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    marginHorizontal: scale(24),
  },
  panditjiContainer: {
    // marginBottom: verticalScale(8),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },
  panditjiItem: {
    borderRadius: moderateScale(10),
    padding: scale(14),
    minHeight: verticalScale(66),
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditjiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginRight: scale(14),
  },
  panditjiImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: COLORS.inputBoder,
  },
  verifiedBadge: {
    position: 'absolute',
    right: scale(-2),
    top: verticalScale(1),
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(8),
    padding: scale(1),
  },
  panditjiDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  panditjiName: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    fontWeight: '700',
    letterSpacing: -0.333,
    marginBottom: verticalScale(2),
  },
  panditjiLocation: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    fontWeight: '400',
    marginBottom: verticalScale(2),
  },
  panditjiLanguages: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    fontWeight: '400',
    width: wp(40),
  },
  selectionButton: {
    padding: scale(4),
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginHorizontal: scale(14),
  },
  absoluteButtonContainer: {
    paddingHorizontal: scale(24),
    // paddingBottom is set dynamically in the component for safe area
    backgroundColor: COLORS.pujaBackground,
  },
  nextButton: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
  },
  disabledButton: {
    backgroundColor: COLORS.inputBoder,
  },
  buttonText: {
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(15),
    textTransform: 'uppercase',
  },
});

export default SelectPanditjiScreen;
