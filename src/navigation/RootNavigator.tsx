import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {NavigatorScreenParams} from '@react-navigation/native'; // Import NavigatorScreenParams
import AuthNavigator from './AuthNavigator';
import AppDrawerNavigator, {AppDrawerParamList} from './DrawerNavigator'; // Corrected import path
import {COLORS} from '../theme/theme';
import {useAuth} from '../provider/AuthProvider';
import PlaceSelectionScreen from '../screens/Users/PoojaDetailsScreen/PlaceSelectionScreen';
import AddressSelectionScreen from '../screens/Users/PoojaDetailsScreen/AddressSelectionScreen';
import TirthPlaceSelectionScreen from '../screens/Users/PoojaDetailsScreen/TirthPlaceSelectionScreen';

// Root Stack Types
// Define the param list for the stack that includes LanguagesScreen and AppDrawerNavigator
export type MainAppStackParamList = {
  AppDrawer: NavigatorScreenParams<AppDrawerParamList>; // AppDrawerNavigator itself
  PlaceSelectionScreen: undefined;
  AddressSelectionScreen: undefined;
  TirthPlaceSelectionScreen: undefined;
};

const MainApp = createStackNavigator<MainAppStackParamList>();

const MainAppStackNavigator = () => {
  return (
    <MainApp.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        cardStyle: {backgroundColor: COLORS.backgroundPrimary},
      }}>
      <MainApp.Screen name="AppDrawer" component={AppDrawerNavigator} />
      <MainApp.Screen
        name="PlaceSelectionScreen"
        component={PlaceSelectionScreen}
      />
      <MainApp.Screen
        name="AddressSelectionScreen"
        component={AddressSelectionScreen}
      />
      <MainApp.Screen
        name="TirthPlaceSelectionScreen"
        component={TirthPlaceSelectionScreen}
      />
    </MainApp.Navigator>
  );
};

// Root Stack Types - Main now points to MainAppStack
export type RootStackParamList = {
  Auth: undefined; // AuthNavigator for unauthenticated users
  Main: NavigatorScreenParams<MainAppStackParamList>; // MainAppStackNavigator for authenticated users
};

const RootStack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {isAuthenticated} = useAuth();

  useEffect(() => {
    console.log('RootNavigator.tsx : ', isAuthenticated);
  }, [isAuthenticated]);
  return (
    <RootStack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerShown: false,
        // contentStyle: {backgroundColor: 'transparent'}, // Removed to fix error, apply to screens if needed
      }}>
      {isAuthenticated && (
        <RootStack.Screen
          name="Main"
          component={MainAppStackNavigator} // Use the new MainAppStackNavigator
        />
      )}
      {!isAuthenticated && (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default RootNavigator;
