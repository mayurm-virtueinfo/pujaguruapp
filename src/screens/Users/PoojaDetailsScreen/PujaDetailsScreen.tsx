import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  FlatList,
  Modal,
  Pressable,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import CustomeLoader from '../../../components/CustomeLoader';
import { useCommonToast } from '../../../common/CommonToast';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import {
  getPoojaDetails,
  getPoojaDetailsForPujaList,
} from '../../../api/apiService';
import { translateData } from '../../../utils/TranslateData';
import { moderateScale } from 'react-native-size-matters';

type ArrangedItem =
  | { name: string; quantity?: string | number; units?: string }
  | string;

interface UserReview {
  id: number;
  booking: number;
  user_name: string;
  rating: number;
  pandit_id: number;
  pandit_name: string;
  review: string;
  created_at: string;
  images: {
    id: number;
    image: string;
    uploaded_at: string;
    booking: number;
    pooja_name: string;
  }[];
}

interface PujaDetails {
  id: number;
  title: string;
  description: string;
  short_description: string;
  image_url: string;
  base_price: string;
  price_with_samagri?: string | number;
  price_without_samagri?: string | number;
  benifits?: string[];
  features?: string[];
  requirements?: string[];
  retual_steps?: string[];
  suggested_day?: string;
  suggested_tithi?: string;
  duration_minutes?: number;
  is_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  uuid?: string;
  pooja_category?: number;
  pooja_type?: number;
  slug?: string;
  user_arranged_items?: ArrangedItem[];
  pandit_arranged_items?: ArrangedItem[];
  user_reviews?: UserReview[];
}

interface PricingOption {
  id: number;
  priceDes: string;
  price: string;
  withPujaItem: boolean;
}

