import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PujaCancellationScreen from '../../screens/Users/PujaCancellationScreen/PujaCancellationScreen';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';
import UserChatScreen from '../../screens/Users/UserChatScreen/UserChatScreen';
import SelectPanditjiScreen from '../../screens/Users/PoojaDetailsScreen/SelectPanditjiScreen';
import PanditjiScreen from '../../screens/Users/PandijiScreen/PandijiScreen';
import PanditDetailsScreen from '../../screens/Users/PanditDetailsScreen/PanditDetailsScreen';
import NotificationScreen from '../../screens/Users/NotificationScreen/NotificationScreen';
import PujaDetailsScreen from '../../screens/Users/PoojaDetailsScreen/PujaDetailsScreen';
import PlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/PlaceSelectionScreen';
import PujaBookingScreen from '../../screens/Users/PoojaBookingScreen/PujaBookingScreen';
import AddressSelectionScreen from '../../screens/Users/PoojaDetailsScreen/AddressSelectionScreen';
import TirthPlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/TirthPlaceSelectionScreen';
import PaymentScreen from '../../screens/Users/PaymentScreen/PaymentScreen';
import BookingSuccessfullyScreen from '../../screens/Users/BookingSuccessfullyScreen/BookingSuccessfullyScreen';
import RateYourExperienceScreen from '../../screens/Users/RateYourExperienceScreen/RateYourExperienceScreen';
import AddAddressScreen from '../../screens/Users/AddAddressScreen/AddAddressScreen';

export type UserPanditjiParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  PanditjiScreen: undefined;
  PanditDetailsScreen: { panditId: string };
  NotificationScreen: undefined;
  PoojaDetailScreen: any;
  PlaceSelectionScreen: any;
  PujaBooking: any;
  AddressSelectionScreen: any;
  TirthPlaceSelectionScreen: any;
  PaymentScreen: any;
  SelectPanditjiScreen: any;
  BookingSuccessfullyScreen: any;
  RateYourExperienceScreen: any;
  AddAddressScreen: any;
};

const Stack = createStackNavigator<UserPanditjiParamList>();

const UserPanditjiNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PanditjiScreen" component={PanditjiScreen} />
      <Stack.Screen
        name="PanditDetailsScreen"
        component={PanditDetailsScreen}
      />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
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
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
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
    </Stack.Navigator>
  );
};

export default UserPanditjiNavigator;
