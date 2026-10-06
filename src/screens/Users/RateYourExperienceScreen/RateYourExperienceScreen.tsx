import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import {
  CommonActions,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { postRatePandit, postReviewImageUpload } from '../../../api/apiService';
import ImagePicker from 'react-native-image-crop-picker';
import { useCommonToast } from '../../../common/CommonToast';
import { UserHomeParamList } from '../../../navigation/User/UsetHomeStack';

const RateYourExperienceScreen: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  type ScreenNavigationProp = StackNavigationProp<
    UserHomeParamList,
    'UserHomeScreen'
  >;
  const { t } = useTranslation();

  const inset = useSafeAreaInsets();
  const { showErrorToast, showSuccessToast } = useCommonToast();
  const navigation = useNavigation<ScreenNavigationProp>();

  const route = useRoute();
  const {
    booking,
    panditjiData,
    selectManualPanitData,
    panditName,
    panditImage,
  } = (route.params as any) || {};

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  const getRatingLabel = (val: number): { text: string; emoji: string } => {
    switch (val) {
      case 5:
        return {
          text: t('rating_excellent', { defaultValue: 'Excellent!' }),
          emoji: '🌟',
        };
      case 4:
        return {
          text: t('rating_very_good', { defaultValue: 'Very Good' }),
          emoji: '😊',
        };
      case 3:
        return {
          text: t('rating_good', { defaultValue: 'Good' }),
          emoji: '🙂',
        };
      case 2:
        return {
          text: t('rating_fair', { defaultValue: 'Fair' }),
          emoji: '😐',
        };
      case 1:
        return {
          text: t('rating_poor', { defaultValue: 'Poor' }),
          emoji: '😞',
        };
      default:
        return {
          text: t('tap_to_rate', { defaultValue: 'Tap a star to rate' }),
          emoji: '✨',
        };
    }
  };

  const extractErrorMessage = (error: any): string => {
    const data = error?.response?.data;
    if (!data) {
      return error?.message || 'Failed to submit rating';
    }

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (typeof first === 'string') {
        return first;
      }
      if (typeof first === 'object' && first !== null) {
        for (const key of Object.keys(first)) {
          const val = first[key];
          if (
            Array.isArray(val) &&
            val.length > 0 &&
            typeof val[0] === 'string'
          ) {
            return val[0];
          }
          if (typeof val === 'string') {
            return val;
          }
        }
      }
    }

    if (typeof data === 'object' && data !== null) {
      if (typeof data.message === 'string') return data.message;
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.error === 'string') return data.error;

      for (const key of Object.keys(data)) {
        const val = data[key];
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          typeof val[0] === 'string'
        ) {
          return val[0];
        }
        if (typeof val === 'string') {
          return val;
        }
      }
    }

    return error?.message || 'Failed to submit rating';
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showErrorToast(
        t('please_select_rating', {
          defaultValue: 'Please select a star rating first.',
        }),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = booking;
      const ratingValue = rating;
      const reviewText = feedback;

      if (photos.length > 0) {
        const uploadPromises = photos.map(async photo => {
          const formData = new FormData();
          const fileData = {
            uri: photo.uploadUri || photo.uri,
            type: photo.mime || 'image/jpeg',
            name: photo.name || `review_photo_${Date.now()}.jpg`,
          };
          formData.append('image', fileData as any);
          formData.append('images', fileData as any);

          const res = await postReviewImageUpload(formData, bookingId);
          if (res?.url) return res.url;
          if (res?.data?.url) return res.data.url;
          return null;
        });

        await Promise.all(uploadPromises);
      }

      await postRatePandit({
        booking: bookingId,
        rating: ratingValue,
        review: reviewText,
      });

      setRating(0);
      setFeedback('');
      showSuccessToast(
        t('rate_submit_successfully', {
          defaultValue: 'Rating submitted successfully.',
        }),
      );
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'UserHomeNavigator',
              state: {
                routes: [{ name: 'UserHomeScreen' }],
                index: 0,
              },
            },
          ],
        }),
      );
    } catch (error: any) {
      const properMsg = extractErrorMessage(error);
      showErrorToast(properMsg);
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhotos = async () => {
    try {
      const images = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        maxFiles: 10 - photos.length,
        compressImageQuality: 0.8,
        cropping: false,
      });
      const selectedImages = Array.isArray(images) ? images : [images];
      const formatted = selectedImages.map(img => {
        const rawPath = img.path || '';
        const ext = rawPath.substring(rawPath.lastIndexOf('.') + 1) || 'jpg';
        const mimeType =
          img.mime ||
          (ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg');

        const uploadUri =
          Platform.OS === 'android'
            ? rawPath.startsWith('file://')
              ? rawPath
              : `file://${rawPath}`
            : rawPath.replace('file://', '');

        const displayUri = rawPath.startsWith('file://')
          ? rawPath
          : `file://${rawPath}`;

        return {
          uri: displayUri,
          uploadUri,
          mime: mimeType,
          name: img.filename || `review_photo_${Date.now()}.${ext}`,
          width: img.width,
          height: img.height,
          size: img.size,
        };
      });
      setPhotos(prev => [...prev, ...formatted].slice(0, 10));
    } catch (error: any) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        console.error('Failed to pick images:', error);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const currentPanditName =
    panditjiData?.pandit_name ||
    selectManualPanitData?.name ||
    panditName ||
    'Panditji';

  const currentPanditImage =
    panditjiData?.profile_img_url ||
    selectManualPanitData?.image ||
    panditImage;

  const currentPujaPurpose =
    panditjiData?.puja_name ||
    selectManualPanitData?.puja_name ||
    'For family well-being';

  const panditId = panditjiData?.id || selectManualPanitData?.id;
  const ratingInfo = getRatingLabel(rating);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: inset.top }]}>
      <StatusBar barStyle="light-content" />

      <UserCustomHeader
        title={t('rate_experience', { defaultValue: 'Rate Your Experience' })}
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(inset.bottom, moderateScale(24)) + moderateScale(20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContent}>
          {/* Pandit Details Card */}
          <View style={styles.panditCard}>
            <View style={styles.panditAvatarWrapper}>
              {currentPanditImage ? (
                <Image
                  source={{ uri: currentPanditImage }}
                  style={styles.panditImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.panditAvatarFallback}>
                  <Ionicons
                    name="person"
                    size={moderateScale(28)}
                    color={COLORS.primary}
                  />
                </View>
              )}
            </View>

            <View style={styles.panditInfo}>
              <Text style={styles.panditName} numberOfLines={1}>
                {currentPanditName}
              </Text>
              <View style={styles.purposeRow}>
                <Ionicons
                  name="sparkles"
                  size={moderateScale(12)}
                  color="#D97706"
                />
                <Text style={styles.panditPurpose} numberOfLines={1}>
                  {currentPujaPurpose}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewDetailsBtn}
                onPress={() =>
                  navigation.navigate(
                    'PanditDetailsScreen' as any,
                    panditId ? { panditId } : undefined,
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={styles.viewDetailsText}>
                  {t('view_details', { defaultValue: 'VIEW DETAILS' })}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(12)}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>
              {t('how_was_your_experience', {
                defaultValue: 'How was your experience?',
              })}
            </Text>
            <Text style={styles.ratingSubtitle}>
              Tap stars to rate your puja service
            </Text>

            <View style={styles.starsContainer}>
              {[0, 1, 2, 3, 4].map(idx => {
                const isFilled = idx < rating;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleStarPress(idx)}
                    style={styles.starButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFilled ? 'star' : 'star-outline'}
                      size={moderateScale(38)}
                      color={isFilled ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dynamic Rating Label */}
            <View
              style={[
                styles.ratingLabelBadge,
                rating > 0 && styles.ratingLabelBadgeActive,
              ]}
            >
              <Text style={styles.ratingLabelEmoji}>{ratingInfo.emoji}</Text>
              <Text
                style={[
                  styles.ratingLabelText,
                  rating > 0 && styles.ratingLabelTextActive,
                ]}
              >
                {ratingInfo.text}
              </Text>
            </View>
          </View>

          {/* Add Multiple Photos */}
          <View style={styles.photoSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t('add_photos_optional', {
                  defaultValue: 'Add photos (optional)',
                })}
              </Text>
              <Text style={styles.photoCounter}>{photos.length}/10</Text>
            </View>

            <View style={styles.photoGrid}>
              {photos.map((photo, idx) => (
                <View key={idx} style={styles.photoItem}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemovePhoto(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={moderateScale(20)}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 10 && (
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={handleAddPhotos}
                  activeOpacity={0.7}
                >
                  <View style={styles.addPhotoIconCircle}>
                    <Ionicons
                      name="camera"
                      size={moderateScale(18)}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.addPhotoText}>
                    {t('add_photo', { defaultValue: 'Add Photo' })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Detailed Feedback Input */}
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Write a Review</Text>
            <View
              style={[
                styles.feedbackInputWrapper,
                isInputFocused && styles.feedbackInputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('tell_us_more_about_your_experience', {
                  defaultValue: 'Tell us more about your experience...',
                })}
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={500}
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{feedback.length}/500</Text>
            </View>
          </View>

          {/* Submit Button */}
          <PrimaryButton
            title={t('submtt_rating', { defaultValue: 'SUBMIT RATING' })}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonInactive,
            ]}
            textStyle={styles.submitButtonText}
          />
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
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(18),
    gap: moderateScale(14),
  },

  // Pandit Card
  panditCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  panditAvatarWrapper: {
    width: moderateScale(66),
    height: moderateScale(66),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#F1F5F9',
  },
  panditImage: {
    width: '100%',
    height: '100%',
  },
  panditAvatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEAEA',
  },
  panditInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  panditName: {
    color: '#1E293B',
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    marginTop: moderateScale(2),
    marginBottom: moderateScale(8),
  },
  panditPurpose: {
    color: '#64748B',
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    flex: 1,
  },
  viewDetailsBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    gap: moderateScale(4),
  },
  viewDetailsText: {
    color: COLORS.primary,
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_SemiBold,
  },

  // Rating Section
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  ratingTitle: {
    fontSize: moderateScale(16.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    marginTop: moderateScale(3),
    marginBottom: moderateScale(14),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  starButton: {
    padding: moderateScale(4),
  },
  ratingLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    marginTop: moderateScale(14),
    gap: moderateScale(6),
  },
  ratingLabelBadgeActive: {
    backgroundColor: '#FEF3C7',
  },
  ratingLabelEmoji: {
    fontSize: moderateScale(14),
  },
  ratingLabelText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#64748B',
  },
  ratingLabelTextActive: {
    color: '#B45309',
  },

  // Photos Section
  photoSection: {
    marginTop: moderateScale(2),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_SemiBold,
    color: '#1E293B',
  },
  photoCounter: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#94A3B8',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    alignItems: 'center',
  },
  photoItem: {
    position: 'relative',
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: moderateScale(2),
    right: moderateScale(2),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addPhotoBtn: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(4),
  },
  addPhotoIconCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#FFEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: moderateScale(9.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },

  // Feedback Section
  feedbackSection: {
    marginTop: moderateScale(2),
  },
  feedbackInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: moderateScale(12),
    marginTop: moderateScale(8),
  },
  feedbackInputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  feedbackInput: {
    color: '#1E293B',
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    minHeight: moderateScale(84),
    maxHeight: moderateScale(130),
    paddingTop: 0,
    paddingBottom: moderateScale(4),
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#94A3B8',
    marginTop: moderateScale(2),
  },

  // Submit Button
  submitButton: {
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    marginTop: moderateScale(6),
  },
  submitButtonInactive: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    letterSpacing: 0.5,
  },
});

export default RateYourExperienceScreen;
