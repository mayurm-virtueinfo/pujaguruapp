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
} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import CustomHeader from '../../../components/CustomHeader';
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
import {useRoute} from '@react-navigation/native';
import {useCommonToast} from '../../../common/CommonToast';

const {width: screenWidth} = Dimensions.get('window');

interface PujaListItemType {
  id: number;
  uuid: string;
  pooja_title: string;
  pooja_category: string;
  amount: string;
  booking_date: string;
  muhurat_time: string;
  muhurat_type: string;
  address: string;
  user_name: string;
  user_mobile: string;
  booking_status: string;
  payment_status: string;
  notes: string;
  image?: string;
  name?: string;
  pujaPurpose?: string;
  price?: number;
}

interface CommentData {
  id: number;
  booking: number;
  user_name: string;
  rating: number;
  review: string;
  created_at: string;
  image?: string;
  commenterName?: string;
  star?: number;
  Comment?: string;
  like?: number;
  disLike?: number;
  date?: string;
}

interface PanditDetails {
  id: number;
  uuid: string;
  user: number;
  pandit_name: string;
  pandit_email: string;
  pandit_mobile: string;
  address_city: string;
  caste: string;
  sub_caste: string;
  gotra: string;
  bio: string | null;
  supported_languages: string[];
  average_rating: string;
  total_ratings: number;
  performed_pujas: PujaListItemType[];
  ratings: CommentData[];
  image?: string;
}

interface PanditResponse {
  success: boolean;
  data: PanditDetails;
}

const PanditDetailsScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute();
  const {panditId} = route.params as {panditId: string};

  const {showErrorToast} = useCommonToast();

  const [recommendedPuja, setRecommendedPuja] = useState<RecommendedPuja[]>([]);
  const [pujaList, setPujaList] = useState<PujaListItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPandit, setSelectedPandit] = useState<PanditDetails | null>(
    null,
  );
  const [commentData, setCommentData] = useState<CommentData[]>([]);

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
          // Map API response to match expected UI fields
          const mappedPujas: PujaListItemType[] =
            response.data.performed_pujas.map(puja => ({
              ...puja,
              name: puja.pooja_title, // Map pooja_title to name for UI
              pujaPurpose: puja.pooja_category, // Map pooja_category to pujaPurpose
              price: parseFloat(puja.amount), // Convert string amount to number
              image:
                puja.image ||
                'https://cdn.builder.io/api/v1/image/assets/e02e12c8254b4549b581b062ed0a5c7f/94c7341fbd9234bbb8e10341382dfaf1c28baf0d?placeholderIfAbsent=true', // Fallback image
            }));

          const mappedRatings: CommentData[] = response.data.ratings.map(
            rating => ({
              ...rating,
              commenterName: rating.user_name, // Map user_name to commenterName
              star: rating.rating, // Map rating to star
              Comment: rating.review, // Map review to Comment
              like: 0, // Default value as like is not in response
              disLike: 0, // Default value as disLike is not in response
              date: rating.created_at, // Map created_at to date
              image:
                rating.image ||
                'https://cdn.builder.io/api/v1/image/assets/e02e12c8254b4549b581b062ed0a5c7f/94c7341fbd9234bbb8e10341382dfaf1c28baf0d?placeholderIfAbsent=true', // Fallback image
            }),
          );

          setSelectedPandit(response.data);
          setPujaList(mappedPujas);
          setCommentData(mappedRatings);
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

  const galleryPujas = recommendedPuja.slice(0, 2);

  const panditName = selectedPandit?.pandit_name || '';
  const panditImage =
    selectedPandit?.image ||
    'https://cdn.builder.io/api/v1/image/assets/e02e12c8254b4549b581b062ed0a5c7f/94c7341fbd9234bbb8e10341382dfaf1c28baf0d?placeholderIfAbsent=true';

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

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar barStyle="light-content" />
      <UserCustomHeader title="Panditji Details" showBackButton={true} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.contentContainer}>
          <View style={styles.panditCard}>
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
                  {selectedPandit?.total_ratings || 0} Reviews
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

          {/* Photo Gallery Section */}
          <View style={styles.photoGallerySection}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
            {galleryPujas && galleryPujas.length > 0 ? (
              <View style={styles.galleryRow}>
                {galleryPujas.map(puja => (
                  <View style={styles.galleryItem} key={puja.id}>
                    <Image
                      source={{uri: puja.image}}
                      style={styles.galleryImage}
                    />
                    <Text style={styles.galleryLabel}>{puja.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>
                  No photo gallery available.
                </Text>
              </View>
            )}
          </View>

          {/* Pooja Performed Section */}
          <View style={styles.poojaSection}>
            <Text style={styles.sectionTitle}>Pooja Performed</Text>
            {pujaList && pujaList.length > 0 ? (
              <View style={styles.poojaList}>
                {pujaList.map((puja, idx) => (
                  <React.Fragment key={puja.id}>
                    <View style={styles.poojaItem}>
                      <Image
                        source={{uri: puja.image}}
                        style={styles.poojaImage}
                      />
                      <View style={styles.poojaDetails}>
                        <Text style={styles.poojaName}>{puja.name}</Text>
                        <Text style={styles.poojaDescription}>
                          {puja.pujaPurpose}
                        </Text>
                        <Text style={styles.poojaPrice}>
                          ₹ {puja.price?.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                    {idx < pujaList.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>
                  No pooja performed yet.
                </Text>
              </View>
            )}
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {Array.isArray(commentData) && commentData.length > 0 ? (
              <View style={[styles.reviewsList, THEMESHADOW.shadow]}>
                {commentData.map((review, idx) => (
                  <React.Fragment key={idx}>
                    <View style={styles.reviewItem}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: moderateScale(8),
                        }}>
                        <Image
                          source={{uri: review.image}}
                          style={{
                            width: moderateScale(44),
                            height: moderateScale(44),
                            borderRadius: moderateScale(16),
                            marginRight: moderateScale(14),
                          }}
                        />
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.date!)}
                          </Text>
                          <Text
                            style={{
                              fontFamily: Fonts.Sen_Bold,
                              color: COLORS.textDark,
                              fontSize: moderateScale(14),
                              marginBottom: moderateScale(6),
                            }}>
                            {review.commenterName}
                          </Text>
                          {renderStars(review.star!)}
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.Comment}</Text>
                      <View style={styles.reviewActions}>
                        <TouchableOpacity style={styles.actionItem}>
                          <Feather
                            name="thumbs-up"
                            size={moderateScale(20)}
                            color={COLORS.bottomNavIcon}
                            style={styles.actionIcon}
                          />
                          <Text style={styles.actionCount}>{review.like}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem}>
                          <Feather
                            name="thumbs-down"
                            size={moderateScale(20)}
                            color={COLORS.bottomNavIcon}
                            style={styles.actionIcon}
                          />
                          <Text style={styles.actionCount}>
                            {review.disLike}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {idx < commentData.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <View style={[THEMESHADOW.shadow, styles.forNodata]}>
                <Text style={styles.forNoDataText}>No reviews yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain unchanged
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
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
    marginBottom: moderateScale(24),
  },
  galleryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(12),
  },
  galleryItem: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    width: (screenWidth - moderateScale(60)) / 2,
    alignItems: 'center',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  galleryImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    marginBottom: moderateScale(12),
  },
  galleryLabel: {
    fontSize: moderateScale(14),
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
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
});

export default PanditDetailsScreen;
