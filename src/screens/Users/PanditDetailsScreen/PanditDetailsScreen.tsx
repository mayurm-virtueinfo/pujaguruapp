import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { getPanditDetails } from '../../../api/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomeLoader from '../../../components/CustomeLoader';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCommonToast } from '../../../common/CommonToast';
import { useTranslation } from 'react-i18next';
import { translateData } from '../../../utils/TranslateData';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PanditPhotoGalleryItem {
  id: number;
  image: string;
  pooja_name?: string;
  booking?: number;
  uploaded_at?: string;
}

interface UserReviewImage {
  id: number;
  image: string;
  uploaded_at?: string;
  booking?: number;
}

interface UserReview {
  id: number;
  booking: number;
  user_name: string;
  rating: number;
  review: string;
  created_at: string;
  images: UserReviewImage[];
}

interface PanditList {
  pooja: number;
  pooja_title: string;
  pooja_image_url: string;
  price_with_samagri: string;
  price_without_samagri: string;
  price_status: number;
  is_enabled?: boolean;
}

interface PanditDetails {
  id: number;
  uuid: string;
  user: number;
  pandit_name: string;
  pandit_email: string;
  pandit_mobile: string;
  address_city_name: string;
  average_rating: string;
  total_ratings: number;
  bio: string | null;
  profile_img: string;
  pandit_photo_gallery: PanditPhotoGalleryItem[];
  user_reviews: UserReview[];
  pandit_poojas: PanditList[];
}

interface PanditResponse {
  success: boolean;
  data: PanditDetails;
}

const PanditDetailsScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute();
  const routeParams = (route?.params || {}) as {
    panditId?: string | number;
    id?: string | number;
    pandit?: boolean;
  };
  const panditId = routeParams?.panditId ?? routeParams?.id;
  const pandit = routeParams?.pandit;
  const { t, i18n } = useTranslation();
  const { showErrorToast } = useCommonToast();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPandit, setSelectedPandit] = useState<PanditDetails | null>(
    null,
  );
  const [originalPanditData, setOriginalPanditData] =
    useState<PanditDetails | null>(null);
  const [gallery, setGallery] = useState<PanditPhotoGalleryItem[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [pujaList, setPujaList] = useState<PanditList[]>([]);
  const [showAllPuja, setShowAllPuja] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchPanditDetails = useCallback(
    async (id: string) => {
      try {
        setLoading(true);

        const cachedData = translationCacheRef.current.get(currentLanguage);
        if (cachedData) {
          setSelectedPandit(cachedData);
          setGallery(cachedData.pandit_photo_gallery || []);
          setReviews(cachedData.user_reviews || []);
          setPujaList(cachedData.pandit_poojas || []);
          setLoading(false);
          return;
        }

        const response: PanditResponse = await getPanditDetails(id);

        if (response && response.success && response.data) {
          setOriginalPanditData(response.data);
          let translatedData: any = response.data;
          try {
            translatedData = await translateData(
              response.data,
              currentLanguage,
              ['address_city_name', 'bio', 'pandit_name'],
            );

            if (translatedData.pandit_photo_gallery) {
              translatedData.pandit_photo_gallery = await translateData(
                translatedData.pandit_photo_gallery,
                currentLanguage,
                ['pooja_name'],
              );
            }

            if (translatedData.pandit_poojas) {
              translatedData.pandit_poojas = await translateData(
                translatedData.pandit_poojas,
                currentLanguage,
                ['pooja_title'],
              );
            }
          } catch (tErr) {
            console.error('Translation error in PanditDetailsScreen:', tErr);
          }

          translationCacheRef.current.set(currentLanguage, translatedData);
          setSelectedPandit(translatedData);
          setGallery(translatedData.pandit_photo_gallery || []);
          setReviews(translatedData.user_reviews || []);
          setPujaList(translatedData.pandit_poojas || []);
        } else {
          setSelectedPandit(null);
          setOriginalPanditData(null);
          setGallery([]);
          setReviews([]);
          setPujaList([]);
        }
      } catch (error: any) {
        console.error('Error fetching Pandit details:', error);
        showErrorToast(error?.message || 'Failed to fetch Panditji details');
      } finally {
        setLoading(false);
      }
    },
    [showErrorToast, currentLanguage],
  );

  useEffect(() => {
    if (panditId) {
      fetchPanditDetails(String(panditId));
    } else {
      setLoading(false);
    }
  }, [panditId, fetchPanditDetails]);

  const panditName = selectedPandit?.pandit_name || '';
  const panditImage = selectedPandit?.profile_img || '';
  const panditCity = selectedPandit?.address_city_name || '';
  const ratingNum = parseFloat(selectedPandit?.average_rating || '0') || 0;
  const totalReviews = selectedPandit?.total_ratings || 0;

  const renderStars = (count: number, size = 14) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons
            key={i}
            name={i <= count ? 'star' : 'star-outline'}
            size={moderateScale(size)}
            color={i <= count ? '#F59E0B' : '#CBD5E1'}
            style={styles.starIcon}
          />
        ))}
      </View>
    );
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const openImageModal = (images: string[], index: number) => {
    setModalImages(images);
    setInitialImageIndex(index);
    setActivePage(index);
    setModalVisible(true);
  };

  const displayedPujaList =
    showAllPuja || pujaList.length <= 3 ? pujaList : pujaList.slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryBackground}
      />
      <UserCustomHeader
        title={t('panditji_details') || 'Panditji Details'}
        showBackButton={true}
      />

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: inset.bottom + verticalScale(28) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Hero Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              {/* Avatar with fallback and verified badge */}
              <View style={styles.avatarWrapper}>
                {!imageError && panditImage ? (
                  <Image
                    source={{ uri: panditImage }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={36} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <MaterialIcons
                    name="verified"
                    size={16}
                    color={COLORS.success}
                  />
                </View>
              </View>

              {/* Pandit Info */}
              <View style={styles.profileInfo}>
                <Text style={styles.panditNameText} numberOfLines={1}>
                  {panditName || 'Pandit Name'}
                </Text>

                {panditCity ? (
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={14}
                      color={COLORS.primary}
                      style={styles.locationIcon}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {panditCity}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.ratingBadgeRow}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingPillText}>
                      {ratingNum > 0 ? ratingNum.toFixed(1) : 'New'}
                    </Text>
                  </View>
                  <Text style={styles.reviewsCountText}>
                    ({totalReviews} {t('reviews') || 'Reviews'})
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Ribbon */}
            <View style={styles.statsRibbon}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{pujaList.length}</Text>
                <Text style={styles.statLabel}>
                  {t('puja_list') || 'Pujas'}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {ratingNum > 0 ? ratingNum.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabel}>{t('ratings') || 'Rating'}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalReviews}</Text>
                <Text style={styles.statLabel}>
                  {t('reviews') || 'Reviews'}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. About Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {t('about_panditji') || 'About Panditji'}
              </Text>
            </View>
            <Text style={styles.bioText}>
              {selectedPandit?.bio
                ? selectedPandit.bio
                : panditName
                ? `Pandit ${panditName} is highly experienced and well-versed in Hindu rituals and ceremonies, specializing in traditional Vedic pujas.`
                : 'Pandit details will appear here.'}
            </Text>
          </View>

          {/* 3. Photo Gallery Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="images-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {t('photo_gallery') || 'Photo Gallery'}
              </Text>
              {gallery.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{gallery.length}</Text>
                </View>
              )}
            </View>

            {gallery.length > 0 ? (
              <FlatList
                data={gallery}
                keyExtractor={item => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryListContent}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.galleryCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      const allImages = gallery.map(g => g.image);
                      openImageModal(allImages, index);
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.galleryCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.galleryLabelOverlay}>
                      <Ionicons
                        name="camera-outline"
                        size={12}
                        color={COLORS.white}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.galleryLabelText} numberOfLines={1}>
                        {item.pooja_name || 'Puja Ritual'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyCardState}>
                <Ionicons
                  name="images-outline"
                  size={32}
                  color={COLORS.pujaCardSubtext}
                />
                <Text style={styles.emptyCardText}>
                  {t('no_photo_gallery_available') ||
                    'No photo gallery available.'}
                </Text>
              </View>
            )}
          </View>

          {/* 4. Pujas Offered Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="flame-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {t('pujas_offered') || 'Pujas Offered'}
              </Text>
              {pujaList.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{pujaList.length}</Text>
                </View>
              )}
            </View>

            {pujaList.length > 0 ? (
              <View style={styles.pujaListWrapper}>
                {displayedPujaList.map(item => (
                  <TouchableOpacity
                    key={item.pooja}
                    style={styles.pujaCard}
                    activeOpacity={pandit ? 0.75 : 1}
                    onPress={() => {
                      if (pandit) {
                        navigation.navigate('PoojaDetailScreen', {
                          params: {
                            poojaId: item.pooja,
                            panditId: panditId,
                            panditName: originalPanditData?.pandit_name,
                            panditImage: originalPanditData?.profile_img,
                            panditCity: originalPanditData?.address_city_name,
                          },
                        });
                      }
                    }}
                  >
                    <Image
                      source={{ uri: item.pooja_image_url }}
                      style={styles.pujaImage}
                      resizeMode="cover"
                    />

                    <View style={styles.pujaInfo}>
                      <Text style={styles.pujaTitleText} numberOfLines={1}>
                        {item.pooja_title}
                      </Text>

                      <View style={styles.priceRow}>
                        <View style={styles.priceChipPrimary}>
                          <Text style={styles.priceChipPrimaryValue}>
                            ₹{item.price_with_samagri}
                          </Text>
                          <Text style={styles.priceChipPrimaryLabel}>
                            {t('with_samagri') || 'With Samagri'}
                          </Text>
                        </View>

                        <View style={styles.priceChipSecondary}>
                          <Text style={styles.priceChipSecondaryValue}>
                            ₹{item.price_without_samagri}
                          </Text>
                          <Text style={styles.priceChipSecondaryLabel}>
                            {t('without_samagri') || 'Without Samagri'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {pandit ? (
                      <View style={styles.pujaActionCircle}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={COLORS.primary}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}

                {pujaList.length > 3 && (
                  <TouchableOpacity
                    style={styles.toggleMoreButton}
                    onPress={() => setShowAllPuja(!showAllPuja)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleMoreText}>
                      {showAllPuja
                        ? t('show_less') || 'Show Less'
                        : `${t('show_more') || 'Show More'} (${
                            pujaList.length - 3
                          })`}
                    </Text>
                    <Ionicons
                      name={showAllPuja ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyCardState}>
                <Ionicons
                  name="flame-outline"
                  size={32}
                  color={COLORS.pujaCardSubtext}
                />
                <Text style={styles.emptyCardText}>
                  {t('no_puja_performed_data_available') ||
                    'No puja performed data available.'}
                </Text>
              </View>
            )}
          </View>

          {/* 5. Reviews Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="star-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.sectionHeaderTitle}>
                {t('ratings_and_reviews') || 'Ratings & Reviews'}
              </Text>
              {reviews.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{reviews.length}</Text>
                </View>
              )}
            </View>

            {reviews.length > 0 ? (
              <View style={styles.reviewsWrapper}>
                {/* Rating Overview Banner */}
                <View style={styles.ratingOverviewBanner}>
                  <View style={styles.ratingOverviewLeft}>
                    <Text style={styles.ratingBigScore}>
                      {ratingNum > 0 ? ratingNum.toFixed(1) : '5.0'}
                    </Text>
                    {renderStars(Math.round(ratingNum || 5), 14)}
                  </View>
                  <View style={styles.ratingOverviewRight}>
                    <Text style={styles.ratingOverviewTitle}>
                      {ratingNum >= 4.5
                        ? 'Excellent Experience'
                        : 'Customer Feedback'}
                    </Text>
                    <Text style={styles.ratingOverviewSubtitle}>
                      Based on {reviews.length} verified review
                      {reviews.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {reviews.map((review, idx) => (
                  <View key={review.id} style={styles.reviewItemCard}>
                    <View style={styles.reviewHeaderRow}>
                      <View style={styles.reviewerAvatar}>
                        <Ionicons
                          name="person"
                          size={18}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName} numberOfLines={1}>
                          {review.user_name || 'Devotee'}
                        </Text>
                        <Text style={styles.reviewDateText}>
                          {formatDate(review.created_at)}
                        </Text>
                      </View>

                      {renderStars(review.rating, 13)}
                    </View>

                    <Text style={styles.reviewBodyText}>
                      {review.review && review.review.trim().length > 0
                        ? `"${review.review}"`
                        : t('no_review_text') || 'No review comment provided.'}
                    </Text>

                    {Array.isArray(review.images) &&
                      review.images.length > 0 && (
                        <View style={styles.reviewImagesContainer}>
                          {review.images.map((imgObj, imgIdx) => (
                            <TouchableOpacity
                              key={imgObj.id}
                              activeOpacity={0.8}
                              onPress={() => {
                                const allReviewImages = review.images.map(
                                  i => i.image,
                                );
                                openImageModal(allReviewImages, imgIdx);
                              }}
                            >
                              <Image
                                source={{ uri: imgObj.image }}
                                style={styles.reviewThumbImage}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    {idx < reviews.length - 1 && (
                      <View style={styles.reviewDivider} />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCardState}>
                <Ionicons
                  name="star-outline"
                  size={32}
                  color={COLORS.pujaCardSubtext}
                />
                <Text style={styles.emptyCardText}>
                  {t('no_review_text') || 'No reviews yet.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {modalImages.length > 0 && (
              <PagerView
                style={styles.pagerView}
                initialPage={initialImageIndex}
                orientation="horizontal"
                onPageSelected={e => setActivePage(e.nativeEvent.position)}
              >
                {modalImages.map((imgUri, index) => (
                  <View key={index} style={styles.pagerSlide}>
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </PagerView>
            )}

            {modalImages.length > 1 && (
              <View style={styles.paginationRow}>
                {modalImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activePage === index
                        ? styles.paginationDotActive
                        : styles.paginationDotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
  },

  /* 1. Profile Hero Card */
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: scale(14),
  },
  avatarImage: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    borderWidth: 2,
    borderColor: '#F1F5F9',
    backgroundColor: '#F1F5F9',
  },
  avatarFallback: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#FFF0F1',
    borderWidth: 2,
    borderColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: 1,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  panditNameText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(17),
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(3),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  locationIcon: {
    marginRight: scale(4),
  },
  locationText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(13),
    color: COLORS.pujaTextSecondary,
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    gap: scale(4),
  },
  ratingPillText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(12.5),
    color: '#B45309',
  },
  reviewsCountText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12),
    color: COLORS.pujaCardSubtext,
  },
  statsRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    color: COLORS.primaryTextDark,
  },
  statLabel: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(11.5),
    color: COLORS.pujaCardSubtext,
    marginTop: verticalScale(1),
  },
  statDivider: {
    width: 1,
    height: verticalScale(24),
    backgroundColor: '#F1F5F9',
  },

  /* Section Card Standards */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  sectionHeaderTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  countPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
  },
  countPillText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(11),
    color: COLORS.pujaTextSecondary,
  },

  /* Bio */
  bioText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13.5),
    color: '#475569',
    lineHeight: moderateScale(20),
  },

  /* Photo Gallery */
  galleryListContent: {
    paddingVertical: verticalScale(2),
    gap: scale(10),
  },
  galleryCard: {
    width: scale(160),
    height: verticalScale(120),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  galleryCardImage: {
    width: '100%',
    height: '100%',
  },
  galleryLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(5),
  },
  galleryLabelText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(11),
    color: COLORS.white,
    flex: 1,
  },

  /* Pujas Offered */
  pujaListWrapper: {
    gap: verticalScale(10),
  },
  pujaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pujaImage: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(10),
    backgroundColor: '#ECEFF1',
    marginRight: scale(12),
  },
  pujaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  pujaTitleText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(14),
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(4),
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
  },
  priceChipPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F1',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    gap: scale(3),
  },
  priceChipPrimaryValue: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(11.5),
    color: COLORS.primary,
  },
  priceChipPrimaryLabel: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(10),
    color: COLORS.primary,
  },
  priceChipSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    gap: scale(3),
  },
  priceChipSecondaryValue: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(11.5),
    color: COLORS.primaryTextDark,
  },
  priceChipSecondaryLabel: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(10),
    color: COLORS.pujaCardSubtext,
  },
  pujaActionCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  toggleMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F1',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(20),
    alignSelf: 'center',
    marginTop: verticalScale(4),
    gap: scale(4),
  },
  toggleMoreText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(12.5),
    color: COLORS.primary,
  },

  /* Reviews */
  reviewsWrapper: {},
  ratingOverviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingOverviewLeft: {
    alignItems: 'center',
    paddingRight: scale(14),
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: scale(14),
  },
  ratingBigScore: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(26),
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(2),
  },
  ratingOverviewRight: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingOverviewTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13.5),
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(2),
  },
  ratingOverviewSubtitle: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(11.5),
    color: COLORS.pujaTextSecondary,
  },
  reviewItemCard: {
    paddingVertical: verticalScale(8),
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  reviewerAvatar: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#FFF0F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13.5),
    color: COLORS.primaryTextDark,
  },
  reviewDateText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(11),
    color: COLORS.pujaCardSubtext,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 1,
  },
  reviewBodyText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12.5),
    color: '#334155',
    lineHeight: moderateScale(18),
    fontStyle: 'italic',
  },
  reviewImagesContainer: {
    flexDirection: 'row',
    marginTop: verticalScale(8),
    gap: scale(8),
  },
  reviewThumbImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(8),
    backgroundColor: '#E2E8F0',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: verticalScale(12),
  },

  /* Empty state within cards */
  emptyCardState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    gap: verticalScale(6),
  },
  emptyCardText: {
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(12.5),
    color: COLORS.pujaCardSubtext,
    textAlign: 'center',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: moderateScale(20),
    padding: moderateScale(6),
  },
  pagerView: {
    width: screenWidth,
    height: screenHeight * 0.75,
  },
  pagerSlide: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  fullImage: {
    width: screenWidth * 0.92,
    height: screenHeight * 0.65,
    borderRadius: moderateScale(14),
  },
  paginationRow: {
    position: 'absolute',
    bottom: 45,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default PanditDetailsScreen;
