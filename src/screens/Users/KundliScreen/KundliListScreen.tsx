import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { getKundliDetails, getKundliList } from '../../../api/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

interface KundliListItem {
  id: number;
  name: string;
  date_of_birth: string;
  time_of_birth?: string;
  birth_place: string;
  [key: string]: any;
}

const AVATAR_PALETTES = [
  { bg: '#FFF0F1', text: COLORS.primary, border: '#FFE0E3' },
  { bg: '#EEF2FF', text: '#4F46E5', border: '#E0E7FF' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
];

const KundliListScreen = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<UserProfileParamList>>();
  const { t } = useTranslation();
  const [kundliList, setKundliList] = useState<KundliListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchKundliList = async () => {
    setLoading(true);
    try {
      const list = await getKundliList();
      setKundliList(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch kundli list', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchKundliList();
    }, []),
  );

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) {
      return kundliList;
    }
    const query = searchQuery.toLowerCase().trim();
    return kundliList.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const placeMatch = item.birth_place?.toLowerCase().includes(query);
      return nameMatch || placeMatch;
    });
  }, [kundliList, searchQuery]);

  const handleKundliPress = async (item: KundliListItem) => {
    setLoading(true);
    try {
      const details = await getKundliDetails(item.id);
      navigation.navigate('KundliScreen', {
        kundliData: { kundli: details },
        name: item.name,
        birthDate: item.date_of_birth,
        birthTime: item.time_of_birth || '',
        birthPlace: item.birth_place,
      });
    } catch (error) {
      console.error('Failed to fetch details', error);
    } finally {
      setLoading(false);
    }
  };

  const getPalette = (index: number) => {
    return AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: KundliListItem;
    index: number;
  }) => {
    const palette = getPalette(index);
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'K';

    const avatarDynamicStyle = {
      backgroundColor: palette.bg,
      borderColor: palette.border,
    };
    const avatarTextDynamicStyle = {
      color: palette.text,
    };

    const formattedDate = item.date_of_birth
      ? moment(item.date_of_birth).format('DD MMM YYYY')
      : '';
    const formattedTime = item.time_of_birth
      ? moment(item.time_of_birth, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleKundliPress(item)}
      >
        <View style={styles.cardContent}>
          {/* Avatar with initial letter and subtle astrological badge */}
          <View style={[styles.avatarCircle, avatarDynamicStyle]}>
            <Text style={[styles.avatarText, avatarTextDynamicStyle]}>
              {initial}
            </Text>
            <View style={styles.avatarMiniBadge}>
              <Ionicons name="sparkles" size={8} color={palette.text} />
            </View>
          </View>

          {/* Details */}
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Birth Date & Time */}
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color="#64748B"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {formattedDate}
                {formattedTime ? ` • ${formattedTime}` : ''}
              </Text>
            </View>

            {/* Birth Place */}
            {!!item.birth_place && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color="#64748B"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.birth_place}
                </Text>
              </View>
            )}
          </View>

          {/* Forward Action Icon */}
          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const containerDynamic = { paddingTop: inset.top };
  const bottomBarDynamic = {
    paddingBottom: Math.max(inset.bottom + verticalScale(6), verticalScale(14)),
  };

  return (
    <View style={[styles.container, containerDynamic]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.headerGradient}
      />
      <UserCustomHeader
        title={t('rashi_ful') || 'Get your kundli'}
        showBackButton={true}
      />

      <View style={styles.sheetContainer}>
        <CustomeLoader loading={loading} />

        {/* Search Bar */}
        {kundliList.length > 0 && (
          <View style={styles.searchHeader}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={16}
                color="#94A3B8"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_kundli') || 'Search by name or city...'}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {!!searchQuery && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Total Count Badge */}
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredList.length}</Text>
            </View>
          </View>
        )}

        {/* List of Kundlis */}
        <FlatList
          style={styles.flatList}
          data={filteredList}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchKundliList}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons
                    name="planet-outline"
                    size={38}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? t('no_matching_kundli') || 'No matching Kundli found.'
                    : t('no_kundli_found') || 'No saved kundlis found.'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t('try_different_search') ||
                      'Try searching for a different name or location.'
                    : t('create_first_kundli_desc') ||
                      'Generate your Vedic birth chart to get planetary insights and predictions.'}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Fixed Bottom Action Bar */}
        <View style={[styles.bottomBar, bottomBarDynamic]}>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('KundliInputScreen')}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={COLORS.white}
              style={styles.createButtonIcon}
            />
            <Text style={styles.createButtonText}>
              {t('create_new_kundli') || 'Create New Kundli'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default KundliListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
    marginTop: verticalScale(6),
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(4),
    gap: scale(10),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    height: moderateScale(42),
    paddingHorizontal: scale(12),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: scale(4),
  },
  countBadge: {
    backgroundColor: '#FFF0F1',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#FFE0E3',
  },
  countBadgeText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(13),
    color: COLORS.primary,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(20),
    gap: verticalScale(10),
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: scale(12),
  },
  avatarText: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(18),
  },
  avatarMiniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(6),
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: verticalScale(3),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  infoIcon: {
    marginRight: scale(5),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  chevronCircle: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  emptyIconCircle: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(14),
  },
  emptyTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(16),
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  emptySubtitle: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(19),
    maxWidth: scale(260),
  },
  bottomBar: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    marginRight: scale(8),
  },
  createButtonText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Bold,
    fontSize: moderateScale(15),
  },
});
