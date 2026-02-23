import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../../theme/theme';
import UserPoojaListNavigator from './UserPoojaListNavigator';
import UserHomeNavigator from './UsetHomeStack';
import UserPanditjiNavigator from './UserPanditjiNavigator';
import { useTranslation } from 'react-i18next';
import UserProfileNavigator from './userProfileNavigator';
import PanchangNavigator from './PanchangNavigator';
import HomeIcon from '../../assets/svg/home.svg';
import PujaListIcon from '../../assets/svg/puja-list.svg';
import PanchangIcon from '../../assets/svg/panchang.svg';
import PanditListIcon from '../../assets/svg/pandit-list.svg';
import ProfileIcon from '../../assets/svg/profile.svg';

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
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="UserHomeNavigator"
        component={UserHomeNavigator}
        options={({ route }) => ({
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <HomeIcon width={size} height={size} fill={color} />
          ),
        })}
      />
      <Tab.Screen
        name="UserPoojaListNavigator"
        component={UserPoojaListNavigator}
        options={{
          title: t('pooja_list'),
          tabBarIcon: ({ color, size }) => (
            <PujaListIcon width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PanchangNavigator"
        component={PanchangNavigator}
        options={{
          title: t('panchang'),
          tabBarIcon: ({ color, size }) => (
            <PanchangIcon width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserPanditjiNavigator"
        component={UserPanditjiNavigator}
        options={{
          title: t('panditji'),
          tabBarIcon: ({ color, size }) => (
            <PanditListIcon width={size} height={size} fill={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfileNavigator"
        component={UserProfileNavigator}
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon width={size} height={size} fill={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default UserAppBottomTabNavigator;
