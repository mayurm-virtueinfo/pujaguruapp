import {StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

const CustomTextInput: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.inputField}>
      <Text style={styles.inputTitle}>{label}</Text>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inputLabelText}
          keyboardType={keyboardType}
        />
      </View>
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
  inputText: {
    color: '#191313',
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
});
