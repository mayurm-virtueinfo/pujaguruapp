import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PujaCancellationScreen from '../../screens/Users/PujaCancellationScreen/PujaCancellationScreen';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';
import UserChatScreen from '../../screens/Users/UserChatScreen/UserChatScreen';
import NotificationScreen from '../../screens/Users/NotificationScreen/NotificationScreen';
import PujaBookingScreen from '../../screens/Users/PoojaBookingScreen/PujaBookingScreen';
import SelectPujaScreen from '../../screens/Users/SelectPujaScreen/SelectPujaScreen';
import PujaDetailsScreen from '../../screens/Users/PoojaDetailsScreen/PujaDetailsScreen';
import PlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/PlaceSelectionScreen';
import AddressSelectionScreen from '../../screens/Users/PoojaDetailsScreen/AddressSelectionScreen';
import TirthPlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/TirthPlaceSelectionScreen';

export type UserHomeParamList = {
  goBack(): unknown;
  navigate(arg0: string, arg1: {poojaId: any}): unknown;
  UserHomeScreen: undefined;
  PujaCancellationScreen: undefined;
  NotificationScreen: undefined;
  PujaBookingScreen: undefined;
  SelectPujaScreen: {poojaId?: any};
  PoojaDetailScreen: undefined;
  PlaceSelectionScreen: {poojaId?: any; withPujaItem: boolean};
  AddressSelectionScreen: {poojaId?: any; withPujaItem: boolean};
  TirthPlaceSelectionScreen: {poojaId?: any; withPujaItem: boolean};
};

const Stack = createStackNavigator<UserHomeParamList>();

const UserHomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="UserHomeScreen" component={UserHomeScreen} />
      <Stack.Screen name="PujaCancellationScreen" component={UserChatScreen} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="SelectPujaScreen" component={SelectPujaScreen} />
      <Stack.Screen name="PoojaDetailScreen" component={PujaDetailsScreen} />
      <Stack.Screen
        name="PlaceSelectionScreen"
        component={PlaceSelectionScreen}
      />
      <Stack.Screen name="PujaBookingScreen" component={PujaBookingScreen} />
      <Stack.Screen
        name="AddressSelectionScreen"
        component={AddressSelectionScreen}
      />
      <Stack.Screen
        name="TirthPlaceSelectionScreen"
        component={TirthPlaceSelectionScreen}
      />
    </Stack.Navigator>
  );
};

export default UserHomeNavigator;
