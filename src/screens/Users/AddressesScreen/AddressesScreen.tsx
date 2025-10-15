import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView, StatusBar} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useNavigation,
  RouteProp,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
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
import {translateData} from '../../../utils/TranslateData';

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
  const {t, i18n} = useTranslation();
  const {showSuccessToast, showErrorToast} = useCommonToast();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [originalAddresses, setOriginalAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const route = useRoute<RouteProp<UserProfileParamList, 'AddressesScreen'>>();

  console.log('selectedAddress :: ', selectedAddress);

  const addressToEdit =
    (route.params && (route.params as any).addressToEdit) || null;
  const inset = useSafeAreaInsets();

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchAddressData = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setAddresses(cachedData);
        setLoading(false);
        return;
      }

      const response: any = await getAddress();
      setOriginalAddresses(response.data);

      const translated: any = await translateData(
        response.data,
        currentLanguage,
        [
          'address_type',
          'address_line1',
          'address_line2',
          'city',
          'state',
          'name',
        ],
      );
      translationCacheRef.current.set(currentLanguage, translated);
      setAddresses(translated || []);
    } catch {
      setAddresses([]);
      setOriginalAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddressData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      translationCacheRef.current.delete(currentLanguage);
      fetchAddressData();
    }, [fetchAddressData, currentLanguage]),
  );

  const handleMenuPress = (
    address: Address,
    position: {x: number; y: number},
  ) => {
    const translatedAddress: any = originalAddresses.find(
      a => a.id === address.id,
    );
    setSelectedAddress(translatedAddress);
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
      translationCacheRef.current.delete(currentLanguage);
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
    <View style={[styles.container, {paddingTop: inset.top}]}>
      <CustomeLoader loading={loading} />

      <UserCustomHeader
        title={t('address')}
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
              style={[styles.addressList, THEMESHADOW.shadow]}
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
    </View>
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
