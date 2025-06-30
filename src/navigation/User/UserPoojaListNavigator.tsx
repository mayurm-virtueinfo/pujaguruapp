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

export type UserPoojaListParamList = {
  PujaList: undefined;
  PujaBooking: undefined;
  UserPoojaDetails: {data: PujaListItemType | RecommendedPuja};
  PlaceSelectionScreen: undefined;
  AddressSelectionScreen: undefined;
  TirthPlaceSelectionScreen: undefined;
  PaymentScreen: undefined;
  BookingSuccessfullyScreen: undefined;
  RateYourExperienceScreen: undefined;
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
    </Stack.Navigator>
  );
};

export default UserPoojaListNavigator;
