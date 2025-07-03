import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {apiService} from '../../../api/apiService';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import CancellationPolicyModal from '../../../components/CancellationPolicyModal';
import Fonts from '../../../theme/fonts';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface CancellationReason {
  id: number;
  reason: string;
  requiresSpecification?: boolean;
}

const PujaCancellationScreen = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<UserPoojaListParamList>();

  const [cancellationReasons, setCancellationReasons] = useState<
    CancellationReason[]
  >([
    {id: 1, reason: 'Personal reasons'},
    {id: 2, reason: 'Personal reasons'},
    {id: 3, reason: 'Found another service'},
    {id: 4, reason: 'Financial reasons'},
    {id: 5, reason: 'Other', requiresSpecification: true},
  ]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [
    isCancellationPolicyModalVisible,
    setIsCancellationPolicyModalVisible,
  ] = useState(false);
  console.log(isCancellationPolicyModalVisible);
  useEffect(() => {
    fetchCancellationReason();
  }, []);

  const fetchCancellationReason = async () => {
    try {
      const requests = await apiService.getCancellationReason();
      if (requests && requests.length > 0) {
        setCancellationReasons(requests);
      }
    } catch (error) {
      // Use default reasons
    }
  };

  const handleSubmit = () => {
    const selectedReason = cancellationReasons.find(
      r => r.id === selectedReasonId,
    );

    if (!selectedReason) {
      Alert.alert('Validation Error', 'Please select a cancellation reason.');
      return;
    }

    if (selectedReason.requiresSpecification && customReason.trim() === '') {
      Alert.alert('Validation Error', 'Please enter your cancellation reason.');
      return;
    }

    // Submit logic here

    Alert.alert('Success', 'Cancellation submitted successfully.');
  };

  const handleOpenPolicy = () => {
    setIsCancellationPolicyModalVisible(true);
  };

  const handleCancellationPolicyModalClose = () => {
    setIsCancellationPolicyModalVisible(false);
  };

  const showCustomInput = cancellationReasons.find(
    r => r.id === selectedReasonId,
  )?.requiresSpecification;

  const renderReasonOption = (reason: CancellationReason, index: number) => (
    <View key={reason.id}>
      <TouchableOpacity
        style={styles.reasonOption}
        onPress={() => setSelectedReasonId(reason.id)}
        activeOpacity={0.7}>
        <Text style={styles.reasonText}>{reason.reason}</Text>
        <Ionicons
          name={
            selectedReasonId === reason.id
              ? 'checkmark-circle-outline'
              : 'ellipse-outline'
          }
          size={moderateScale(24)}
          color={
            selectedReasonId === reason.id
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
    <View style={[styles.container, {paddingTop: inset.top}]}>
      <UserCustomHeader title="Puja Cancellation" showBackButton={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.heading}>Cancellation Reason</Text>
          <Text style={styles.warningText}>
            Please note that cancellations are only applicable if made 24 hours
            prior to the scheduled Pooja. If you cancel within this period, you
            will not be eligible for a refund. We appreciate your understanding
            and cooperation.
          </Text>
          <View style={styles.reasonsContainer}>
            {cancellationReasons.map((reason, index) =>
              renderReasonOption(reason, index),
            )}
          </View>
          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter your cancellation reason"
                placeholderTextColor={COLORS.inputLabelText}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}
          <TouchableOpacity
            onPress={handleOpenPolicy}
            style={styles.policyLinkContainer}>
            <Text style={styles.policyLinkText}>Cancellation Policy</Text>
          </TouchableOpacity>
          <PrimaryButton
            title="SUBMIT CANCELLATION"
            onPress={handleSubmit}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          />
        </View>
      </ScrollView>

      <CancellationPolicyModal
        visible={isCancellationPolicyModalVisible}
        onClose={handleCancellationPolicyModalClose}
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
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  headerGradient: {
    paddingBottom: verticalScale(20),
  },
  headerContainer: {},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
  },
  headerSpacer: {
    width: scale(44),
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
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(17),
    marginRight: scale(21),
  },
  reasonsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(24),
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 3,
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
    letterSpacing: -0.33,
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
    letterSpacing: -0.14,
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
    letterSpacing: -0.15,
    lineHeight: moderateScale(21),
  },
});
