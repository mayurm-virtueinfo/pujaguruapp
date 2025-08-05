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
import PaymentScreen from '../../screens/Users/PaymentScreen/PaymentScreen';
import SelectPanditjiScreen from '../../screens/Users/PoojaDetailsScreen/SelectPanditjiScreen';
import BookingSuccessfullyScreen from '../../screens/Users/BookingSuccessfullyScreen/BookingSuccessfullyScreen';
import RateYourExperienceScreen from '../../screens/Users/RateYourExperienceScreen/RateYourExperienceScreen';
import UserPujaDetailsScreen from '../../screens/Users/UserPujaDetailsScreen/UserPujaDetailsScreen';
import AddAddressScreen from '../../screens/Users/AddAddressScreen/AddAddressScreen';

export type UserHomeParamList = {
  goBack(): unknown;
  navigate(arg0: string, arg1: {poojaId: any}): unknown;
  UserHomeScreen: undefined;
  PujaCancellationScreen: undefined;
  NotificationScreen: undefined;
  PujaBooking: {
    poojaId: string;
    samagri_required: boolean;
    address?: any;
    tirth?: any;
    poojaName?: any;
    poojaDescription?: any;
    puja_image: string;
    puja_name: string;
  };
  SelectPujaScreen: undefined;
  PoojaDetailScreen: {poojaId: any};
  PlaceSelectionScreen: any;
  AddressSelectionScreen: any;
  TirthPlaceSelectionScreen: any;
  PaymentScreen: any;
  SelectPanditjiScreen: any;
  BookingSuccessfullyScreen: undefined;
  RateYourExperienceScreen: any;
  UserPujaDetailsScreen: undefined;
  UserChatScreen: undefined;
  AddAddressScreen: any;
};

const Stack = createStackNavigator<UserHomeParamList>();

const UserHomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="UserHomeScreen" component={UserHomeScreen} />
      <Stack.Screen name="UserChatScreen" component={UserChatScreen} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="SelectPujaScreen" component={SelectPujaScreen} />
      <Stack.Screen name="PoojaDetailScreen" component={PujaDetailsScreen} />
      <Stack.Screen
        name="PlaceSelectionScreen"
        component={PlaceSelectionScreen}
      />
      <Stack.Screen name="PujaBooking" component={PujaBookingScreen} />
      <Stack.Screen
        name="AddressSelectionScreen"
        component={AddressSelectionScreen}
      />
      <Stack.Screen
        name="TirthPlaceSelectionScreen"
        component={TirthPlaceSelectionScreen}
      />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen
        name="SelectPanditjiScreen"
        component={SelectPanditjiScreen}
      />
      <Stack.Screen
        name="BookingSuccessfullyScreen"
        component={BookingSuccessfullyScreen}
      />
      <Stack.Screen
        name="RateYourExperienceScreen"
        component={RateYourExperienceScreen}
      />
      <Stack.Screen
        name="UserPujaDetailsScreen"
        component={UserPujaDetailsScreen}
      />
      <Stack.Screen
        name="PujaCancellationScreen"
        component={PujaCancellationScreen}
      />
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
    </Stack.Navigator>
  );
};

export default UserHomeNavigator;
