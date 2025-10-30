import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  useColorScheme,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import i18n, {changeLanguage} from '../i18n';
import {Picker} from '@react-native-picker/picker';
import {COLORS} from '../theme/theme';

export default function LanguageSwitcher() {
  const {t} = useTranslation();
  const initialLang = ['en', 'hi', 'gu', 'mr'].includes(i18n.language)
    ? (i18n.language as 'en' | 'hi' | 'gu' | 'mr')
    : 'en';
  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();

  // Use theme colors as base, fallback for colorScheme
  const dynamicTextColor =
    colorScheme === 'dark'
      ? COLORS.black
      : COLORS.black;
  const dynamicBGColor =
    colorScheme === 'dark'
      ? COLORS.white
      : COLORS.white;
  const dynamicBorderColor =
    colorScheme === 'dark'
      ? COLORS.textGray
      : COLORS.borderColor;

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    setSelectedLang(lang as typeof selectedLang);
    setModalVisible(false);
    console.log('lang :: ', lang);
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, {color: dynamicTextColor}]}>{t('language')}</Text>
        <TouchableOpacity
          style={[
            styles.iosPickerButton,
            {
              borderColor: dynamicBorderColor,
              backgroundColor: dynamicBGColor,
            },
          ]}
          onPress={() => setModalVisible(true)}>
          <Text style={[styles.iosPickerButtonText, {color: dynamicTextColor}]}>
            {selectedLang === 'en'
              ? 'English'
              : selectedLang === 'hi'
              ? 'हिन्दी'
              : selectedLang === 'gu'
              ? 'ગુજરાતી'
              : 'मराठी'}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}>
            <View
              style={[
                styles.iosModalContent,
                {
                  backgroundColor: dynamicBGColor,
                },
              ]}>
              <Picker
                selectedValue={selectedLang}
                onValueChange={itemValue => handleLanguageChange(itemValue)}
                style={[
                  styles.iosPicker,
                  {
                    color: dynamicTextColor,
                  },
                ]}
                itemStyle={{
                  color: dynamicTextColor,
                  backgroundColor: dynamicBGColor,
                }}>
                <Picker.Item label="English" value="en" />
                <Picker.Item label="हिन्दी" value="hi" />
                <Picker.Item label="ગુજરાતી" value="gu" />
                <Picker.Item label="मराठी" value="mr" />
              </Picker>
              <TouchableOpacity
                style={[
                  styles.iosDoneButton,
                  {
                    backgroundColor: dynamicBorderColor,
                  },
                ]}
                onPress={() => setModalVisible(false)}>
                <Text style={[styles.iosDoneButtonText, {color: COLORS.white}]}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Android custom styled picker with overlay chevron if in dark mode
  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: dynamicTextColor}]}>{t('language')}</Text>
      <View
        style={[
          styles.pickerContainer,
          {
            borderColor: dynamicBorderColor,
            backgroundColor: dynamicBGColor,
          },
        ]}>
        <Picker
          selectedValue={selectedLang}
          style={[
            styles.picker,
            {
              color: dynamicTextColor,
              backgroundColor: dynamicBGColor,
            },
          ]}
          dropdownIconColor={dynamicTextColor}
          onValueChange={itemValue => handleLanguageChange(itemValue)}
          mode="dropdown">
          <Picker.Item label="English" value="en" />
          <Picker.Item label="हिन्दी" value="hi" />
          <Picker.Item label="ગુજરાતી" value="gu" />
          <Picker.Item label="मराठी" value="mr" />
        </Picker>
        {/* Overlay a ▼ icon for dark mode to mask ugly default picker icon */}
        {Platform.OS === 'android' && colorScheme === 'dark' && (
          <View pointerEvents="none" style={styles.chevronOverlay}>
            <Text style={{fontSize: 16, color: dynamicTextColor}}>▼</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    width: 180,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    width: '100%',
  },
  chevronOverlay: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  iosPickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    width: 180,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPickerButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  iosPicker: {
    width: 250,
    height: 180,
  },
  iosDoneButton: {
    marginTop: 10,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8
  },
  iosDoneButtonText: {
    fontSize: 16,
  },
});
