import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useTranslation} from 'react-i18next';
import AddressCard from '../../../components/AddressCard';
import AddressMenu from '../../../components/AddressMenu';
import {address, apiService} from '../../../api/apiService';
import CustomeLoader from '../../../components/CustomeLoader';

const AddressesScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<address | null>(null);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const [addresses, setAddresses] = useState<address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddressData();
  }, []);

  const fetchAddressData = async () => {
    setLoading(true);
    try {
      const requests = await apiService.getAddressData();
      console.log('addresses : ', addresses);
      setAddresses(requests.address || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = (
    address: address,
    position: {x: number; y: number},
  ) => {
    setSelectedAddress(address);
    setMenuPosition(position);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    console.log('Edit address:', selectedAddress?.id);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    console.log('Delete address:', selectedAddress?.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomeLoader loading={loading} />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <UserCustomHeader
        title={t('my_addresses')}
        showBackButton={true}
        showCirclePlusButton={true}
      />

      <View style={styles.content}>
        <Text style={styles.savedAddressesTitle}>
          {addresses.length} {t('saved_addresses')}
        </Text>

        <ScrollView
          style={styles.addressList}
          showsVerticalScrollIndicator={false}>
          {addresses.map(address => (
            <AddressCard
              key={address.id}
              address={address}
              onMenuPress={handleMenuPress}
            />
          ))}
        </ScrollView>
      </View>

      <AddressMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        position={menuPosition}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.background,
  },
  savedAddressesTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    marginBottom: 11,
  },
  addressList: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default AddressesScreen;
