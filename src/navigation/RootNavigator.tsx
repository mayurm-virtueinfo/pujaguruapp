import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import {
  CommonActions,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native';
import AuthNavigator, {AuthStackParamList} from './AuthNavigator';
import AppDrawerNavigator, {AppDrawerParamList} from './DrawerNavigator';
import {COLORS} from '../theme/theme';
import {useAuth} from '../provider/AuthProvider';
import UserAppBottomTabNavigator, {
  UserAppBottomTabParamList,
} from './User/UserBottomTabNavigator';
import CompleteProfileScreen from '../screens/Users/CompleteProfileScreen/CompleteProfileScreen';
import UserProfileScreen from '../screens/Users/ProfileScreen/UserProfileScreen';
import {useEffect} from 'react';
import PanditjiGuestScreen from '../screens/Users/PandijiScreen/PanditjiGuestScreen';

export type MainAppStackParamList = {
  UserAppBottomTabNavigator: undefined;
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
        name="UserAppBottomTabNavigator"
        component={UserAppBottomTabNavigator}
      />
    </MainApp.Navigator>
  );
};

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainAppStackParamList>;
  PanditjiGuestScreen:undefined
};

const RootStack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {isAuthenticated} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    console.log('RootNavigator.tsx : isAuthenticated =', isAuthenticated);

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: isAuthenticated ? 'Main' : 'Auth'}],
      }),
    );
  }, [isAuthenticated, navigation]);

  return (
    <RootStack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerShown: false,
      }}>
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="PanditjiGuestScreen" component={PanditjiGuestScreen} />
      <RootStack.Screen name="Main" component={MainAppStackNavigator} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
