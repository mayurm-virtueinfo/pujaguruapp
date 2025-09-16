import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SignInScreen from '../screens/SignInScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import PanditRegistrationScreen from '../screens/PanditRegistrationScreen';
import SelectCityAreaScreen from '../screens/SelectCityAreaScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import PoojaAndAstrologyPerformedScreen from '../screens/PoojaAndAstrologyPerformedScreen';
import LanguagesScreen from '../screens/LanguagesScreen';
import {COLORS} from '../theme/theme';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import CompleteProfileScreen from '../screens/Users/CompleteProfileScreen/CompleteProfileScreen';
import UserProfileScreen from '../screens/Users/ProfileScreen/UserProfileScreen';
import UserAppBottomTabNavigator from './User/UserBottomTabNavigator';
import TermsPolicyScreen from '../screens/Users/TermsPolicy/TermsPolicy';

export type AuthStackParamList = {
  SignIn: any;
  OTPVerification: {
    phoneNumber: string;
    confirmation: FirebaseAuthTypes.ConfirmationResult;
  };
  CompleteProfileScreen: {
    phoneNumber: string;
  };
  PanditRegistration: undefined;
  SelectCityArea: undefined;
  Documents: undefined;
  PoojaAndAstrologyPerformed: undefined;
  Languages: undefined;
  UserProfileScreen: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    address: string;
    uid: string;
    latitude?: number;
    longitude?: number;
  };
  UserAppBottomTabNavigator: undefined;
  TermsPolicyScreen: any;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: COLORS.backgroundPrimary},
      }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen
        name="CompleteProfileScreen"
        component={CompleteProfileScreen}
      />
      <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
      <Stack.Screen
        name="PanditRegistration"
        component={PanditRegistrationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SelectCityArea"
        component={SelectCityAreaScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PoojaAndAstrologyPerformed"
        component={PoojaAndAstrologyPerformedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserAppBottomTabNavigator"
        component={UserAppBottomTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TermsPolicyScreen"
        component={TermsPolicyScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
