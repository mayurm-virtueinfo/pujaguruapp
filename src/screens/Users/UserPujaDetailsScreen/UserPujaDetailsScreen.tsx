import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import PujaItemsModal from '../../../components/PujaItemsModal';
import Fonts from '../../../theme/fonts';
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

  const handleCancelBooking = () => {
    navigation.navigate('PujaCancellationScreen');
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.headerGradient}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView edges={['top']}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={scale(24)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Puja Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderStatusBar = () => (
    <View style={styles.statusBarContainer}>
      <Text style={styles.statusBarTime}>9:41</Text>
      <View style={styles.statusBarIcons}>
        <View style={styles.signalBars}>
          {[...Array(4)].map((_, index) => (
            <View
              key={index}
              style={[styles.signalBar, {height: scale(3 + index * 2)}]}
            />
          ))}
        </View>
        <Ionicons name="wifi" size={scale(15)} color="#fff" />
        <View style={styles.batteryContainer}>
          <View style={styles.battery} />
          <View style={styles.batteryTip} />
        </View>
      </View>
    </View>
  );

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

  const renderCancelButton = () => (
    <PrimaryButton
      title="Cancel Booking"
      onPress={handleCancelBooking}
      style={styles.cancelButton}
      textStyle={styles.cancelButtonText}
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

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

      <PujaItemsModal
        visible={isPujaItemsModalVisible}
        onClose={handleModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
  },
  headerGradient: {
    paddingBottom: verticalScale(20),
  },
  headerContainer: {
    paddingHorizontal: scale(14),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: verticalScale(44),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_Bold,
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(44),
  },
  statusBarContainer: {
    position: 'absolute',
    top: verticalScale(12),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(30),
    height: verticalScale(20),
  },
  statusBarTime: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Regular,
    letterSpacing: -0.23,
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(1),
    marginRight: scale(5),
  },
  signalBar: {
    width: scale(2),
    backgroundColor: COLORS.white,
    borderRadius: scale(1),
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battery: {
    width: scale(24),
    height: scale(12),
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: scale(2),
    backgroundColor: COLORS.white,
  },
  batteryTip: {
    width: scale(1),
    height: scale(4),
    backgroundColor: COLORS.white,
    marginLeft: scale(1),
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    marginTop: verticalScale(-20),
  },
  contentContainer: {
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
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(66),
    backgroundColor: COLORS.bottomNavBackground,
  },
  bottomNavContent: {
    flex: 1,
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(6),
  },
  navIndicator: {
    width: scale(56),
    height: verticalScale(2),
    backgroundColor: COLORS.bottomNavActive,
    alignSelf: 'center',
    marginBottom: verticalScale(4),
    position: 'absolute',
    top: 0,
    left: scale(108),
  },
  navItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    paddingTop: verticalScale(6),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(6),
    flex: 1,
  },
  navItemActive: {
    // Additional styling for active state if needed
  },
  navItemText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.bottomNavIcon,
    textAlign: 'center',
  },
  navItemActiveText: {
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.bottomNavActive,
  },
});

export default UserPujaDetailsScreen;
