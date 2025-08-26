import React, {useState, useEffect, useCallback} from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPanditjiParamList} from '../../../navigation/User/UserPanditjiNavigator';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {getAllPanditji, getNewPanditji} from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import {useCommonToast} from '../../../common/CommonToast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';
import {UserHomeParamList} from '../../../navigation/User/UsetHomeStack';

interface PanditjiItem {
  id: string;
  pandit_id: string;
  full_name: string;
  profile_img: string;
  city: string;
  supported_languages: Array<string>;
}

interface PanditjiResponse {
  success: boolean;
  message: string;
  latitude: string;
  longitude: string;
  pandits: PanditjiItem[];
}

const SelectNewPanditjiScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();
  const route = useRoute();
  const {booking_id} = route?.params as any;

  const navigation = useNavigation<StackNavigationProp<UserHomeParamList>>();
  const [searchText, setSearchText] = useState('');
  const [panditjiData, setPanditjiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPanditId, setSelectedPanditId] = useState<string | null>(null);

  const location = AsyncStorage.getItem(AppConstant.LOCATION);
  const {showErrorToast} = useCommonToast();

  const handleNotificationPress = () => {
    navigation.navigate('NotificationScreen');
  };

  const fetchAllPanditji = useCallback(async () => {
    try {
      setIsLoading(true);
      const locationStr = await AsyncStorage.getItem(AppConstant.LOCATION);
      let latitude = '';
      let longitude = '';
      if (locationStr) {
        try {
          const locObj = JSON.parse(locationStr);
          latitude = locObj.latitude;
          longitude = locObj.longitude;
        } catch (e) {
          // fallback: keep empty
        }
      }
      const response = (await getNewPanditji(
        booking_id,
        latitude,
        longitude,
      )) as PanditjiResponse;
      if (response.success) {
        setPanditjiData(
          response.pandits
            .filter(item =>
              item.full_name.toLowerCase().includes(searchText.toLowerCase()),
            )
            .map((item: any) => ({
              id: item.id,
              pandit_id: item.pandit_id,
              name: item.full_name,
              image: item.profile_img,
              location: item.city,
              languages: item.supported_languages.join(', '),
              isVerified: false,
              isSelected: false,
            })),
        );
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Failed to fetch Panditji list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPanditji();
  }, [fetchAllPanditji]);

  const handlePanditjiSelect = (id: string) => {
    setSelectedPanditId(id);
    // You can add any additional logic here if needed, e.g., API call to select the pandit
  };

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
          placeholder={t('search_panditji')}
          placeholderTextColor={COLORS.pujaTextSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
    </View>
  );

  const renderPanditjiItem = ({item, index}: {item: any; index: number}) => {
    const isSelected = selectedPanditId === item.pandit_id;
    return (
      <View style={styles.panditjiContainer}>
        <TouchableOpacity
          style={styles.panditjiItem}
          onPress={() => handlePanditjiSelect(item.pandit_id)}
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
              onPress={() => handlePanditjiSelect(item.pandit_id)}>
              {isSelected ? (
                <Octicons
                  name={'check-circle'}
                  size={24}
                  color={COLORS.primary}
                />
              ) : (
                <MaterialIcons
                  name={'radio-button-unchecked'}
                  size={24}
                  color={COLORS.pujaTextSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {index !== panditjiData.length - 1 && <View style={styles.separator} />}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('no_pandit_found')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader
        title={t('select_panditji')}
        showBellButton={true}
        showBackButton={true}
        onBackPress={() => navigation.replace('UserHomeScreen')}
        onNotificationPress={handleNotificationPress}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalScale(90)}>
        <View style={styles.absoluteMainContainer}>
          <View style={[styles.container, THEMESHADOW.shadow]}>
            {renderSearchInput()}
            <FlatList
              data={panditjiData}
              renderItem={renderPanditjiItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={renderEmptyComponent}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.white,
    margin: 24,
    borderRadius: 10,
    overflow: 'hidden',
  },
  absoluteMainContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  searchContainer: {},
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.inputBoder,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: scale(12),
  },
  searchInput: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
  },
  listContent: {},
  panditjiContainer: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(30),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaTextSecondary,
    textAlign: 'center',
  },
});

export default SelectNewPanditjiScreen;
