import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import Fonts from '../../../theme/fonts';
import {COLORS} from '../../../theme/theme';
import PrimaryButton from '../../../components/PrimaryButton';
import CustomTextInput from '../../../components/CustomTextInput';
import {MainAppStackParamList} from '../../../navigation/RootNavigator';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

type CompleteProfileScreenRouteProp = NavigationProp<
  MainAppStackParamList,
  'UserAppBottomTabNavigator'
>;

interface Props {}

const UserProfileScreen: React.FC = () => {
  const {t, i18n} = useTranslation();
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<CompleteProfileScreenRouteProp>();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const handleSaveChanges = () => {
    console.log('Save changes pressed');
    navigation.navigate('UserAppBottomTabNavigator');
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: inset.top}]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      {/* <View style={styles.headerGradient} /> */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.headerGradient]}
      />
      <UserCustomHeader title={t('profile')} showBackButton={true} />

      <View style={styles.profileImageContainer}>
        <Image
          source={{
            uri: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
          }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <CustomTextInput
              label={t('user_name')}
              value={userName}
              onChangeText={setUserName}
              placeholder={t('enter_your_name')}
            />
            <CustomTextInput
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('enter_your_email')}
              keyboardType="email-address"
            />
            <CustomTextInput
              label={t('phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('enter_your_phone')}
              keyboardType="phone-pad"
            />
            <CustomTextInput
              label={t('location')}
              value={location}
              onChangeText={setLocation}
              placeholder={t('enter_your_location')}
            />
            <PrimaryButton
              title={t('save_changes')}
              onPress={handleSaveChanges}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 184,
    backgroundColor: COLORS.primaryBackground,
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
    borderColor: COLORS.white,
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 1,
  },
  inputContainer: {
    gap: 16,
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
});

export default UserProfileScreen;
