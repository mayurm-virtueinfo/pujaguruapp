import React, { useEffect, useRef, useState } from 'react';
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
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import {
  translateData,
  translateOne,
  translateText,
} from '../../../utils/TranslateData';

type ArrangedItem =
  | { name: string; quantity?: string | number; units?: string }
  | string;

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

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'UserPoojaDetails'
  >;

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language;

  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute() as any; // accept any, maybe route?.params?.params
  const { showErrorToast } = useCommonToast();

  const resolvedParams = (() => {
    if (route?.params?.poojaId) return route.params;
    if (route?.params?.params && route?.params?.params.poojaId)
      return route.params.params;
    return {};
  })();

  // Extract these fields safely from resolvedParams
  const { poojaId, panditId, panditName, panditImage, panditCity } =
    resolvedParams;

  const [data, setData] = useState<PujaDetails | null>(null);
  const [originalData, setOriginalData] = useState<PujaDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(
    null,
  );
  const [selectPrice, setSelectPrice] = useState<string>('');
  const [userItemsExpanded, setUserItemsExpanded] = useState<boolean>(false);
  const [panditItemsExpanded, setPanditItemsExpanded] =
    useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);

  const translationCacheRef = useRef<Map<string, PujaDetails>>(new Map());

  console.log('data :: ', data);

  // `poojaId` may be number or string
  useEffect(() => {
    if (poojaId) {
      fetchPoojaDetails(String(poojaId));
    }
  }, [poojaId, panditId]);

  // Defensive: also update translation on language change
  useEffect(() => {
    if (!originalData) return;
    let mounted = true;
    const handleTranslation = async () => {
      setLoading(true);
      try {
        // Use language-cached translation
        const cached = translationCacheRef.current.get(currentLanguage);
        if (cached) {
          if (mounted) setData(cached);
          setLoading(false);
          return;
        }
        const translated = await translateData(originalData, currentLanguage, [
          'title',
          'short_description',
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

  const fetchPoojaDetails = async (id: string) => {
    setLoading(true);
    try {
      let response: any;
      // We must supply both panditId & poojaId if panditId is present (number or string)
      if (panditId !== undefined && panditId !== null && panditId !== '') {
        response = await getPoojaDetails(panditId, id);
      } else {
        response = await getPoojaDetailsForPujaList(id);
      }
      console.log('response.data :: ', response.data);
      if (response && response.success) {
        setOriginalData(response.data);
        setData(response.data);
      } else {
        setOriginalData(null);
        setData(null);
      }
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || 'Failed to fetch puja details',
      );
      setOriginalData(null);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getPricingOptions = (data: PujaDetails): PricingOption[] => [
    {
      id: 1,
      priceDes: t('with_puja_items'),
      price: String(data.price_with_samagri ?? data.base_price),
      withPujaItem: true,
    },
    {
      id: 2,
      priceDes: t('without_puja_items'),
      price: String(data.price_without_samagri ?? data.base_price),
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
      price: selectPrice,
      panditId: panditId,
      panditName: panditName,
      panditImage: panditImage,
      description: originalData?.short_description,
      panditCity: panditCity,
    });
  };

  const handleCheckboxToggle = (id: number, price: string) => {
    setSelectedPricingId(id === selectedPricingId ? null : id);
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
    <View style={[styles.reviewCard, THEMESHADOW.shadow]}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUserName}>{item.user_name}</Text>
        <View style={styles.reviewRatingRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <Octicons
              key={i}
              name="star-fill"
              size={16}
              color={
                i <= item.rating
                  ? COLORS.primaryBackgroundButton
                  : COLORS.inputBoder
              }
              style={styles.reviewStar}
            />
          ))}
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('PanditDetailsScreen', {
            panditId: item.pandit_id?.toString(),
          })
        }
        style={{ flexDirection: 'row', gap: 5 }}
      >
        <Text style={styles.PanditName}>
          {item.pandit_name ? `Pandit :` : ''}
        </Text>
        <Text style={styles.reviewPanditName}>
          {item.pandit_name ? `${item.pandit_name}` : ''}
        </Text>
      </TouchableOpacity>
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
      return (
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>
            {t('user_reviews') || 'User Reviews'}
          </Text>
          <Text style={styles.noReviewsText}>{t('no_review_text')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.sectionTitle}>
          {t('user_reviews') || 'User Reviews'}
        </Text>
        <FlatList
          data={data.user_reviews}
          keyExtractor={item => item.id.toString()}
          renderItem={renderUserReview}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </View>
    );
  };

  const ExpandableSection = ({
    title,
    expanded,
    onPress,
    items,
    emptyText,
    testID,
  }: {
    title: string;
    expanded: boolean;
    onPress: () => void;
    items: ArrangedItem[] | undefined;
    emptyText: string;
    testID?: string;
  }) => {
    const normalizedItems = normalizeArrangedItems(items);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    console.log('normalizedItems :: ', normalizedItems);

    useEffect(() => {
      if (expanded) {
        // Trigger layout animation for smooth expand
        LayoutAnimation.configureNext(
          LayoutAnimation.create(
            300,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.opacity,
          ),
        );
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // Trigger layout animation for smooth collapse
        LayoutAnimation.configureNext(
          LayoutAnimation.create(
            250,
            LayoutAnimation.Types.easeInEaseOut,
            LayoutAnimation.Properties.opacity,
          ),
        );
        fadeAnim.setValue(0);
      }
    }, [expanded]);

    const handleToggle = () => {
      onPress();
    };

    if (!normalizedItems || normalizedItems.length === 0) {
      return (
        <View style={styles.expandableSectionWrapper}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={[styles.itemsContainer, THEMESHADOW.shadow]}>
            <Text style={styles.itemText}>{emptyText}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.expandableSectionWrapper}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.itemsContainer, THEMESHADOW.shadow]}>
          {!expanded ? (
            <>
              {/* Collapsed state: Show only first item (non-clickable) */}
              <View style={styles.itemRow}>
                <View style={styles.itemMainContent}>
                  <Octicons
                    name="dot-fill"
                    size={12}
                    color={COLORS.primary}
                    style={styles.bulletIcon}
                  />
                  <Text style={styles.itemNameText} numberOfLines={1}>
                    {normalizedItems[0].name}
                  </Text>
                </View>
                {normalizedItems[0].quantity ? (
                  <Text style={styles.itemQuantityText}>
                    {`${normalizedItems[0].quantity} ${
                      normalizedItems[0].units ?? ''
                    }`.trim()}
                  </Text>
                ) : null}
              </View>
              {/* Show More button - only interactive element */}
              {normalizedItems.length > 1 && (
                <TouchableOpacity
                  onPress={handleToggle}
                  activeOpacity={0.7}
                  style={styles.showMoreButton}
                  testID={testID ? `${testID}-more` : undefined}
                >
                  <Text style={styles.showMoreText}>{t('show_more')}</Text>
                  <Octicons
                    name="chevron-down"
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Expanded state: Show all items */}
              {normalizedItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemMainContent}>
                      <Octicons
                        name="dot-fill"
                        size={12}
                        color={COLORS.primary}
                        style={styles.bulletIcon}
                      />
                      <Text style={styles.itemNameText}>{item.name}</Text>
                    </View>
                    {item.quantity ? (
                      <Text style={styles.itemQuantityText}>
                        {`${item.quantity} ${item.units ?? ''}`.trim()}
                      </Text>
                    ) : null}
                  </View>
                  {idx < normalizedItems.length - 1 && (
                    <View style={styles.itemDivider} />
                  )}
                </React.Fragment>
              ))}
              {/* Show Less button */}
              {normalizedItems.length > 1 && (
                <TouchableOpacity
                  onPress={handleToggle}
                  activeOpacity={0.7}
                  style={styles.showLessButton}
                  testID={testID ? `${testID}-collapse` : undefined}
                >
                  <Text style={styles.showLessText}>{t('show_less')}</Text>
                  <Octicons
                    name="chevron-up"
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>
      </View>
    );
  };

  const handleMainImagePress = () => {
    if (data?.image_url) {
      setModalImageUri(data.image_url);
      setImageModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('puja_details')} showBackButton={true} />
      <View style={styles.flexGrow}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.imageContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleMainImagePress}
                testID="main-puja-image"
              >
                <Image
                  source={{
                    uri: data?.image_url,
                  }}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.titelText}>{data?.title ?? ''}</Text>
            <View style={styles.detailsContainer}>
              <Text style={styles.descriptionText}>
                {data?.description ||
                  data?.short_description ||
                  'No description available'}
              </Text>
              <Text style={styles.sectionTitle}>{t('pricing_options')}</Text>
              <View style={[styles.pricingContainer, THEMESHADOW.shadow]}>
                {data ? (
                  getPricingOptions(data).map((option, idx) => (
                    <React.Fragment key={option.id}>
                      <TouchableOpacity
                        style={styles.pricingOption}
                        activeOpacity={0.7}
                        onPress={() =>
                          handleCheckboxToggle(option.id, option.price)
                        }
                      >
                        <Text style={styles.pricingText}>
                          {option.priceDes} - Rs. {option.price}
                        </Text>
                        <Octicons
                          name={
                            selectedPricingId === option.id
                              ? 'check-circle'
                              : 'circle'
                          }
                          size={24}
                          color={
                            selectedPricingId === option.id
                              ? COLORS.primary
                              : COLORS.inputBoder
                          }
                        />
                      </TouchableOpacity>
                      {idx < getPricingOptions(data).length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <Text style={styles.pricingText}>No pricing available</Text>
                )}
              </View>

              {/* User Arranged Items Expandable */}
              <ExpandableSection
                title={t('user_arranged_items')}
                expanded={userItemsExpanded}
                onPress={() => setUserItemsExpanded(prev => !prev)}
                items={data?.user_arranged_items}
                emptyText="No items required"
                testID="user-arranged-items-section"
              />

              {/* Pandit Arranged Items Expandable */}
              <ExpandableSection
                title={t('pandit_arranged_items')}
                expanded={panditItemsExpanded}
                onPress={() => setPanditItemsExpanded(prev => !prev)}
                items={data?.pandit_arranged_items}
                emptyText="No items provided"
                testID="pandit-arranged-items-section"
              />

              {/* User Reviews Section */}
              {renderReviewsSection()}
            </View>
          </View>
        </ScrollView>
        <View
          style={[
            styles.bottomButtonContainer,
            {
              paddingBottom: inset.bottom || (Platform.OS === 'ios' ? 16 : 12),
            },
          ]}
        >
          <PrimaryButton
            title={t('next')}
            onPress={handleBookNowPress}
            style={styles.buttonContainer}
            textStyle={styles.buttonText}
          />
        </View>
      </View>
      {/* Image Modal for full screen preview */}
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
                  <Octicons name="x" size={20} color="#fff" />
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
  flexGrow: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
    flexGrow: 1,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'justify',
  },
  titelText: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: 4,
  },
  pricingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  itemsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginTop: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletIcon: {
    marginTop: 2,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemNameText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    lineHeight: 22,
    flex: 1,
  },
  itemQuantityText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primary,
    marginLeft: 8,
  },
  itemDivider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 0.5,
    marginVertical: 10,
    opacity: 0.5,
  },
  itemText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
  },
  visualText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    textAlign: 'justify',
  },
  buttonContainer: {
    height: 46,
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  bottomButtonContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  reviewsContainer: {},
  noReviewsText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    opacity: 0.7,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    margin: 14,
    minWidth: 220,
    maxWidth: 260,
  },
  reviewHeader: {
    marginBottom: 5,
    gap: 8,
  },
  reviewUserName: {
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewStar: {
    marginLeft: 1,
  },
  PanditName: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.black,
    opacity: 0.7,
    marginBottom: 2,
  },
  reviewPanditName: {
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryBackgroundButton,
    opacity: 0.7,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    marginBottom: 4,
    marginTop: 2,
  },
  reviewImagesRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  reviewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: COLORS.inputBoder,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    opacity: 0.5,
    marginTop: 2,
  },
  expandableSectionWrapper: {
    marginBottom: 10,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignSelf: 'center',
    minWidth: 140,
  },
  showMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: Fonts.Sen_SemiBold,
    letterSpacing: 0.3,
  },
  showLessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignSelf: 'center',
    minWidth: 140,
  },
  showLessText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: Fonts.Sen_SemiBold,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.inputBoder,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

export default PujaDetailsScreen;
