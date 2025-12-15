import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PanchangScreen from '../../screens/Users/Panchang/PanchangScreen';

export type PanchangParamList = {
  goBack(): void;
  navigate(arg0: string): unknown;
  PanchangScreen: undefined;
};

const Stack = createStackNavigator<PanchangParamList>();

const PanchangNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PanchangScreen" component={PanchangScreen} />
    </Stack.Navigator>
  );
};

export default PanchangNavigator;
