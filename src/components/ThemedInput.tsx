import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  KeyboardTypeOptions,
  TextInputProps,
  TextStyle,
} from 'react-native';
import {COLORS, COMPONENT_STYLES} from '../theme/theme';
import {moderateScale} from 'react-native-size-matters';
import Fonts from '../theme/fonts';

interface ThemedInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label?: string;
  labelStyle?: TextStyle;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  error?: string;
  editable?: boolean;
}

const ThemedInput: React.FC<ThemedInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  labelStyle,
  secureTextEntry = false,
  keyboardType = 'default',
  autoComplete = 'off',
  textContentType = 'none',
  maxLength,
  error,
  editable = true,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[COMPONENT_STYLES.input, error && styles.errorField]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        maxLength={maxLength}
        editable={editable}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  errorField: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: moderateScale(14),
    marginTop: moderateScale(5),
    fontFamily: Fonts.Sen_Regular,
  },
  container: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
});

export default ThemedInput;
