import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PujaCancellationScreen from '../../screens/Users/PujaCancellationScreen/PujaCancellationScreen';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';
import UserChatScreen from '../../screens/Users/UserChatScreen/UserChatScreen';
import NotificationScreen from '../../screens/Users/NotificationScreen/NotificationScreen';

export type UserHomeParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  UserHomeScreen: undefined;
  PujaCancellationScreen: undefined;
  NotificationScreen: undefined;
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
    </Stack.Navigator>
  );
};

export default UserHomeNavigator;
