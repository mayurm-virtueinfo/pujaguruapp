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
import {COLORS, wp} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {apiService} from '../../../api/apiService';
import CustomHeader from '../../../components/CustomHeader';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';

interface PanditjiItem {
  id: string;
  name: string;
  location: string;
  languages: string;
  image: string;
  isSelected: boolean;
  isVerified: boolean;
}

const PanditjiScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const {t, i18n} = useTranslation();

  const navigation =
    useNavigation<StackNavigationProp<UserPoojaListParamList>>();
  const [searchText, setSearchText] = useState('');
  const [panditjiData, setPanditjiData] = useState<PanditjiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPanditjiData = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getPanditListData();
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
        setPanditjiData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPanditjiData();
  }, []);

  const handlePanditjiSelect = (id: string) => {
    setPanditjiData(prev =>
      prev.map(item => ({
        ...item,
        isSelected: item.id === id,
      })),
    );
    navigation.navigate('PanditDetailsScreen');
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
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.pujaTextSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {index !== panditjiData.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <CustomeLoader loading={isLoading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader title={t('panditji')} showBellButton={true} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalScale(90)}>
        <View style={styles.absoluteMainContainer}>
          <View
            style={{
              backgroundColor: COLORS.white,
              margin: 24,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              borderRadius: 10,
              overflow: 'hidden',
            }}>
            {renderSearchInput()}
            <FlatList
              data={panditjiData}
              renderItem={renderPanditjiItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
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
});

export default PanditjiScreen;
