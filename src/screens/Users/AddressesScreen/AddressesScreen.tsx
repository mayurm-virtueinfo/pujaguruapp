import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useNavigation,
  RouteProp,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useTranslation} from 'react-i18next';
import AddressCard from '../../../components/AddressCard';
import AddressMenu from '../../../components/AddressMenu';
import {getAddress, deleteAddress} from '../../../api/apiService';
import CustomeLoader from '../../../components/CustomeLoader';
import {UserProfileParamList} from '../../../navigation/User/userProfileNavigator';
import CustomModal from '../../../components/CustomModal';
import {useCommonToast} from '../../../common/CommonToast';

// Define the address type based on the API response structure
export interface Address {
  id: number;
  name: string;
  address_type: string;
  address_line1: string;
  address_line2: string;
  phone_number: string;
  city: number;
  city_name?: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

const AddressesScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileParamList>();
  const {t} = useTranslation();
  const {showSuccessToast, showErrorToast} = useCommonToast();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Use useRoute to get params (if any)
  const route = useRoute<RouteProp<UserProfileParamList, 'AddressesScreen'>>();
  // Try to get addressToEdit from route params, fallback to null
  // But in this screen, there is no addressToEdit param, so always undefined
  const addressToEdit =
    (route.params && (route.params as any).addressToEdit) || null;

  // Memoize fetchAddressData so it can be used in useFocusEffect
  const fetchAddressData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await getAddress();
      let addressList: Address[] = [];
      if (
        requests &&
        typeof requests === 'object' &&
        'data' in requests &&
        Array.isArray((requests as any).data)
      ) {
        addressList = (requests as any).data;
      }
      setAddresses(addressList);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call fetchAddressData on mount and when screen is focused
  useEffect(() => {
    fetchAddressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAddressData();
    }, [fetchAddressData]),
  );

  const handleMenuPress = (
    address: Address,
    position: {x: number; y: number},
  ) => {
    setSelectedAddress(address);
    setMenuPosition(position);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (selectedAddress) {
      navigation.navigate('AddAddressScreen', {addressToEdit: selectedAddress});
    } else {
      navigation.navigate('AddAddressScreen');
    }
  };

  const handleDelete = () => {
    setMenuVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteModalVisible(false);
    if (!selectedAddress) return;
    setLoading(true);
    try {
      await deleteAddress({id: selectedAddress.id});
      await fetchAddressData();
      showSuccessToast(t('address_deleted_successfully'));
    } catch (error) {
      showErrorToast(t('failed_to_delete_address'));
      console.error('Failed to delete address:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
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
        title={addressToEdit ? t('edit_address') : t('add_address')}
        showBackButton={true}
        showCirclePlusButton={true}
        onPlusPress={() => navigation.navigate('AddAddressScreen')}
      />

      <View style={styles.content}>
        <Text style={styles.savedAddressesTitle}>
          {addresses.length} {t('saved_addresses')}
        </Text>

        <View>
          {addresses.length === 0 && !loading ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>{t('no_addresses_found')}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.addressList}
              showsVerticalScrollIndicator={false}>
              {addresses.map((address, idx) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onMenuPress={handleMenuPress}
                  isLast={idx === addresses.length - 1 && addresses.length > 0}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <AddressMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        position={menuPosition}
      />

      <CustomModal
        visible={deleteModalVisible}
        title={`${t('delete')} ${t('address')}`}
        message={t('are_you_sure_you_want_to_delete_address')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: COLORS.textSecondary || '#888',
    fontSize: 16,
    fontFamily: Fonts.Sen_Regular,
  },
});

export default AddressesScreen;
