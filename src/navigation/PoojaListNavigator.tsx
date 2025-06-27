import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PoojaListScreen from '../screens/PoojaListScreen';
import AddNewPoojaScreen from '../screens/AddNewPoojaScreen';
import {PoojaRequestItem} from '../api/apiService';
import PoojaRequestDetailScreen from '../screens/PoojaRequestDetailScreen';
import ChatMessagesScreen from '../screens/ChatMessagesScreen';
import PoojaItemListScreen from '../screens/PoojaItemListScreen';
import PinVerificationScreen from '../screens/PinVerificationScreen';
import CancellationReasonScreen from '../screens/CancellationReasonScreen';
import CancellationPolicyScreen from '../screens/CancellationPolicyScreen';
import RateYourExperienceScreen from '../screens/RateYourExperienceScreen';
import PujaListScreen from '../screens/PujaListScreen';
import PujaBookingScreen from '../screens/PujaBookingScreen';

export type PoojaListParamList = {
  PujaList: undefined;
  PujaBooking: undefined;
  PoojaRequestDetail: {request: PoojaRequestItem};
  ChatMessages: undefined;
  PoojaItemList: undefined;
  PinVerification: undefined;
  CancellationReason: undefined;
  CancellationPolicy: undefined;
  RateYourExperience: undefined;
};

const Stack = createStackNavigator<PoojaListParamList>();

const PoojaListNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="PujaList" component={PujaListScreen} />
      <Stack.Screen
        name="PujaBooking"
        component={PujaBookingScreen} // Assuming you have an AddNewPoojaScreen component
      />
      <Stack.Screen
        name="PoojaRequestDetail"
        component={PoojaRequestDetailScreen}
      />
      <Stack.Screen name="ChatMessages" component={ChatMessagesScreen} />
      <Stack.Screen name="PoojaItemList" component={PoojaItemListScreen} />
      <Stack.Screen name="PinVerification" component={PinVerificationScreen} />
      <Stack.Screen
        name="CancellationReason"
        component={CancellationReasonScreen}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={CancellationPolicyScreen}
      />
      <Stack.Screen
        name="RateYourExperience"
        component={RateYourExperienceScreen}
      />
    </Stack.Navigator>
  );
};

export default PoojaListNavigator;
