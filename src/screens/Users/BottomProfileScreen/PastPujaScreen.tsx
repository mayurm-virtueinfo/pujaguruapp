import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {moderateScale} from 'react-native-size-matters';
import {getPastBookings} from '../../../api/apiService';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import Fonts from '../../../theme/fonts';
import CustomeLoader from '../../../components/CustomeLoader';
import {translateData} from '../../../utils/TranslateData';
import {UserProfileParamList} from '../../../navigation/User/userProfileNavigator';
import {StackNavigationProp} from '@react-navigation/stack';

type PastBookingType = {
  id: number;
  pooja_name: string;
  pooja_image_url: string;
  booking_status: string;
  booking_date: string;
};

const PastPujaScreen: React.FC = () => {
  type ScreenNavigationProps = StackNavigationProp<
    UserProfileParamList,
    'PastBookingDetailsScreen'
  >;
  const {t, i18n} = useTranslation();
  const navigation = useNavigation<ScreenNavigationProps>();
  const insets = useSafeAreaInsets();
  const [pastBookings, setPastBookings] = useState<PastBookingType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchPastBookings = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setPastBookings(cachedData);
        setLoading(false);
        return;
      }

      const response: any = await getPastBookings();
      console.log('response', JSON.stringify(response.data));
      if (response.status === 200) {
        const translated: any = await translateData(
          response.data,
          currentLanguage,
          ['pooja_name', 'booking_status'],
        );
        translationCacheRef.current.set(currentLanguage, translated);
        setPastBookings(translated || []);
      }
    } catch (error) {
      setPastBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchPastBookings();
  }, [fetchPastBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPastBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#00A40E';
      case 'cancelled':
        return '#E5AA0E';
      case 'rejected':
        return '#FA1927';
      case 'pending':
      case 'panding':
        return COLORS.gray;
      default:
        return COLORS.gray;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', {month: 'long'});
    const year = date.getFullYear();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
        ? 'rd'
        : 'th';
    return `${t('scheduled_for')} ${day}${suffix} ${month} ${year}`;
  };

  const renderBookingItem = ({item}: {item: PastBookingType}) => {
    return (
      <TouchableOpacity
        style={styles.bookingItem}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('PastBookingDetailsScreen', {pujaId: item.id});
        }}>
        <Image
          source={{uri: item.pooja_image_url}}
          style={styles.bookingImage}
        />
        <View style={styles.bookingInfo}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {item.pooja_name}
            </Text>
            <Text
              style={[
                styles.statusText,
                {color: getStatusColor(item.booking_status)},
              ]}>
              {item.booking_status.charAt(0).toUpperCase() +
                item.booking_status.slice(1)}
            </Text>
          </View>
          <Text style={styles.bookingDate}>
            {formatDate(item.booking_date)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <CustomeLoader loading={loading} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader title={t('past_bookings')} showBackButton={true} />
      <View style={styles.contentContainer}>
        <View style={[styles.listContainer, THEMESHADOW.shadow]}>
          <FlatList
            data={pastBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={[
              styles.flatListContent,
              // If empty, center the empty text vertically
              pastBookings.length === 0
                ? {flex: 1, justifyContent: 'center'}
                : {},
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={{alignItems: 'center', marginVertical: 20}}>
                  <Text
                    style={{
                      color: COLORS.gray,
                      fontFamily: Fonts.Sen_Medium,
                      fontSize: 16,
                    }}>
                    {t('no_item_available')}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  listContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    margin: 24,
  },
  flatListContent: {
    flexGrow: 1,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 0,
    minHeight: 52,
  },
  bookingImage: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: 10,
    marginRight: 9,
    flexShrink: 0,
  },
  bookingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 7,
    gap: 20,
  },
  bookingTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: COLORS.primaryTextDark,
    fontFamily: Fonts.Sen_SemiBold,
    flex: 1,
    flexShrink: 1,
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    fontFamily: Fonts.Sen_SemiBold,
    textAlign: 'right',
    flexShrink: 0,
  },
  bookingDate: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: COLORS.pujaCardSubtext,
    fontFamily: Fonts.Sen_Medium,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: 13,
    flexShrink: 0,
  },
});

export default PastPujaScreen;
