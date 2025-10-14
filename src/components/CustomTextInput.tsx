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
  onlyInteger?: boolean;
  maxIntegerLength?: number;
  required?: boolean;
  multiline?: boolean; // Add multiline prop, for explicit control
  numberOfLines?: number; // Also support numberOfLines if needed
}

function renderLabelWithRedStar(label: string, required?: boolean) {
  if (required) {
    const cleanLabel = label.replace(/\s*\*$/, '');
    return (
      <Text style={styles.inputTitle}>
        {cleanLabel}
        <Text style={styles.redStar}> *</Text>
      </Text>
    );
  }
  return <Text style={styles.inputTitle}>{label.replace(/\s*\*$/, '')}</Text>;
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
  required = false,
  multiline = true, // <--- Set default to multiline for this rewrite
  numberOfLines = 4, // <--- Suggest default, but allow override
}) => {
  // Handler to allow only integer input and limit length if specified
  const handleChangeText = (text: string) => {
    if (onlyInteger) {
      let filtered = text.replace(/[^0-9]/g, '');
      if (typeof maxIntegerLength === 'number' && maxIntegerLength > 0) {
        filtered = filtered.slice(0, maxIntegerLength);
      }
      onChangeText(filtered);
    } else {
      onChangeText(text);
    }
  };

  const showIntegerCount =
    onlyInteger && typeof maxIntegerLength === 'number' && maxIntegerLength > 0;

  return (
    <View style={[styles.inputField]}>
      {renderLabelWithRedStar(label, required)}
      <View
        style={[styles.inputArea, style, error ? styles.inputAreaError : null]}>
        <TextInput
          style={[
            styles.inputText,
            textColor ? {color: textColor} : null,
            inputStyle,
            multiline ? {textAlignVertical: 'top'} : null,
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
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
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
  redStar: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Medium,
    fontSize: 14,
  },
  inputArea: {
    height: 90, // Increased default height for multiline
    paddingVertical: 12.5,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    minHeight: 65,
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
    minHeight: 65,
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
