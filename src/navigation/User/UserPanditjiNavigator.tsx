import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PujaCancellationScreen from '../../screens/Users/PujaCancellationScreen/PujaCancellationScreen';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';
import UserChatScreen from '../../screens/Users/UserChatScreen/UserChatScreen';
import SelectPanditjiScreen from '../../screens/Users/PoojaDetailsScreen/SelectPanditjiScreen';
import PanditjiScreen from '../../screens/Users/PandijiScreen/PandijiScreen';
import PanditDetailsScreen from '../../screens/Users/PanditDetailsScreen/PanditDetailsScreen';

export type UserPanditjiParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  PanditjiScreen: undefined;
  PanditDetailsScreen: undefined;
};

const Stack = createStackNavigator<UserPanditjiParamList>();

const UserPanditjiNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="PanditjiScreen" component={PanditjiScreen} />
      <Stack.Screen
        name="PanditDetailsScreen"
        component={PanditDetailsScreen}
      />
    </Stack.Navigator>
  );
};

export default UserPanditjiNavigator;
