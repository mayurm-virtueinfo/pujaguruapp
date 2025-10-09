import React, {useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../theme/theme';
import Fonts from '../theme/fonts';
import {Address} from '../screens/Users/AddressesScreen/AddressesScreen';

interface AddressCardProps {
  address: Address;
  onMenuPress: (address: Address, position: {x: number; y: number}) => void;
  isLast?: boolean;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onMenuPress,
  isLast = false,
}) => {
  const buttonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const handleMenuPress = () => {
    if (buttonRef.current) {
      buttonRef.current.measure(
        (
          fx: number,
          fy: number,
          width: number,
          height: number,
          px: number,
          py: number,
        ) => {
          onMenuPress(address, {x: px, y: py});
        },
      );
    }
  };

  // Compose address lines
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
        {address.label && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{address.label}</Text>
          </View>
        )}
        <TouchableOpacity
          ref={buttonRef}
          style={styles.menuButton}
          onPress={handleMenuPress}>
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
      {!isLast && <View style={styles.cardSeparator} />}
    </View>
  );
};

export default AddressCard;

const styles = StyleSheet.create({
  addressCard: {
    backgroundColor: 'transparent',
    marginBottom: 0,
    position: 'relative',
    borderRadius: 0,
    padding: 0,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.Sen_SemiBold,
    marginRight: 5,
  },
  typeBadge: {
    backgroundColor: COLORS.badgeBackground,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginRight: 'auto',
  },
  typeText: {
    color: COLORS.pujaCardSubtext,
    fontSize: 11,
    fontFamily: Fonts.Sen_SemiBold,
  },
  menuButton: {
    padding: 4,
    position: 'absolute',
    right: 0,
    top: -4,
  },
  addressText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    marginTop: 4,
    marginBottom: 4,
    paddingRight: 40,
  },
  phoneText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 14,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginBottom: 14,
  },
});
