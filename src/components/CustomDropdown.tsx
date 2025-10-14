import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {moderateScale} from 'react-native-size-matters';
import {COLORS, FONTS, THEMESHADOW} from '../theme/theme';
import Fonts from '../theme/fonts';
import Icon from 'react-native-vector-icons/Feather';

interface DropdownItem {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean; // New prop to indicate if * should be red
}

function renderLabelWithRedStar(label?: string, required?: boolean) {
  if (!label) return null;
  // Remove any existing trailing * (for extra robustness)
  const cleanLabel = label.replace(/\s*\*$/, '');
  return (
    <Text style={styles.label}>
      {cleanLabel}
      {required && <Text style={styles.redStar}> *</Text>}
    </Text>
  );
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  label,
  error,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  const renderItem = ({item}: {item: DropdownItem}) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        onSelect(item.value);
        setIsOpen(false);
      }}>
      <Text style={styles.dropdownItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderLabelWithRedStar(label, required)}
      <TouchableOpacity
        style={[
          styles.dropdown,
          isOpen && styles.dropdownActive,
          error && styles.dropdownError,
        ]}
        onPress={() => setIsOpen(!isOpen)}>
        <Text
          style={[
            styles.dropdownText,
            !selectedItem && styles.placeholderText,
          ]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isOpen && (
        <View style={[styles.dropdownList, THEMESHADOW.shadow]}>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.value}
            style={styles.flatList}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(8),
  },
  label: {
    color: COLORS.inputLabelText,
    fontFamily: Fonts.Sen_Medium,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  redStar: {
    color: COLORS.error,
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Medium,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    padding: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownActive: {
    borderColor: COLORS.primary,
  },
  dropdownError: {
    borderColor: COLORS.error,
  },
  dropdownText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(14),
    color: COLORS.textPrimary,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    marginTop: moderateScale(5),
    maxHeight: moderateScale(150),
  },
  dropdownItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  dropdownItemText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(14),
    color: COLORS.textPrimary,
  },
  flatList: {
    flexGrow: 0,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(12),
    marginTop: moderateScale(4),
  },
});

export default CustomDropdown;
