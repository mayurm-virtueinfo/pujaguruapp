// components/PrimaryButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale } from 'react-native-size-matters';

interface Props {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  activeOpacity?: number;
}

const PrimaryButton: React.FC<Props> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  loading = false,
  activeOpacity = 0.7,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(48),
    backgroundColor: COLORS.primaryBackgroundButton,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  buttonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
  },
  disabled: {
    backgroundColor: '#E5E7EB',
  },
});

export default PrimaryButton;
