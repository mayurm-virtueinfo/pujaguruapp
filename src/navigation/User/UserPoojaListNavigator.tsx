import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PujaListScreen from '../../screens/Users/PoojaListScreen/PujaListScreen';
import PujaBookingScreen from '../../screens/Users/PoojaBookingScreen/PujaBookingScreen';
import PlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/PlaceSelectionScreen';
import AddressSelectionScreen from '../../screens/Users/PoojaDetailsScreen/AddressSelectionScreen';
import TirthPlaceSelectionScreen from '../../screens/Users/PoojaDetailsScreen/TirthPlaceSelectionScreen';
import UserPoojaDetails from '../../screens/Users/PoojaDetailsScreen/PujaDetailsScreen';
import {PujaListItemType, RecommendedPuja} from '../../api/apiService';
import PaymentScreen from '../../screens/Users/PaymentScreen/PaymentScreen';
import BookingSuccessfullyScreen from '../../screens/Users/BookingSuccessfullyScreen/BookingSuccessfullyScreen';
import RateYourExperienceScreen from '../../screens/Users/RateYourExperienceScreen/RateYourExperienceScreen';
import SelectPanditjiScreen from '../../screens/Users/PoojaDetailsScreen/SelectPanditjiScreen';
import PanditDetailsScreen from '../../screens/Users/PanditDetailsScreen/PanditDetailsScreen';
import PujaCancellationScreen from '../../screens/Users/PujaCancellationScreen/PujaCancellationScreen';
import BookedPujaDetailsScreen from '../../screens/Users/UserPujaDetailsScreen/UserPujaDetailsScreen';
import UserChatScreen from '../../screens/Users/UserChatScreen/UserChatScreen';

export type UserPoojaListParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  PujaList: undefined;
  PujaBooking: undefined;
  UserPoojaDetails: {data: PujaListItemType | RecommendedPuja};
  PlaceSelectionScreen: undefined;
  AddressSelectionScreen: undefined;
  TirthPlaceSelectionScreen: undefined;
  PaymentScreen: undefined;
  BookingSuccessfullyScreen: undefined;
  RateYourExperienceScreen: undefined;
  SelectPanditjiScreen: undefined;
  PanditDetailsScreen: undefined;
  PujaCancellationScreen: undefined;
  BookedPujaDetailsScreen: undefined;
  UserChatScreen: undefined;
};

const Stack = createStackNavigator<UserPoojaListParamList>();

const UserPoojaListNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="PujaList" component={PujaListScreen} />
      <Stack.Screen name="PujaBooking" component={PujaBookingScreen} />
      <Stack.Screen
        name="UserPoojaDetails"
        component={UserPoojaDetails}
        options={{title: 'User Pooja Details'}}
      />
      <Stack.Screen
        name="PlaceSelectionScreen"
        component={PlaceSelectionScreen}
      />
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
        name="BookingSuccessfullyScreen"
        component={BookingSuccessfullyScreen}
      />
      <Stack.Screen
        name="RateYourExperienceScreen"
        component={RateYourExperienceScreen}
      />
      <Stack.Screen
        name="SelectPanditjiScreen"
        component={SelectPanditjiScreen}
      />
      <Stack.Screen
        name="PanditDetailsScreen"
        component={PanditDetailsScreen}
      />
      <Stack.Screen
        name="PujaCancellationScreen"
        component={PujaCancellationScreen}
      />
      <Stack.Screen
        name="BookedPujaDetailsScreen"
        component={BookedPujaDetailsScreen}
      />
      <Stack.Screen name="UserChatScreen" component={UserChatScreen} />
    </Stack.Navigator>
  );
};

export default UserPoojaListNavigator;
