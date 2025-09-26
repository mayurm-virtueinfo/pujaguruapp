import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextStyle,
  ViewStyle,
} from 'react-native';
import React from 'react';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string;
  editable?: boolean;
  style?: ViewStyle;
  textColor?: string;
  inputStyle?: TextStyle;
  onlyInteger?: boolean; // Add this prop to restrict to integer input
  maxIntegerLength?: number; // Add this prop to restrict max integer length
}

const CustomTextInput: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  error,
  editable = true,
  style,
  textColor,
  inputStyle,
  onlyInteger = false,
  maxIntegerLength,
}) => {
  // Handler to allow only integer input and limit length if specified
  const handleChangeText = (text: string) => {
    if (onlyInteger) {
      // Remove all non-digit characters
      let filtered = text.replace(/[^0-9]/g, '');
      if (typeof maxIntegerLength === 'number' && maxIntegerLength > 0) {
        filtered = filtered.slice(0, maxIntegerLength);
      }
      onChangeText(filtered);
    } else {
      onChangeText(text);
    }
  };

  // Show how many digits entered if onlyInteger and maxIntegerLength are set
  const showIntegerCount =
    onlyInteger && typeof maxIntegerLength === 'number' && maxIntegerLength > 0;

  return (
    <View style={[styles.inputField]}>
      <Text style={styles.inputTitle}>{label}</Text>
      <View
        style={[styles.inputArea, style, error ? styles.inputAreaError : null]}>
        <TextInput
          style={[
            styles.inputText,
            textColor ? {color: textColor} : null,
            inputStyle,
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inputLabelText}
          keyboardType={onlyInteger ? 'numeric' : keyboardType}
          editable={editable}
          maxLength={
            onlyInteger && maxIntegerLength ? maxIntegerLength : undefined
          }
        />
      </View>
      {showIntegerCount && (
        <Text style={styles.countText}>
          {value.length}/{maxIntegerLength}
        </Text>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  inputField: {
    width: '100%',
    gap: 5,
  },
  inputTitle: {
    color: COLORS.inputLabelText,
    fontFamily: Fonts.Sen_Medium,
    fontSize: 14,
  },
  inputArea: {
    height: 46,
    paddingVertical: 12.5,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  inputAreaError: {
    borderColor: COLORS.error,
  },
  inputText: {
    color: '#191313',
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 12,
    marginTop: 4,
  },
  countText: {
    alignSelf: 'flex-end',
    color: COLORS.inputLabelText,
    fontSize: 12,
    marginTop: 2,
    marginRight: 2,
    fontFamily: Fonts.Sen_Regular,
  },
});
