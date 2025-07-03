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
import AuthNavigator, {AuthStackParamList} from './AuthNavigator';
import AppDrawerNavigator, {AppDrawerParamList} from './DrawerNavigator'; // Corrected import path
import {COLORS} from '../theme/theme';
import {useAuth} from '../provider/AuthProvider';
import UserAppBottomTabNavigator, {
  UserAppBottomTabParamList,
} from './User/UserBottomTabNavigator';
import CompleteProfileScreen from '../screens/Users/CompleteProfileScreen/CompleteProfileScreen';
import UserProfileScreen from '../screens/Users/ProfileScreen/UserProfileScreen';

// Root Stack Types
// Define the param list for the stack that includes LanguagesScreen and AppDrawerNavigator
export type MainAppStackParamList = {
  AppDrawer: NavigatorScreenParams<AppDrawerParamList>; // AppDrawerNavigator itself
  UserAppBottomTabNavigator: NavigatorScreenParams<UserAppBottomTabParamList>;
  CompleteProfileScreen: {navigtion: undefined};
  UserProfileScreen: undefined;
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
      <MainApp.Screen
        name="CompleteProfileScreen"
        component={CompleteProfileScreen}
      />
      <MainApp.Screen name="UserProfileScreen" component={UserProfileScreen} />
      <MainApp.Screen
        name="UserAppBottomTabNavigator"
        component={UserAppBottomTabNavigator}
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
