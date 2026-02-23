import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS, COMMON_CARD_STYLE } from '../theme/theme';
import Fonts from '../theme/fonts';
import { Address } from '../screens/Users/AddressesScreen/AddressesScreen';
import { moderateScale } from 'react-native-size-matters';

interface AddressCardProps {
  address: Address;
  onMenuPress: (address: Address, position: { x: number; y: number }) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onMenuPress }) => {
  const buttonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const handleMenuPress = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          onMenuPress(address, { x: x, y: y });
        },
      );
    }
  };

  const addressLines = [
    address.address_line1,
    address.address_line2,
    address.city_name,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>
          {address.name ? address.name : 'Address'}
        </Text>
        {address.address_type ? (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{address.address_type}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          ref={buttonRef}
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={COLORS.pujaCardSubtext}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.addressText}>{addressLines}</Text>
      {address.phone_number ? (
        <Text style={styles.phoneText}>{address.phone_number}</Text>
      ) : null}
    </View>
  );
};

export default AddressCard;

const styles = StyleSheet.create({
  addressCard: {
    ...(COMMON_CARD_STYLE as ViewStyle),
    flexDirection: 'column',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  addressName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    marginRight: moderateScale(5),
  },
  typeBadge: {
    backgroundColor: COLORS.badgeBackground,
    borderRadius: 4,
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(3),
    marginRight: 'auto',
  },
  typeText: {
    color: COLORS.pujaCardSubtext,
    fontSize: 11,
    fontFamily: Fonts.Sen_SemiBold,
  },
  menuButton: {
    position: 'absolute',
    right: 0,
    top: -4,
  },
  addressText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    marginTop: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  phoneText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
  },
});
