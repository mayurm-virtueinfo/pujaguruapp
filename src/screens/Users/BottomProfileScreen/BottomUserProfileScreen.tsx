import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Fonts from '../../../theme/fonts';
import {COLORS} from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({label, value}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const BottomUserProfileScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation();

  const userData = {
    name: 'John Smith',
    email: 'johnsmith@gmail.com',
    phone: '90909 09090',
    location: 'Ahmedabad',
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <View style={styles.headerGradient} />
      <UserCustomHeader title="Profile" showBackButton={true} />

      <View style={styles.profileImageContainer}>
        <Image
          source={{
            uri: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
          }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <View style={styles.infoSection}>
            <ProfileField label="Name" value={userData.name} />
            <View style={styles.divider} />
            <ProfileField label="Email" value={userData.email} />
            <View style={styles.divider} />
            <ProfileField label="Phone" value={userData.phone} />
            <View style={styles.divider} />
            <ProfileField label="Location" value={userData.location} />
          </View>
          <View style={styles.editSection}>
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Edit Profile</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Upcoming Puja</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Past Puja</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.editFieldContainer}>
              <Text style={styles.editFieldLabel}>Notifications</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
          </View>

          <View style={styles.editSection}>
            <View style={styles.editFieldContainer}>
              <Text style={styles.logoutLabel}>Logout</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primaryTextDark}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 184,
    // backgroundColor: COLORS.primaryBackground,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 105,
    alignSelf: 'center',
    zIndex: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.pujaBackground,
  },
  contentContainer: {
    position: 'absolute',
    top: 153,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.backgroundPrimary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 64,
    paddingBottom: 24,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoSection: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    elevation: 3,
    marginTop: 10,
  },
  editSection: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    elevation: 3,
  },
  fieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    color: COLORS.inputLabelText,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    flex: 1,
    paddingVertical: 5,
  },
  fieldValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    textAlign: 'right',
    flex: 2,
  },
  editFieldContainer: {
    minHeight: 34,
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  editFieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
    paddingVertical: 5,
  },
  logoutLabel: {
    color: COLORS.gradientEnd,
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: 8,
  },
});

export default BottomUserProfileScreen;
