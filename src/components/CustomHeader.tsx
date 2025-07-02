import {
  useNavigation,
  useNavigationState,
  useRoute,
  DrawerActions,
} from '@react-navigation/native';
import {View, Text, TouchableOpacity, StatusBar} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme/theme';
import Feather from 'react-native-vector-icons/Feather';
import React from 'react';

interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showBellButton?: boolean;
  showCirclePlusButton?: boolean;
  showCallButton?: boolean;
}
const CustomHeader: React.FC<CustomHeaderProps> = ({
  title = '',
  showBackButton = false,
  showMenuButton = false,
  showBellButton = false,
  showCirclePlusButton = false,
  showCallButton = false,
}) => {
  const headerHeight = 48;
  const navigation = useNavigation();
  const inset = useSafeAreaInsets();
  const routes = useNavigationState(state => state.routes);
  const currentRoute = routes[routes.length - 1];

  return (
    <>
      {/* <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      /> */}

      <SafeAreaView edges={['top']} style={{backgroundColor: COLORS.primary}}>
        <View
          style={{
            borderBottomColor: COLORS.gray,
            borderBottomWidth: 0,
            height: headerHeight,
            backgroundColor: COLORS.primary,
            flexDirection: 'row',
            alignItems: 'center',
            // marginTop:inset.top,
            // paddingTop:inset.top
            //   paddingHorizontal: 16,
          }}>
          <View
            style={{
              width: headerHeight,
              height: headerHeight,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {showBackButton && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}
            {showMenuButton && (
              <TouchableOpacity
                onPress={() =>
                  navigation.dispatch(DrawerActions.toggleDrawer())
                }>
                <Ionicons name="menu" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}>
            <Text style={{color: COLORS.white, fontSize: 18}}>{title}</Text>
          </View>
          {showBellButton && (
            <TouchableOpacity
              style={{marginRight: 18}}
              onPress={() => {
                console.log('Bell Icon pressed');
              }}>
              <Feather name="bell" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {showCirclePlusButton && (
            <TouchableOpacity
              style={{marginRight: 18}}
              onPress={() => {
                console.log('Plus Icon pressed');
              }}>
              <Feather name="plus-circle" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {showCallButton && (
            <TouchableOpacity
              style={{marginRight: 18}}
              onPress={() => {
                console.log('Plus Icon pressed');
              }}>
              <Ionicons name="call-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {!showBellButton && !showCirclePlusButton && !showCallButton && (
            <View
              style={{
                width: headerHeight,
                height: headerHeight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

export default CustomHeader;
