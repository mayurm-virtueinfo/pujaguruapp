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
  errors?: any;
  errorField?: string;
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
  errors,
  errorField,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[
          COMPONENT_STYLES.input,
          errorField && errors?.[`${errorField}`] && styles.errorField,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        maxLength={maxLength}
      />
      {errorField && errors?.[`${errorField}`] && (
        <Text style={styles.errorText}>{errors[errorField]}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  errorField: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: moderateScale(14),
    marginTop: moderateScale(5),
    fontFamily: Fonts.Sen_Regular,
  },
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
});

export default ThemedInput;
