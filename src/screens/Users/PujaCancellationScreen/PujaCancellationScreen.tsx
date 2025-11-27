import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import {
  useNavigation,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import { postCancelBooking } from '../../../api/apiService';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import CancellationPolicyModal from '../../../components/CancellationPolicyModal';
import Fonts from '../../../theme/fonts';
import { UserPoojaListParamList } from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomModal from '../../../components/CustomModal';
import { useCommonToast } from '../../../common/CommonToast';

interface CancellationReason {
  key: string;
  label: string;
  requiresSpecification?: boolean;
}

const PujaCancellationScreen = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { id } = route.params as any;
  const [cancellationReasons] = useState<CancellationReason[]>([
    { key: 'user_personal', label: 'personal_reason' },
    { key: 'user_another_service', label: 'found_another_service' },
    { key: 'user_financial', label: 'financial_reasons' },
    { key: 'user_other', label: 'other', requiresSpecification: true },
  ]);

  const [selectedReasonKey, setSelectedReasonKey] = useState<string | null>(
    null,
  );
  const [customReason, setCustomReason] = useState('');
  const [
    isCancellationPolicyModalVisible,
    setIsCancellationPolicyModalVisible,
  ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const customInputRef = useRef<TextInput>(null);

  const { showErrorToast, showSuccessToast } = useCommonToast();

  const englishLabelMap: Record<string, string> = {
    personal_reason: 'Personal Reason',
    found_another_service: 'Found another service',
    financial_reasons: 'Financial Reasons',
    other: 'Other',
  };

  const handleSubmit = () => {
    const selectedReason = cancellationReasons.find(
      r => r.key === selectedReasonKey,
    );
    if (!selectedReason) {
      showErrorToast(t('please_select_cancellation_reason'));
      return;
    }
    if (selectedReason.requiresSpecification && customReason.trim() === '') {
      showErrorToast(t('please_enter_cancellation_reason'));
      return;
    }
    setIsConfirmModalVisible(true);
  };

  const handleConfirmCancellation = async () => {
    setIsConfirmModalVisible(false);
    setIsSubmitting(true);
    const selectedReason = cancellationReasons.find(
      r => r.key === selectedReasonKey,
    );
    try {
      const payload: any = {
        cancellation_reason_type: selectedReason?.key,
        reason:
          englishLabelMap[selectedReason?.label || ''] || selectedReason?.label,
        ...(selectedReason?.requiresSpecification && {
          other_reason: customReason,
        }),
      };
      console.log('payload :: ', payload);
      await postCancelBooking(id, payload);
      showSuccessToast(t('cancellation_submitted_successfully'));
      const parentNavigator = navigation.getParent?.();
      if (parentNavigator) {
        parentNavigator.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'UserHomeNavigator',
                state: {
                  index: 0,
                  routes: [{ name: 'UserHomeScreen' }],
                },
              },
            ],
          }),
        );
      }
    } catch (error: any) {
      console.log('error in cancel booking api :: ', error?.response?.data);
      showErrorToast(
        error?.message || 'Failed to submit cancellation. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCustomInput = cancellationReasons.find(
    r => r.key === selectedReasonKey,
  )?.requiresSpecification;

  const renderReasonOption = (reason: CancellationReason, index: number) => (
    <View key={reason.key}>
      <TouchableOpacity
        style={styles.reasonOption}
        onPress={() => setSelectedReasonKey(reason.key)}
        activeOpacity={0.7}
      >
        <Text style={styles.reasonText}>{t(reason.label) || reason.label}</Text>
        <Ionicons
          name={
            selectedReasonKey === reason.key
              ? 'checkmark-circle-outline'
              : 'ellipse-outline'
          }
          size={moderateScale(24)}
          color={
            selectedReasonKey === reason.key
              ? COLORS.gradientEnd
              : COLORS.inputBoder
          }
        />
      </TouchableOpacity>
      {index < cancellationReasons.length - 1 && (
        <View style={styles.separator} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <UserCustomHeader title={t('puja_cancellation')} showBackButton={true} />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.heading}>{t('cancellation_reason')}</Text>
            <Text style={styles.warningText}>
              {t('descriprion_for_cancel_puja')}
            </Text>
            <View style={[styles.reasonsContainer, THEMESHADOW.shadow]}>
              {cancellationReasons.map((reason, index) =>
                renderReasonOption(reason, index),
              )}
            </View>
            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  ref={customInputRef}
                  style={styles.customInput}
                  placeholder={t('enter_your_cancellation_reason')}
                  placeholderTextColor={COLORS.inputLabelText}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 500);
                  }}
                />
              </View>
            )}
            <TouchableOpacity
              onPress={() => setIsCancellationPolicyModalVisible(true)}
              style={styles.policyLinkContainer}
            >
              <Text style={styles.policyLinkText}>
                {t('cancellation_policy')}
              </Text>
            </TouchableOpacity>
            {isSubmitting && (
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.primaryBackgroundButton}
                />
              </View>
            )}
          </View>
        </ScrollView>
        <View style={[styles.fixedButtonContainer, { paddingBottom: 24 }]}>
          <PrimaryButton
            title={isSubmitting ? t('submitting') : t('submit_cancellation')}
            onPress={handleSubmit}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>

      <CancellationPolicyModal
        visible={isCancellationPolicyModalVisible}
        onClose={() => setIsCancellationPolicyModalVisible(false)}
      />

      <CustomModal
        visible={isConfirmModalVisible}
        title={t('confirm_cancellation') || 'Confirm Cancellation'}
        message={
          t('are_you_sure_you_want_to_cancel') ||
          'Are you sure you want to cancel this booking?'
        }
        confirmText={t('yes') || 'Yes'}
        cancelText={t('no') || 'No'}
        onConfirm={handleConfirmCancellation}
        onCancel={() => setIsConfirmModalVisible(false)}
      />
    </View>
  );
};

export default PujaCancellationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: verticalScale(24),
    paddingHorizontal: scale(24),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  heading: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(6),
  },
  warningText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.inputLabelText,
    marginBottom: verticalScale(17),
    marginRight: scale(21),
  },
  reasonsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(24),
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: verticalScale(14),
  },
  reasonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginHorizontal: verticalScale(14),
  },
  customInputContainer: {
    marginBottom: verticalScale(24),
  },
  customInput: {
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(74),
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    minHeight: verticalScale(100),
  },
  policyLinkContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  policyLinkText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryBackgroundButton,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    minHeight: verticalScale(46),
    alignSelf: 'stretch',
    marginTop: 0,
  },
  submitButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
  },
  fixedButtonContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(24),
    paddingTop: 8,
    // position: 'absolute', // not needed, use flex layout
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
});
