import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserPanditjiParamList } from '../../../navigation/User/UserPanditjiNavigator';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { getAllPanditji } from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import { translateData } from '../../../utils/TranslateData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../../../utils/appConstant';

interface PanditjiRawItem {
  id: string | number;
  pandit_id?: string | number;
  full_name?: string;
  profile_img?: string;
  city?: string;
  supported_languages?: string[] | string;
  is_verified?: boolean;
}

interface PanditjiResponse {
  success: boolean;
  message?: string;
  data: PanditjiRawItem[];
}

interface PanditItem {
  id: string;
  pandit_id: string;
  name: string;
  image: string;
  location: string;
  languages: string;
  isVerified: boolean;
}

const PanditjiScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const navigation =
    useNavigation<StackNavigationProp<UserPanditjiParamList>>();
  const [searchText, setSearchText] = useState('');
  const [panditjiData, setPanditjiData] = useState<PanditItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const { showErrorToast } = useCommonToast();
  const translationCacheRef = useRef<Map<string, PanditItem[]>>(new Map());

  const fetchAllPanditji = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        if (!isPullToRefresh) {
          const cachedData = translationCacheRef.current.get(currentLanguage);
          if (cachedData && cachedData.length > 0) {
            setPanditjiData(cachedData);
            setIsLoading(false);
            return;
          }
        }

        const locationStr = await AsyncStorage.getItem(AppConstant.LOCATION);
        let latitude = '';
        let longitude = '';
        if (locationStr) {
          try {
            const locObj = JSON.parse(locationStr);
            latitude = locObj.latitude ?? '';
            longitude = locObj.longitude ?? '';
          } catch (e) {
            console.error('Error parsing location in PanditjiScreen :: ', e);
          }
        }

        const response = (await getAllPanditji(
          latitude,
          longitude,
        )) as PanditjiResponse;

        if (response?.success && Array.isArray(response.data)) {
          const rawList: PanditItem[] = response.data.map(item => {
            let languagesStr = '';
            if (Array.isArray(item.supported_languages)) {
              languagesStr = item.supported_languages.join(', ');
            } else if (typeof item.supported_languages === 'string') {
              languagesStr = item.supported_languages;
            }

            return {
              id: String(item.id ?? item.pandit_id ?? Math.random()),
              pandit_id: String(item.pandit_id ?? item.id ?? ''),
              name: item.full_name || '',
              image: item.profile_img || '',
              location: item.city || '',
              languages: languagesStr,
              isVerified: item.is_verified ?? false,
            };
          });

          const translated = (await translateData(rawList, currentLanguage, [
            'name',
            'location',
            'languages',
          ])) as PanditItem[];

          translationCacheRef.current.set(currentLanguage, translated);
          setPanditjiData(translated);
        } else {
          setPanditjiData([]);
        }
      } catch (error: any) {
        showErrorToast(error?.message || 'Failed to fetch Panditji list');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentLanguage, showErrorToast],
  );

  useEffect(() => {
    fetchAllPanditji();
  }, [fetchAllPanditji]);

  const handlePanditjiSelect = (panditId: string) => {
    navigation.navigate('PanditDetailsScreen', {
      panditId,
      pandit: true,
    });
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  // Instant client-side search filtering
  const filteredPanditjiData = useMemo(() => {
    if (!searchText.trim()) {
      return panditjiData;
    }
    const query = searchText.trim().toLowerCase();
    return panditjiData.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.languages.toLowerCase().includes(query),
    );
  }, [panditjiData, searchText]);

  const renderSearchInput = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
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

  const renderPanditjiItem = ({ item }: { item: PanditItem }) => {
    const hasImageError = imageErrors[item.id];
    const imageUri = !hasImageError && item.image ? item.image : '';

    return (
      <TouchableOpacity
        style={styles.panditCard}
        onPress={() => handlePanditjiSelect(item.pandit_id)}
        activeOpacity={0.75}
      >
        <View style={styles.panditCardContent}>
          {/* Avatar with fallback and badge */}
          <View style={styles.avatarWrapper}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => handleImageError(item.id)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={26} color={COLORS.primary} />
              </View>
            )}
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

          {/* Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.panditName} numberOfLines={1}>
              {item.name}
            </Text>

            {item.location ? (
              <View style={styles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={COLORS.primary}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaLocationText} numberOfLines={1}>
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
                <Text style={styles.metaLanguagesText} numberOfLines={1}>
                  {item.languages}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Forward Action Icon */}
          <View style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={17} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="people-outline"
            size={36}
            color={COLORS.pujaCardSubtext}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {t('no_pandit_found') || 'No pandit found.'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t('try_different_search') ||
            'Try searching with a different name, city, or language'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading && !isRefreshing} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader title={t('panditji') || 'Panditji'} />

      <View style={styles.sheetContainer}>
        {renderSearchInput()}

        <FlatList
          data={filteredPanditjiData}
          renderItem={renderPanditjiItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchAllPanditji(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
  },
  searchContainer: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(10),
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(14),
    height: verticalScale(44),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: moderateScale(4),
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(24),
  },
  panditCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(13),
    marginBottom: verticalScale(11),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  panditCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: scale(13),
  },
  avatarImage: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  avatarFallback: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#FFF0F1',
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(8),
    padding: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  panditName: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    marginBottom: verticalScale(3),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  metaIcon: {
    marginRight: scale(5),
  },
  metaLocationText: {
    color: COLORS.pujaTextSecondary,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12.5),
    flex: 1,
  },
  metaLanguagesText: {
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    flex: 1,
  },
  chevronButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  emptyContainer: {
    paddingVertical: verticalScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(30),
  },
  emptyIconCircle: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaTextSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
});

export default PanditjiScreen;
