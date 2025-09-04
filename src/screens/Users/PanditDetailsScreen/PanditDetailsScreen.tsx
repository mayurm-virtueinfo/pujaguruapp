import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {
  apiService,
  getPanditDetails,
  RecommendedPuja,
} from '../../../api/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CustomeLoader from '../../../components/CustomeLoader';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useCommonToast} from '../../../common/CommonToast';
import {useTranslation} from 'react-i18next';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

interface PanditPhotoGalleryItem {
  id: number;
  image: string;
  pooja_name?: string;
  booking?: number;
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
interface PanditList {
  pooja: number;
  pooja_title: string;
  pooja_image_url: string;
  price_with_samagri: string;
  price_without_samagri: string;
  price_status: number;
}

const PanditDetailsScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute();
  const {panditId} = route.params as {panditId: string};
  const {t} = useTranslation();
  const {showErrorToast} = useCommonToast();
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPandit, setSelectedPandit] = useState<PanditDetails | null>(
    null,
  );
  const [gallery, setGallery] = useState<PanditPhotoGalleryItem[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [pujaList, setPujaList] = useState<PanditList[]>([]);
  const [showAllPuja, setShowAllPuja] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);

  console.log('selectedPandit :: ', selectedPandit);

  useEffect(() => {
    if (panditId) {
      fetchPanditDetails(panditId);
    }
  }, [panditId]);

  const fetchPanditDetails = useCallback(
    async (panditId: string) => {
      try {
        setLoading(true);
        const response: PanditResponse = await getPanditDetails(panditId);

        if (response.success) {
          setSelectedPandit(response.data);
          setGallery(response.data.pandit_photo_gallery || []);
          setReviews(response.data.user_reviews || []);
          setPujaList(response.data.pandit_poojas || []);
        }
      } catch (error: any) {
        showErrorToast(
          error?.message || 'Failed to fetch Panditji details screen',
        );
      } finally {
        setLoading(false);
      }
    },
    [showErrorToast],
  );

  const panditName = selectedPandit?.pandit_name || '';
  const panditImage = selectedPandit?.profile_img;

  const renderStars = (count: number) => {
    return (
      <View style={{flexDirection: 'row'}}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name="star"
            size={moderateScale(14)}
            color={
              i < count ? COLORS.primaryBackgroundButton : COLORS.inputBoder
            }
            style={{marginRight: 2}}
          />
        ))}
      </View>
    );
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getReviewAvatar = (review: UserReview) => {
    if (Array.isArray(review.images) && review.images.length > 0) {
      if (typeof review.images[0] === 'object' && review.images[0]?.image) {
        return review.images[0].image;
      }
      if (typeof review.images[0] === 'string') {
        return review.images[0];
      }
    }
    return 'https://cdn.builder.io/api/v1/image/assets/e02e12c8254b4549b581b062ed0a5c7f/94c7341fbd9234bbb8e10341382dfaf1c28baf0d?placeholderIfAbsent=true';
  };

  const renderReviewImages = (images: UserReviewImage[]) => {
    if (!images || images.length === 0) return null;
    return (
      <View style={styles.reviewImagesRow}>
        {images.map(imgObj => (
          <TouchableOpacity
            key={imgObj.id}
            onPress={() => {
              setModalImageUri(imgObj.image);
              setModalVisible(true);
            }}>
            <Image
              source={{uri: imgObj.image}}
              style={styles.reviewImageThumb}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGalleryItem = ({item}: {item: PanditPhotoGalleryItem}) => (
    <TouchableOpacity
      style={[styles.galleryItemHorizontal, THEMESHADOW.shadow]}
      onPress={() => {
        setModalImageUri(item.image);
        setModalVisible(true);
      }}>
      <Image source={{uri: item.image}} style={styles.galleryImageHorizontal} />
      <Text style={styles.galleryLabelHorizontal}>
        {item.pooja_name ? item.pooja_name : 'Photo'}
      </Text>
    </TouchableOpacity>
  );

  const renderPujaItem = ({item}: {item: PanditList}) => (
    <TouchableOpacity
      style={styles.poojaItem}
      onPress={() =>
        navigation.navigate('UserHomeNavigator', {
          screen: 'PoojaDetailScreen',
          params: {
            poojaId: item?.pooja,
            panditId: panditId,
            panditName: panditName,
            panditImage: panditImage,
          },
        })
      }>
      <Image
        source={{uri: item.pooja_image_url}}
        style={styles.poojaImage}
        resizeMode="cover"
      />
      <View style={styles.poojaDetails}>
        <Text style={styles.poojaName}>{item.pooja_title}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: moderateScale(4),
          }}>
          <>
            <Text style={styles.poojaPrice}>₹{item.price_with_samagri}</Text>
            <Text
              style={{
                marginLeft: 8,
                color: COLORS.textSecondary,
                fontSize: moderateScale(13),
              }}>
              {t('with_samagri')}
            </Text>
          </>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.poojaPrice}>₹{item.price_without_samagri}</Text>
          <Text
            style={{
              marginLeft: 8,
              color: COLORS.textSecondary,
              fontSize: moderateScale(13),
            }}>
            {t('without_samagri')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const displayedPujaList =
    showAllPuja || pujaList.length <= 3 ? pujaList : pujaList.slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title={t('panditji_details')} showBackButton={true} />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}></Pressable>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            {modalImageUri && (
              <Image
                source={{uri: modalImageUri}}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.contentContainer}>
          <View style={[styles.panditCard, THEMESHADOW.shadow]}>
            <Image source={{uri: panditImage}} style={styles.panditImage} />
            <View style={styles.panditInfo}>
              <Text style={styles.panditName}>
                {panditName || 'Pandit Name'}
              </Text>
              <View style={styles.nameRatingRow}>
                {renderStars(
                  Math.round(parseFloat(selectedPandit?.average_rating || '0')),
                )}
                <Text style={styles.experienceText}>
                  {selectedPandit?.total_ratings || 0} {t('reviews')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.recommendedSection}>
            <Text style={styles.descriptionText}>
              {panditName
                ? `Pandit ${panditName} is highly experienced and well-versed in Hindu rituals and ceremonies. ${
                    selectedPandit?.bio ||
                    'Specializing in various traditional pujas.'
                  }`
                : 'Pandit details will appear here.'}
            </Text>
          </View>
          <View style={styles.photoGallerySection}>
            <Text style={styles.sectionTitle}>{t('photo_gallery')}</Text>
            {gallery && gallery.length > 0 ? (
              <FlatList
                data={gallery}
                keyExtractor={item => item.id.toString()}
                renderItem={renderGalleryItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryHorizontalList}
              />
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>
                  {t('no_photo_gallery_available')}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.poojaSection}>
            <Text style={styles.sectionTitle}>{t('puja_list')}</Text>
            {pujaList && pujaList.length > 0 ? (
              <View style={[styles.poojaList, THEMESHADOW.shadow]}>
                {displayedPujaList.map((item, idx) => (
                  <React.Fragment key={item.pooja}>
                    {renderPujaItem({item})}
                    {idx < displayedPujaList.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
                {!showAllPuja && pujaList.length > 3 && (
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setShowAllPuja(true)}
                    activeOpacity={0.7}>
                    <Text style={styles.moreButtonText}>More...</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>
                  {t('no_puja_performed_data_available')}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>{t('reviews')}</Text>
            {Array.isArray(reviews) && reviews.length > 0 ? (
              <View style={[styles.reviewsList, THEMESHADOW.shadow]}>
                {reviews.map((review, idx) => (
                  <React.Fragment key={review.id}>
                    <View style={styles.reviewItem}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: moderateScale(8),
                        }}>
                        <Image
                          source={{
                            uri: getReviewAvatar(review),
                          }}
                          style={{
                            width: moderateScale(44),
                            height: moderateScale(44),
                            borderRadius: moderateScale(16),
                            marginRight: moderateScale(14),
                          }}
                        />
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.created_at)}
                          </Text>
                          <Text
                            style={{
                              fontFamily: Fonts.Sen_Bold,
                              color: COLORS.textDark,
                              fontSize: moderateScale(14),
                              marginBottom: moderateScale(6),
                            }}>
                            {review.user_name}
                          </Text>
                          {renderStars(review.rating)}
                        </View>
                      </View>
                      <Text style={styles.reviewText}>
                        {review.review && review.review.trim().length > 0
                          ? review.review
                          : t('no_review_text')}
                      </Text>
                      {Array.isArray(review.images) &&
                        review.images.length > 0 &&
                        renderReviewImages(review.images)}

                      <TouchableOpacity style={styles.actionItem}>
                        <Feather
                          name="thumbs-down"
                          size={moderateScale(20)}
                          color={COLORS.bottomNavIcon}
                          style={styles.actionIcon}
                        />
                        <Text style={styles.actionCount}>0</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < reviews.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>{t('no_review_text')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(24),
    flex: 1,
  },
  panditCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  panditImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(16),
  },
  panditInfo: {
    flex: 1,
    gap: moderateScale(6),
  },
  nameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  panditName: {
    fontSize: moderateScale(16),
    color: COLORS.textDark,
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
  },
  experienceText: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
    fontWeight: '500',
  },
  recommendedSection: {
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
  },
  descriptionText: {
    color: COLORS.inputLabelText,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    lineHeight: moderateScale(20),
  },
  photoGallerySection: {
    marginBottom: moderateScale(12),
  },
  galleryHorizontalList: {
    padding: 12,
  },
  galleryItemHorizontal: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    width: moderateScale(120),
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(10),
    marginRight: moderateScale(14),
  },
  galleryImageHorizontal: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
    backgroundColor: COLORS.inputBoder,
  },
  galleryLabelHorizontal: {
    fontSize: moderateScale(13),
    color: COLORS.textDark,
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  poojaSection: {
    marginBottom: moderateScale(24),
  },
  poojaList: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(12),
  },
  poojaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poojaImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(16),
  },
  poojaDetails: {
    flex: 1,
  },
  poojaName: {
    color: COLORS.textDark,
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  poojaDescription: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Regular,
    marginBottom: moderateScale(8),
  },
  poojaPrice: {
    color: COLORS.primary,
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(235, 235, 235, 1)',
    marginVertical: moderateScale(16),
  },
  reviewsSection: {
    marginBottom: moderateScale(24),
  },
  forNodata: {
    alignItems: 'center',
    marginTop: moderateScale(16),
    backgroundColor: COLORS.white,
    paddingVertical: 12,
  },

  reviewsList: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(12),
  },
  reviewItem: {
    marginBottom: moderateScale(4),
  },
  reviewHeader: {
    // marginBottom: moderateScale(8),
  },
  reviewDate: {
    fontSize: moderateScale(12),
    color: COLORS.textSecondary,
    fontFamily: Fonts.Sen_Regular,
    marginBottom: moderateScale(4),
  },
  reviewText: {
    fontSize: moderateScale(12),
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Regular,
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  forNoDataText: {
    color: COLORS.textSecondary,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(20),
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
  },
  actionIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: moderateScale(6),
  },
  actionCount: {
    fontSize: moderateScale(13),
    color: COLORS.textDark,
    fontFamily: Fonts.Sen_Medium,
    fontWeight: '500',
  },
  reviewImagesRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  reviewImageThumb: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
    backgroundColor: COLORS.inputBoder,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  moreButton: {
    marginTop: moderateScale(10),
    alignSelf: 'center',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(18),
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(20),
  },
  moreButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_SemiBold,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default PanditDetailsScreen;
