import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import BottomUserProfileScreen from '../../screens/Users/BottomProfileScreen/BottomUserProfileScreen';
import WalletScreen from '../../screens/Users/WalletScreen/WalletScreen';
import NotificationScreen from '../../screens/Users/NotificationScreen/NotificationScreen';
import WalletTopUpScreen from '../../screens/Users/WalletTopUpScreen/WalletTopUpScreen';
import AddAddressScreen from '../../screens/Users/AddAddressScreen/AddAddressScreen';
import AddressesScreen from '../../screens/Users/AddressesScreen/AddressesScreen';
import UserEditProfileScreen from '../../screens/Users/ProfileScreen/EditProfile';
import UpcomingPuja from '../../screens/Users/BottomProfileScreen/UpcomingPuja';
import PastPujaScreen from '../../screens/Users/BottomProfileScreen/PastPujaScreen';
import UserPujaDetailsScreen from '../../screens/Users/UserPujaDetailsScreen/UserPujaDetailsScreen';
import SearchPanditScreen from '../../screens/Users/SearchPanditScreen/SearchPanditScreen';

export type UserProfileParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  BottomUserProfileScreen: undefined;
  WalletScreen: undefined;
  NotificationScreen: undefined;
  WalletTopUpScreen: undefined;
  AddressesScreen: undefined;
  AddAddressScreen: {addressToEdit?: any};
  EditProfile: any;
  UpcomingPuja: any;
  PastPujaScreen: any;
  UserPujaDetailsScreen: {
    id: string;
  };
  SearchPanditScreen: any;
};

const Stack = createStackNavigator<UserProfileParamList>();

const UserProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {/* <Stack.Screen name="SearchPanditScreen" component={SearchPanditScreen} /> */}

      <Stack.Screen
        name="BottomUserProfileScreen"
        component={BottomUserProfileScreen}
      />
      <Stack.Screen name="WalletScreen" component={WalletScreen} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="WalletTopUpScreen" component={WalletTopUpScreen} />
      <Stack.Screen name="AddressesScreen" component={AddressesScreen} />
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
      <Stack.Screen name="EditProfile" component={UserEditProfileScreen} />
      <Stack.Screen name="UpcomingPuja" component={UpcomingPuja} />
      <Stack.Screen name="PastPujaScreen" component={PastPujaScreen} />
      <Stack.Screen
        name="UserPujaDetailsScreen"
        component={UserPujaDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default UserProfileNavigator;
