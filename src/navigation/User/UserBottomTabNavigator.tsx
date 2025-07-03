import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {COLORS} from '../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserPoojaListNavigator from './UserPoojaListNavigator';
import UserHomeScreen from '../../screens/Users/HomeScreen/UserHomeScreen';
import BottomUserProfileScreen from '../../screens/Users/BottomProfileScreen/BottomUserProfileScreen';
import PanditScreen from '../../screens/Users/PanditScreen/PanditScreen';
import {Image} from 'react-native';
import {Images} from '../../theme/Images';
import UserHomeNavigator from './UsetHomeStack';
import UserPanditjiNavigator from './UserPanditjiNavigator';

export type UserAppBottomTabParamList = {
  UserHomeNavigator: undefined;
  UserPoojaListNavigator: undefined;
  PanditScreen: undefined;
  BottomUserProfileScreen: undefined;
  UserPanditjiNavigator: undefined;
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
        name="UserHomeNavigator"
        component={UserHomeNavigator}
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
      <Tab.Screen
        name="UserPanditjiNavigator"
        component={UserPanditjiNavigator}
        options={{
          title: 'Panditji',
          tabBarIcon: ({color, size}) => (
            // <Ionicons name="list-outline" size={size} color={color} />
            <Image
              source={Images.ic_pandit_bottom_tab_icon}
              style={{width: size, height: size, tintColor: color}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="BottomUserProfileScreen"
        component={BottomUserProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserAppBottomTabNavigator;
