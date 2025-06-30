import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {COLORS} from '../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserPoojaListNavigator from './UserPoojaListNavigator';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';

export type UserAppBottomTabParamList = {
  UserHomeScreen: undefined;
  UserPoojaListNavigator: undefined;
};

const Tab = createBottomTabNavigator<UserAppBottomTabParamList>();

const UserAppBottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen
        name="UserHomeScreen"
        component={UserHomeScreen}
        options={({route}) => ({
          title: 'Home',
          // headerTitle: getHeaderTitle(route), // dynamic title in screen header
          tabBarIcon: ({color, size}) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="UserPoojaListNavigator"
        component={UserPoojaListNavigator}
        options={{
          title: 'Pooja List',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserAppBottomTabNavigator;
