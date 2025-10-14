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
import UserPujaDetailsScreen from '../../screens/Users/UserPujaDetailsScreen/UserPujaDetailsScreen';
import AddAddressScreen from '../../screens/Users/AddAddressScreen/AddAddressScreen';
import SearchPanditScreen from '../../screens/Users/SearchPanditScreen/SearchPanditScreen';
import ConfirmPujaDetails from '../../screens/Users/ConfirmPujaDetails/ConfirmPujaDetails';

export type UserPoojaListParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  PujaList: undefined;
  UserHomeNavigator: {
    screen: 'UserHomeScreen';
  };
  PujaBooking: {
    poojaId: string;
    samagri_required: boolean;
    address?: any;
    tirth?: any;
    poojaName?: any;
    poojaDescription?: any;
    puja_name: string;
    puja_image: string;
    price: string;
    selectAddressName?: string;
    selectTirthPlaceName?: string;
    panditId: string;
  };
  UserPoojaDetails: {poojaId: string};
  PlaceSelectionScreen: any;
  AddressSelectionScreen: any;
  TirthPlaceSelectionScreen: any;
  PaymentScreen: any;
  BookingSuccessfullyScreen: any;
  RateYourExperienceScreen: any;
  SelectPanditjiScreen: {poojaId: string};
  PanditDetailsScreen: undefined;
  PujaCancellationScreen: {id: any};
  UserPujaDetailsScreen: any;
  UserChatScreen: {
    booking_id: string;
    pandit_name?: string;
    profile_img_url?: string;
    pandit_id: string;
  };
  AddAddressScreen: undefined;
  SearchPanditScreen: any;
  ConfirmPujaDetails: any;
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
        name="UserPujaDetailsScreen"
        component={UserPujaDetailsScreen}
      />
      <Stack.Screen
        name="PujaCancellationScreen"
        component={PujaCancellationScreen}
      />
      <Stack.Screen name="UserChatScreen" component={UserChatScreen} />
      <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} />
      <Stack.Screen name="SearchPanditScreen" component={SearchPanditScreen} />
      <Stack.Screen name="ConfirmPujaDetails" component={ConfirmPujaDetails} />
    </Stack.Navigator>
  );
};

export default UserPoojaListNavigator;
