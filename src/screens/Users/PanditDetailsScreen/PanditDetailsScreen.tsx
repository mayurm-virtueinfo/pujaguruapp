import React, {useEffect, useState} from 'react';
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
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import CustomHeader from '../../../components/CustomHeader';
import {
  apiService,
  CommentData,
  PanditItem,
  PujaListItemType,
  RecommendedPuja,
} from '../../../api/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

const {width: screenWidth} = Dimensions.get('window');

const PanditDetailsScreen: React.FC = () => {
  const [recommendedPuja, setRecommendedPuja] = useState<RecommendedPuja[]>([]);
  const [pujaList, setPujaList] = useState<PujaListItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPandit, setSelectedPandit] = useState<any>(null);
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  // console.log('commentData', commentData);
  useEffect(() => {
    fetchPujaData();
    fetchAllPanditAndPuja();
    fetchCommentData();
  }, []);

  const fetchPujaData = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getPujaListData();
      setRecommendedPuja(requests.recommendedPuja || []);
      setPujaList(requests.pujaList || []);
    } catch {
      setRecommendedPuja([]);
      setPujaList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPanditAndPuja = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getPanditAndPujaData();
      if (requests.pandits && requests.pandits.length > 0) {
        setSelectedPandit(requests.pandits[0]);
      } else {
        setSelectedPandit(null);
      }
    } catch (error) {
      setSelectedPandit(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentData = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getCommentData();
      setCommentData(requests);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Helper: get first two recommended pujas for gallery
  const galleryPujas = recommendedPuja.slice(0, 2);

  // Fallback for selectedPandit if not loaded yet
  const panditName = selectedPandit?.name || '';
  const panditImage = selectedPandit?.image || '';

  // Helper: render stars for review
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

  // Helper: format date from ISO to dd/mm/yyyy
  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CustomHeader title="Panditji Details" showBackButton={true} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Pandit Profile Card */}
          <View style={styles.panditCard}>
            <Image
              source={{
                uri:
                  panditImage ||
                  'https://cdn.builder.io/api/v1/image/assets/e02e12c8254b4549b581b062ed0a5c7f/94c7341fbd9234bbb8e10341382dfaf1c28baf0d?placeholderIfAbsent=true',
              }}
              style={styles.panditImage}
            />
            <View style={styles.panditInfo}>
              <Text style={styles.panditName}>
                {panditName || 'Pandit Name'}
              </Text>
              <View style={styles.nameRatingRow}>
                <View style={{flexDirection: 'row'}}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={moderateScale(20)}
                      color={COLORS.primaryBackgroundButton}
                    />
                  ))}
                </View>
                <Text style={styles.experienceText}>{24}</Text>
              </View>
            </View>
          </View>

          {/* Recommended Section */}
          <View style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <Text style={styles.sectionTitle}>Recommended Panditji</Text>
              <TouchableOpacity style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See all </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(20)}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.descriptionText}>
              {panditName
                ? `Pandit ${panditName} is highly experienced and well-versed in Hindu rituals and ceremonies.`
                : 'Pandit details will appear here.'}
            </Text>
          </View>

          {/* Photo Gallery Section */}
          <View style={styles.photoGallerySection}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
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
          </View>

          {/* Pooja Performed Section */}
          <View style={styles.poojaSection}>
            <Text style={styles.sectionTitle}>Pooja Performed</Text>
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
                        ₹ {puja.price.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  {idx < pujaList.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.reviewsList}>
              {Array.isArray(commentData) && commentData.length > 0 ? (
                commentData.map((review, idx) => (
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
                            {formatDate(review.date)}
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
                          {renderStars(review.star)}
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.comment}</Text>
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
                ))
              ) : (
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontFamily: Fonts.Sen_Regular,
                    fontSize: moderateScale(13),
                  }}>
                  No reviews yet.
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
  rSection: {
    paddingTop: moderateScale(50),
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(30),
    backgroundColor: COLORS.primary,
  },
  statusBar: {
    marginBottom: moderateScale(15),
  },
  timeText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
  },
  headerTitle: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    fontWeight: '700',
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
    // flex: 1,
  },
  ratingImage: {
    width: moderateScale(80),
    height: moderateScale(24),
    resizeMode: 'contain',
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
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    color: COLORS.textDark,
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Medium,
    fontWeight: '500',
  },
  arrowIcon: {
    width: moderateScale(6),
    height: moderateScale(10),
    resizeMode: 'contain',
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
  reviewsList: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: moderateScale(12),
    // Set shadow for reviewsList
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
  reviewStars: {
    width: moderateScale(60),
    height: moderateScale(12),
    resizeMode: 'contain',
  },
  reviewTitle: {
    color: COLORS.textDark,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  reviewText: {
    fontSize: moderateScale(12),
    color: COLORS.textSecondary,
    fontFamily: Fonts.Sen_Regular,
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(12),
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
  bookButtonSection: {
    backgroundColor: COLORS.pujaBackground,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panditSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: moderateScale(12),
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    color: COLORS.textDark,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(6),
    marginRight: moderateScale(4),
  },
  summaryRatingText: {
    fontSize: moderateScale(12),
    color: COLORS.textDark,
    fontFamily: Fonts.Sen_Medium,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    minWidth: moderateScale(100),
  },
  bookButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    fontWeight: '600',
  },
});

export default PanditDetailsScreen;
