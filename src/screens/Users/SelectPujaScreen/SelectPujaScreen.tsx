import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import { getPanditPujaList } from '../../../api/apiService';
import Fonts from '../../../theme/fonts';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PrimaryButton from '../../../components/PrimaryButton';
import { translateData } from '../../../utils/TranslateData';

type PujaItem = {
  pooja_id: number;
  pooja_name: string;
  pooja_image: string;
  pooja_caption: string;
  price_with_samagri: string;
  price_without_samagri: string;
  system_price: number;
};

type ScreenNavigationProp = StackNavigationProp<
  UserHomeParamList,
  'SelectPujaScreen'
>;

function formatPrice(priceStr: string | number | undefined): string {
  if (!priceStr) return '0';
  const num = typeof priceStr === 'number' ? priceStr : parseFloat(priceStr);
  if (isNaN(num)) return String(priceStr);
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
}

const SelectPujaScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const { showErrorToast } = useCommonToast();

  const [originalPujaList, setOriginalPujaList] = useState<PujaItem[]>([]);
  const [pujaList, setPujaList] = useState<PujaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPujaId, setSelectedPujaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute() as any;
  const { panditId, panditName, panditImage, panditCity } = route?.params || {};

  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchPujaList = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);
      if (cachedData) {
        setPujaList(cachedData);
        setLoading(false);
        return;
      }

      const data: any = await getPanditPujaList(panditId);
      if (data.success && Array.isArray(data.data)) {
        setOriginalPujaList(data.data);
        const translated: any = await translateData(
          data.data,
          currentLanguage,
          ['pooja_name', 'pooja_caption'],
        );
        translationCacheRef.current.set(currentLanguage, translated);
        setPujaList(translated);
      } else {
        setPujaList([]);
        setOriginalPujaList([]);
      }
    } catch (error: any) {
      showErrorToast(error?.message || 'Failed to fetch puja list');
      setPujaList([]);
    } finally {
      setLoading(false);
    }
  }, [panditId, currentLanguage, showErrorToast]);

  useEffect(() => {
    fetchPujaList();
  }, [fetchPujaList]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectPuja = (pujaId: number) => {
    setSelectedPujaId(prev => (prev === pujaId ? null : pujaId));
  };

  const handleNext = () => {
    if (selectedPujaId) {
      const originalPuja = originalPujaList.find(
        p => p.pooja_id === selectedPujaId,
      );
      navigation.navigate('PoojaDetailScreen', {
        panditId,
        panditName,
        panditImage,
        panditCity,
        poojaId: originalPuja?.pooja_id ?? selectedPujaId,
      });
    }
  };

  const filteredPujaList = useMemo(() => {
    if (!searchQuery.trim()) return pujaList;
    const query = searchQuery.toLowerCase().trim();
    return pujaList.filter(
      item =>
        item.pooja_name?.toLowerCase().includes(query) ||
        item.pooja_caption?.toLowerCase().includes(query),
    );
  }, [pujaList, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.gradientStart}
      />
      <UserCustomHeader
        title={t('puja_booking')}
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: moderateScale(90) + inset.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Selected Pandit Card (Context Header) */}
          {panditName ? (
            <View style={styles.panditCard}>
              {panditImage ? (
                <Image
                  source={{ uri: panditImage }}
                  style={styles.panditAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.panditAvatarPlaceholder}>
                  <Ionicons name="person" size={20} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.panditInfo}>
                <View style={styles.panditTitleRow}>
                  <Text style={styles.panditName} numberOfLines={1}>
                    {panditName}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={12}
                      color="#16A34A"
                    />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.panditSubtitle} numberOfLines={1}>
                  {panditCity
                    ? `${panditCity} • Available for Bookings`
                    : t('selected_panditji') || 'Selected Panditji'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 2. Section Header & Count Badge */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>{t('select_puja')}</Text>
              {pujaList.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredPujaList.length}{' '}
                    {filteredPujaList.length === 1 ? 'Puja' : 'Pujas'}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.sectionSubtitle}>
              {t('choose_the_puja_you_wish_to_book_from_the_list_below')}
            </Text>
          </View>

          {/* 3. Search Bar (when list is sizable) */}
          {pujaList.length > 3 ? (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('search_puja') || 'Search puja by name...'}
                placeholderTextColor="#9CA3AF"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* 4. Puja Cards List */}
          <View style={styles.pujaCardsList}>
            {filteredPujaList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={searchQuery ? 'search-outline' : 'flame-outline'}
                  size={42}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? t('no_matching_puja') || 'No matching puja found'
                    : t('no_puja_found') || 'No puja found.'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t('try_different_search') ||
                      'Try searching with a different term.'
                    : t('no_puja_available_desc') ||
                      'No pujas available for this Panditji at the moment.'}
                </Text>
              </View>
            ) : (
              filteredPujaList.map(puja => {
                const isSelected = selectedPujaId === puja.pooja_id;
                return (
                  <TouchableOpacity
                    key={puja.pooja_id}
                    style={[
                      styles.pujaCard,
                      isSelected && styles.pujaCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleSelectPuja(puja.pooja_id)}
                  >
                    <View style={styles.imageWrapper}>
                      {puja.pooja_image ? (
                        <Image
                          source={{ uri: puja.pooja_image }}
                          style={styles.pujaImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.pujaImagePlaceholder}>
                          <Ionicons
                            name="flame"
                            size={24}
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.cardContentCol}>
                      <Text
                        style={[
                          styles.pujaTitle,
                          isSelected && styles.pujaTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {puja.pooja_name}
                      </Text>
                      {puja.pooja_caption ? (
                        <Text
                          style={styles.pujaCaption}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {puja.pooja_caption}
                        </Text>
                      ) : null}

                      <View style={styles.priceRow}>
                        <Text style={styles.priceText}>
                          ₹{formatPrice(puja.price_with_samagri)}
                        </Text>
                        <View style={styles.samagriBadge}>
                          <Ionicons
                            name="cube-outline"
                            size={11}
                            color="#B45309"
                          />
                          <Text style={styles.samagriBadgeText}>
                            {t('with_samagri')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.radioCol}>
                      <Ionicons
                        name={
                          isSelected ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={24}
                        color={isSelected ? COLORS.primary : '#D1D5DB'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* 5. Fixed Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom:
                inset.bottom > 0 ? inset.bottom - 4 : verticalScale(14),
            },
          ]}
        >
          <PrimaryButton
            title={t('next')}
            onPress={handleNext}
            disabled={!selectedPujaId}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
  },

  /* Pandit Header Card */
  panditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  panditAvatar: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    backgroundColor: '#F3F4F6',
  },
  panditAvatarPlaceholder: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panditInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  panditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  panditName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: moderateScale(10),
    fontFamily: Fonts.Sen_Medium,
    color: '#15803D',
  },
  panditSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    marginTop: verticalScale(2),
  },

  /* Section Header */
  headerSection: {
    marginBottom: moderateScale(14),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(4),
  },
  sectionTitle: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(18),
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: moderateScale(9),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
  },
  countBadgeText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#4B5563',
  },
  sectionSubtitle: {
    color: '#6C7278',
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },

  /* Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(42),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    paddingVertical: 0,
  },

  /* Puja Cards List */
  pujaCardsList: {
    gap: moderateScale(12),
  },
  pujaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    padding: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pujaCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F9',
  },
  imageWrapper: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  pujaImage: {
    width: '100%',
    height: '100%',
  },
  pujaImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
  },
  cardContentCol: {
    flex: 1,
    marginLeft: moderateScale(12),
    paddingRight: moderateScale(6),
  },
  pujaTitle: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    marginBottom: verticalScale(2),
  },
  pujaTitleSelected: {
    color: COLORS.primary,
  },
  pujaCaption: {
    color: '#6B7280',
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
    marginBottom: verticalScale(6),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  priceText: {
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
  },
  samagriBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  samagriBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#B45309',
  },
  radioCol: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(8),
  },

  /* Empty State */
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(36),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  emptyTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(4),
  },
  emptySubtitle: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  nextBtn: {
    marginTop: 0,
  },
});

export default SelectPujaScreen;
