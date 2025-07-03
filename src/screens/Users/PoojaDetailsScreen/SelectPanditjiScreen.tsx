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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {COLORS, hp, wp} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {apiService} from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

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
  // Set up navigation with correct type for stack navigation
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation =
    useNavigation<StackNavigationProp<UserPoojaListParamList>>();
  const [searchText, setSearchText] = useState('');
  const [selectedPanditji, setSelectedPanditji] = useState<string | null>(null);

  const [panditjiData, setPanditjiData] = useState<PanditjiItem[]>([]);

  // Fetch Panditji data from API
  useEffect(() => {
    const fetchPanditjiData = async () => {
      try {
        const data = await apiService.getPanditListData();
        // Map API data to PanditjiItem shape if needed
        // Assuming API returns array of objects with id, name, location, languages, image, isVerified
        // If not, adjust mapping accordingly
        const mappedData: PanditjiItem[] = data.map(
          (item: any, idx: number) => ({
            id: item.id?.toString() ?? `${idx + 1}`,
            name: item.name ?? '',
            location: item.location ?? '',
            languages: item.languages ?? '',
            image:
              item.image ??
              'https://cdn.builder.io/api/v1/image/assets/TEMP/96feb2dd36d383e6c73ee5b5d01ab81cd72a003a?width=104',
            isSelected: false,
            isVerified: item.isVerified ?? true,
          }),
        );
        setPanditjiData(mappedData);
      } catch (error) {
        // Optionally handle error
        setPanditjiData([]);
      }
    };
    fetchPanditjiData();
  }, []);

  const handlePanditjiSelect = (id: string) => {
    setSelectedPanditji(id);
    setPanditjiData(prev =>
      prev.map(item => ({
        ...item,
        isSelected: item.id === id,
      })),
    );
  };

  const handleNextPress = () => {
    if (selectedPanditji) {
      console.log('Selected Panditji:', selectedPanditji);
      // Pass selectedPanditji as param if needed
      navigation.navigate('PaymentScreen');
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
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
      <StatusBar
        barStyle="light-content"
        // backgroundColor={COLORS.gradientStart}
      />
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
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
          <View style={styles.absoluteButtonContainer}>
            <PrimaryButton
              title={t('next')}
              onPress={handleNextPress}
              disabled={!selectedPanditji}
              textStyle={styles.buttonText}
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
    backgroundColor: COLORS.white, // White background
    borderRadius: moderateScale(20), // Border radius
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4, // Shadow for Android
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
    paddingBottom: verticalScale(20),
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
