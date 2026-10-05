import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import { COLORS } from '../../theme/theme';
import Fonts from '../../theme/fonts';
import UserPoojaListNavigator from './UserPoojaListNavigator';
import UserHomeNavigator from './UsetHomeStack';
import UserPanditjiNavigator from './UserPanditjiNavigator';
import UserProfileNavigator from './userProfileNavigator';
import PanchangNavigator from './PanchangNavigator';

export type UserAppBottomTabParamList = {
  UserHomeNavigator: undefined;
  UserPoojaListNavigator: undefined;
  PanchangNavigator: undefined;
  UserProfileNavigator: undefined;
  UserPanditjiNavigator: undefined;
};

const Tab = createBottomTabNavigator<UserAppBottomTabParamList>();

const UserAppBottomTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontFamily: Fonts.Sen_Medium,
          fontSize: moderateScale(11),
        },
      }}
    >
      <Tab.Screen
        name="UserHomeNavigator"
        component={UserHomeNavigator}
        options={{
          title: t('home', { defaultValue: 'Home' }),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="UserPoojaListNavigator"
        component={UserPoojaListNavigator}
        options={{
          title: t('pooja_list', { defaultValue: 'Pooja List' }),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PanchangNavigator"
        component={PanchangNavigator}
        options={{
          title: t('panchang', { defaultValue: 'Panchang' }),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="UserPanditjiNavigator"
        component={UserPanditjiNavigator}
        options={{
          title: t('panditji', { defaultValue: 'Panditji' }),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfileNavigator"
        component={UserProfileNavigator}
        options={{
          title: t('profile', { defaultValue: 'Profile' }),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserAppBottomTabNavigator;
