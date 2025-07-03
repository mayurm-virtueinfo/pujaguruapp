import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PujaItemsModal from '../../../components/PujaItemsModal';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {Images} from '../../../theme/Images';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';

const UserPujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PujaCancellationScreen' | 'UserChatScreen'
  >;
  const navigation = useNavigation<ScreenNavigationProp>();
  const [isPujaItemsModalVisible, setIsPujaItemsModalVisible] = useState(false);

  const handlePujaItemsPress = () => {
    setIsPujaItemsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsPujaItemsModalVisible(false);
  };

  const renderPujaDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsCard}>
        <View style={styles.detailsContent}>
          {/* Ganpati Puja Section */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowContent}>
              <Image
                source={{
                  uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/bc53826fa5e88773c79af40315fbcef0694d1da0?width=82',
                }}
                style={styles.pujaIcon}
              />
              <Text style={styles.pujaTitle}>Ganpati Puja</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Location Section */}
          <View style={styles.detailRow}>
            <MaterialIcons
              name="location-on"
              size={scale(24)}
              color={COLORS.pujaCardSubtext}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>Home: Primary residence</Text>
          </View>

          <View style={styles.separator} />

          {/* Date Section */}
          <View style={styles.detailRow}>
            <MaterialIcons
              name="event"
              size={scale(24)}
              color={COLORS.pujaCardSubtext}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>15/09/2025</Text>
          </View>

          <View style={styles.separator} />

          {/* Time Section */}
          <View style={styles.detailRow}>
            <MaterialIcons
              name="access-time"
              size={scale(24)}
              color={COLORS.pujaCardSubtext}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>10:00 AM</Text>
          </View>

          <View style={styles.separator} />

          {/* Puja Items Section */}
          <View style={styles.detailRow}>
            <MaterialIcons
              name="list"
              size={scale(24)}
              color={COLORS.pujaCardSubtext}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>Puja items list</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={handlePujaItemsPress}>
              <MaterialIcons
                name="visibility"
                size={scale(20)}
                color={COLORS.primaryBackgroundButton}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Image
              source={Images.ic_pin}
              style={[styles.detailIcon, {width: scale(20), height: scale(16)}]}
              resizeMode="contain"
            />
            <Text style={styles.detailText}>3457: Pin for puja</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTotalAmount = () => (
    <View style={styles.totalContainer}>
      <View style={styles.totalCard}>
        <View style={styles.totalContent}>
          <View style={{gap: 6}}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalSubtext}>Ganesh Chaturthi Pooja</Text>
          </View>
          <View>
            <Text style={styles.totalAmount}>₹ 5000</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPanditDetails = () => (
    <View style={styles.totalContainer}>
      <View style={styles.totalCard}>
        <View style={styles.totalContent}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image
              source={{
                uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/96feb2dd36d383e6c73ee5b5d01ab81cd72a003a?width=104',
              }}
              style={styles.pujaIcon}
            />
            <Text style={styles.totalSubtext}>Ramesh Purohit</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserChatScreen')}>
            <Image
              source={Images.ic_message}
              style={{width: scale(20), height: scale(20)}}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPanditjiSection = () => (
    <View style={styles.panditjiContainer}>
      <View style={styles.panditjiCard}>
        <View style={styles.panditjiContent}>
          <View style={styles.panditjiAvatarContainer}>
            <View style={styles.panditjiAvatar}>
              <MaterialIcons
                name="person"
                size={scale(24)}
                color={COLORS.white}
              />
            </View>
          </View>
          <Text style={styles.panditjiText}>
            Panditji will be assigned soon...
          </Text>
        </View>
      </View>
    </View>
  );

  const handleCancelBooking = () => {
    navigation.navigate('PujaCancellationScreen');
  };
  const renderCancelButton = () => (
    <PrimaryButton
      title="Cancel Booking"
      onPress={handleCancelBooking}
      style={styles.cancelButton}
      textStyle={styles.cancelButtonText}
    />
  );

  // Show modal outside SafeAreaView for iOS, inside for others
  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primaryBackground}
        />
        <UserCustomHeader title="Puja Details" showBackButton={true} />
        <View style={styles.flexGrow}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}>
            {renderPujaDetails()}
            {renderTotalAmount()}
            {renderPanditDetails()}
            {renderPanditjiSection()}
            {renderCancelButton()}
          </ScrollView>
        </View>
        {Platform.OS !== 'ios' && (
          <PujaItemsModal
            visible={isPujaItemsModalVisible}
            onClose={handleModalClose}
          />
        )}
      </SafeAreaView>
      {Platform.OS === 'ios' && (
        <PujaItemsModal
          visible={isPujaItemsModalVisible}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  flexGrow: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    // overflow: 'hidden',
  },
  contentContainer: {
    flexGrow: 1,
    padding: moderateScale(24),
    // paddingBottom: verticalScale(100),
  },
  detailsContainer: {
    marginBottom: verticalScale(24),
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsContent: {
    // padding: moderateScale(14),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: verticalScale(14),
    minHeight: verticalScale(48),
  },
  detailRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pujaIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(14),
  },
  pujaTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  detailIcon: {
    marginRight: scale(14),
    width: scale(24),
  },
  detailText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    flex: 1,
  },
  viewButton: {
    padding: scale(8),
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(2),
    marginHorizontal: 14,
  },
  totalContainer: {
    marginBottom: verticalScale(24),
  },
  totalCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  totalContent: {
    padding: moderateScale(14),
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  totalAmount: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    letterSpacing: -0.333,
  },
  totalSubtext: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  panditjiContainer: {
    marginBottom: verticalScale(24),
  },
  panditjiCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  panditjiContent: {
    padding: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(68),
  },
  panditjiAvatarContainer: {
    marginRight: scale(14),
  },
  panditjiAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.pujaCardSubtext,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panditjiText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.pujaCardSubtext,
    letterSpacing: -0.333,
    flex: 1,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryBackgroundButton,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
    letterSpacing: -0.15,
  },
});

export default UserPujaDetailsScreen;