function normalizeArrangedItems(
  items?: ArrangedItem[],
): { name: string; quantity?: string | number; units?: string }[] {
  if (!items) return [];
  return items.map(item =>
    typeof item === 'string'
      ? { name: item }
      : {
          name: item.name,
          quantity: item.quantity,
          units: item.units,
        },
  );
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableSectionProps {
  title: string;
  badgeCount?: number;
  badgeLabel?: string;
  iconName: string;
  iconColor: string;
  badgeBg?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  expanded: boolean;
  onPress: () => void;
  items: ArrangedItem[] | undefined;
  emptyText: string;
  noteText?: string;
  testID?: string;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  badgeCount = 0,
  badgeLabel,
  iconName,
  iconColor,
  badgeBg = '#F3F4F6',
  badgeTextColor = '#374151',
  badgeBorderColor = '#E5E7EB',
  expanded,
  onPress,
  items,
  emptyText,
  noteText,
  testID,
}) => {
  const normalizedItems = normalizeArrangedItems(items);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [expanded]);

  return (
    <View
      style={[
        styles.expandableCard,
        expanded && { borderColor: iconColor },
      ]}
      testID={testID}
    >
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.expandableTitleRow}>
          <View
            style={[
              styles.expandableIconCircle,
              { backgroundColor: badgeBg },
            ]}
          >
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
          <View style={styles.expandableTextCol}>
            <Text style={styles.expandableTitle}>{title}</Text>
            {badgeLabel ? (
              <Text style={styles.expandableSubText}>{badgeLabel}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.expandableHeaderRight}>
          {badgeCount > 0 ? (
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: badgeBg,
                  borderColor: badgeBorderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgePillText,
                  { color: badgeTextColor },
                ]}
              >
                {badgeCount} {badgeCount === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          ) : null}
          <View style={styles.chevronCircle}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color="#4B5563"
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandableContent}>
          {noteText ? (
            <View
              style={[
                styles.expandableNoteBanner,
                { backgroundColor: badgeBg },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={iconColor}
              />
              <Text
                style={[
                  styles.expandableNoteText,
                  { color: badgeTextColor },
                ]}
              >
                {noteText}
              </Text>
            </View>
          ) : null}

          {normalizedItems.length === 0 ? (
            <View style={styles.emptyItemsWrapper}>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#9CA3AF"
              />
              <Text style={styles.emptyItemsText}>{emptyText}</Text>
            </View>
          ) : (
            normalizedItems.map((item, idx) => (
              <View key={idx} style={styles.itemCardRow}>
                <View style={styles.itemIndexPill}>
                  <Text style={styles.itemIndexText}>{idx + 1}</Text>
                </View>
                <Text style={styles.itemNameText}>{item.name}</Text>
                {item.quantity ? (
                  <View style={styles.itemQuantityBadge}>
                    <Text style={styles.itemQuantityText}>
                      {`${item.quantity} ${item.units ?? ''}`.trim()}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const PujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'UserPoojaDetails'
  >;

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language;

  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute() as any;
  const { showErrorToast } = useCommonToast();
  const showErrorToastRef = useRef(showErrorToast);
  useEffect(() => {
    showErrorToastRef.current = showErrorToast;
  }, [showErrorToast]);

  const resolvedParams = (() => {
    if (route?.params?.poojaId) return route.params;
    if (route?.params?.params && route?.params?.params.poojaId)
      return route.params.params;
    return {};
  })();

  const { poojaId, panditId, panditName, panditImage, panditCity } =
    resolvedParams;

  const [data, setData] = useState<PujaDetails | null>(null);
  const [originalData, setOriginalData] = useState<PujaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(1);
  const [selectPrice, setSelectPrice] = useState<string>('');
  const [userItemsExpanded, setUserItemsExpanded] = useState<boolean>(false);
  const [panditItemsExpanded, setPanditItemsExpanded] =
    useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);

  const translationCacheRef = useRef<Map<string, PujaDetails>>(new Map());

  const fetchPoojaDetails = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        let response: any;
        if (panditId !== undefined && panditId !== null && panditId !== '') {
          response = await getPoojaDetails(panditId, id);
        } else {
          response = await getPoojaDetailsForPujaList(id);
        }
        if (response && response.success) {
          const puja = response.data as PujaDetails;
          setOriginalData(puja);
          setData(puja);
          // Default select "With Puja Items"
          setSelectedPricingId(1);
          setSelectPrice(String(puja.price_with_samagri ?? puja.base_price));
        } else {
          setOriginalData(null);
          setData(null);
        }
      } catch (error: any) {
        showErrorToastRef.current?.(
          error?.response?.data?.message || 'Failed to fetch puja details',
        );
        setOriginalData(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [panditId],
  );

  useEffect(() => {
    if (poojaId) {
      fetchPoojaDetails(String(poojaId));
    }
  }, [poojaId, fetchPoojaDetails]);

  useEffect(() => {
    if (!originalData) return;
    let mounted = true;
    const handleTranslation = async () => {
      setLoading(true);
      try {
        const cached = translationCacheRef.current.get(currentLanguage);
        if (cached) {
          if (mounted) setData(cached);
          setLoading(false);
          return;
        }
        const translated = await translateData(originalData, currentLanguage, [
          'title',
          'short_description',
          'description',
          'user_arranged_items',
          'pandit_arranged_items',
          'user_reviews',
          'benifits',
          'features',
          'retual_steps',
        ]);
        translationCacheRef.current.set(
          currentLanguage,
          translated as PujaDetails,
        );
        if (mounted) setData(translated as PujaDetails);
      } catch (err) {
        console.error('Translation error :: ', err);
        if (mounted) setData(originalData);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    handleTranslation();
    return () => {
      mounted = false;
    };
  }, [currentLanguage, originalData]);

  const getPricingOptions = (puja: PujaDetails): PricingOption[] => [
    {
      id: 1,
      priceDes: t('with_puja_items') || 'With Puja Samagri',
      price: String(puja.price_with_samagri ?? puja.base_price),
      withPujaItem: true,
    },
    {
      id: 2,
      priceDes: t('without_puja_items') || 'Without Puja Samagri',
      price: String(puja.price_without_samagri ?? puja.base_price),
      withPujaItem: false,
    },
  ];

  const getSelectedPricingOption = (): PricingOption | undefined => {
    if (!data || selectedPricingId == null) return undefined;
    return getPricingOptions(data).find(opt => opt.id === selectedPricingId);
  };

  const handleBookNowPress = () => {
    const selectedOption = getSelectedPricingOption();
    if (!selectedOption) {
      showErrorToast(t('please_select_pricing_option'));
      return;
    }
    navigation.navigate('PlaceSelectionScreen', {
      poojaId: poojaId,
      samagri_required: selectedOption.withPujaItem,
      puja_image: originalData?.image_url ?? '',
      puja_name: originalData?.title ?? '',
      price: selectPrice || selectedOption.price,
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
      description: originalData?.short_description,
      panditCity: panditCity,
    });
  };

  const handlePricingSelect = (id: number, price: string) => {
    setSelectedPricingId(id);
    setSelectPrice(price);
  };

  const handleReviewImagePress = (uri: string) => {
    setModalImageUri(uri);
    setImageModalVisible(true);
  };

  const renderReviewImages = (images: UserReview['images']) => {
    if (!images || images.length === 0) return null;
    return (
      <View style={styles.reviewImagesRow}>
        {images.map(img => (
          <TouchableOpacity
            key={img.id}
            onPress={() => handleReviewImagePress(img.image)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: img.image }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderUserReview = ({ item }: { item: UserReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.reviewUserInfo}>
          <Text style={styles.reviewUserName}>{item.user_name}</Text>
          <View style={styles.reviewRatingRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons
                key={i}
                name="star"
                size={13}
                color={i <= item.rating ? '#FFB900' : '#E0E0E0'}
                style={styles.reviewStar}
              />
            ))}
          </View>
        </View>
      </View>
      {item.pandit_name ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            (navigation as any).navigate('PanditDetailsScreen', {
              panditId: item.pandit_id?.toString(),
            })
          }
          style={styles.panditBadgeRow}
        >
          <Ionicons name="person-circle-outline" size={14} color={COLORS.primary} />
          <Text style={styles.panditBadgeText}>{item.pandit_name}</Text>
        </TouchableOpacity>
      ) : null}
      {item.review ? (
        <Text style={styles.reviewText}>{item.review}</Text>
      ) : null}
      {renderReviewImages(item.images)}
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderReviewsSection = () => {
    if (!data?.user_reviews || data.user_reviews.length === 0) {
      return null;
    }
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="star" size={18} color="#FFB900" />
          <Text style={styles.sectionTitle}>
            {t('user_reviews') || 'Devotee Reviews'}
          </Text>
        </View>
        <FlatList
          data={data.user_reviews}
          keyExtractor={item => item.id.toString()}
          renderItem={renderUserReview}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewsListContent}
        />
      </View>
    );
  };

  const panditItemsCount = data?.pandit_arranged_items?.length || 0;
  const userItemsCount = data?.user_arranged_items?.length || 0;
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBackground} />
      <UserCustomHeader title={t('puja_details')} showBackButton={true} />

      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={{
            paddingBottom: moderateScale(90),
          }}
        >
          {/* 1. Hero Image Section */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  data?.image_url ||
                  'https://images.moneycontrol.com/static-mcnews/2024/09/20240904040802_Lord-Ganesha.jpg',
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* 2. Title & Key Info Chips */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{data?.title ?? ''}</Text>

            <View style={styles.metaChipsRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                <Text style={styles.metaChipText}>1.5 - 2 Hours</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="home-outline" size={13} color={COLORS.primary} />
                <Text style={styles.metaChipText}>At Your Location</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="sparkles-outline" size={13} color={COLORS.primary} />
                <Text style={styles.metaChipText}>Authentic Vidhi</Text>
              </View>
            </View>
          </View>

          {/* 3. About / Significance Section (Deduplicated) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="book-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>
                {t('benefits') || 'Significance & Benefits'}
              </Text>
            </View>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                {data?.description || data?.short_description || 'No description available'}
              </Text>
            </View>
          </View>

          {/* 4. Pricing Option Cards */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="pricetag-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('pricing_options')}</Text>
            </View>

            <View style={styles.pricingCardsContainer}>
              {data ? (
                getPricingOptions(data).map(option => {
                  const isSelected = selectedPricingId === option.id;
                  const isWithSamagri = option.withPujaItem;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.pricingCard,
                        isSelected && styles.pricingCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handlePricingSelect(option.id, option.price)}
                    >
                      {isWithSamagri && (
                        <View style={styles.recommendedBadge}>
                          <Ionicons name="sparkles" size={10} color="#9C6800" />
                          <Text style={styles.recommendedBadgeText}>
                            MOST POPULAR
                          </Text>
                        </View>
                      )}

                      <View style={styles.pricingCardBody}>
                        <View style={styles.pricingCardLeft}>
                          <Ionicons
                            name={
                              isSelected
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={22}
                            color={
                              isSelected ? COLORS.primary : COLORS.border
                            }
                          />
                          <View style={styles.pricingTextColumn}>
                            <Text
                              style={[
                                styles.pricingOptionTitle,
                                isSelected && styles.pricingOptionTitleSelected,
                              ]}
                            >
                              {option.priceDes}
                            </Text>
                            <Text style={styles.pricingOptionSubtext}>
                              {isWithSamagri
                                ? panditItemsCount > 0
                                  ? `Panditji brings all ${panditItemsCount} sacred samagri items`
                                  : 'Panditji brings all required sacred items'
                                : 'Puja vidhi only (You arrange samagri)'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.pricingAmountCol}>
                          <Text
                            style={[
                              styles.pricingAmountText,
                              isSelected && styles.pricingAmountTextSelected,
                            ]}
                          >
                            ₹{option.price}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyItemsText}>No pricing available</Text>
              )}
            </View>
          </View>

          {/* 5. Pandit & User Arranged Samagri Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>
                {t('arranged_items') || 'Puja Samagri & Items'}
              </Text>
            </View>

            <View style={styles.arrangedCardsContainer}>
              <ExpandableSection
                title={t('pandit_arranged_items')}
                badgeCount={panditItemsCount}
                badgeLabel="Brought & provided by Panditji"
                iconName="cube"
                iconColor="#15803D"
                badgeBg="#F0FDF4"
                badgeTextColor="#15803D"
                badgeBorderColor="#BBF7D0"
                noteText="Panditji will bring all sacred vidhi items with them on puja day."
                expanded={panditItemsExpanded}
                onPress={() => setPanditItemsExpanded(prev => !prev)}
                items={data?.pandit_arranged_items}
                emptyText={t('no_pandit_items') || 'No items required by Panditji'}
                testID="pandit-arranged-items-section"
              />

              <ExpandableSection
                title={t('user_arranged_items')}
                badgeCount={userItemsCount}
                badgeLabel="Basic items to keep ready at home"
                iconName="basket"
                iconColor="#C2410C"
                badgeBg="#FFF7ED"
                badgeTextColor="#C2410C"
                badgeBorderColor="#FED7AA"
                noteText="Please arrange and keep these household items ready before Panditji arrives."
                expanded={userItemsExpanded}
                onPress={() => setUserItemsExpanded(prev => !prev)}
                items={data?.user_arranged_items}
                emptyText={t('no_user_items') || 'No items required to arrange'}
                testID="user-arranged-items-section"
              />
            </View>
          </View>

          {/* 7. Devotee Reviews Section */}
          {renderReviewsSection()}
        </ScrollView>

        {/* 8. Bottom Action Button */}
        <View
          style={[
            styles.bottomButtonContainer,
            {
              paddingBottom: moderateScale(16),
            },
          ]}
        >
          <PrimaryButton title={t('next')} onPress={handleBookNowPress} />
        </View>
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {modalImageUri ? (
              <>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setImageModalVisible(false)}
                  activeOpacity={0.8}
                  testID="close-image-modal"
                >
                  <Octicons name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Image
                  source={{ uri: modalImageUri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },

  /* Hero Section */
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },

  /* Title & Meta Section */
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E3',
  },
  metaChipText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
  },

  /* Sections */
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.2,
  },

  /* About / Significance Card */
  aboutCard: {
    ...THEMESHADOW.shadow,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3.5,
    borderLeftColor: '#FFA000',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  aboutText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: '#424242',
    lineHeight: 22,
  },

  /* Pricing Cards */
  pricingCardsContainer: {
    gap: 12,
  },
  pricingCard: {
    ...THEMESHADOW.shadow,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E8ECEF',
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF9F9',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FEF3D6',
    borderWidth: 1,
    borderColor: '#FAD889',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.Sen_Bold,
    color: '#8A5D00',
    letterSpacing: 0.4,
  },
  pricingCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  pricingTextColumn: {
    flex: 1,
  },
  pricingOptionTitle: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    marginBottom: 3,
  },
  pricingOptionTitleSelected: {
    color: COLORS.primary,
  },
  pricingOptionSubtext: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    color: '#666666',
    lineHeight: 16,
  },
  pricingAmountCol: {
    alignItems: 'flex-end',
  },
  pricingAmountText: {
    fontSize: 18,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  pricingAmountTextSelected: {
    color: COLORS.primary,
  },

  /* Expandable Cards (Samagri) */
  arrangedCardsContainer: {
    gap: 12,
  },
  expandableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  expandableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  expandableIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandableTextCol: {
    flex: 1,
  },
  expandableTitle: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
  },
  expandableSubText: {
    fontSize: 11.5,
    fontFamily: Fonts.Sen_Regular,
    color: '#6B7280',
    marginTop: 2,
  },
  expandableHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Bold,
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandableContent: {
    paddingTop: 12,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
  },
  expandableNoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  expandableNoteText: {
    fontSize: 11.5,
    fontFamily: Fonts.Sen_Medium,
    flex: 1,
    lineHeight: 16,
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemIndexPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemIndexText: {
    fontSize: 11,
    fontFamily: Fonts.Sen_SemiBold,
    color: '#6B7280',
  },
  itemNameText: {
    fontSize: 13.5,
    fontFamily: Fonts.Sen_Medium,
    color: '#1F2937',
    flex: 1,
  },
  itemQuantityBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemQuantityText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  emptyItemsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyItemsText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  /* Reviews */
  reviewsListContent: {
    paddingVertical: 4,
    gap: 12,
  },
  reviewCard: {
    ...THEMESHADOW.shadow,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    width: 260,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  reviewStar: {
    marginRight: 1,
  },
  panditBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  panditBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primary,
  },
  reviewText: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    color: '#4A4A4A',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewImagesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  reviewImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Regular,
    color: '#999999',
  },

  /* Bottom Button Container */
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.pujaBackground,
    paddingHorizontal: 24,
    paddingTop: moderateScale(4),
  },

  /* Fullscreen Image Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#222',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

export default PujaDetailsScreen;
