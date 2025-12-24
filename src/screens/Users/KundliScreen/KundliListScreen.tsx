import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, getKundliDetails, getKundliList } from '../../../api/apiService';
import PrimaryButton from '../../../components/PrimaryButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import CustomeLoader from '../../../components/CustomeLoader';

const KundliListScreen = () => {
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<UserProfileParamList>>();
  const { t } = useTranslation();
  const [kundliList, setKundliList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKundliList = async () => {
    setLoading(true);
    try {
      const list = await getKundliList();
      console.log('List:', list);
      setKundliList(list);
    } catch (error) {
      console.error('Failed to fetch kundli list', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchKundliList();
    }, [])
  );

  const handleKundliPress = async (item: any) => {
    setLoading(true);
    try {
        const details = await getKundliDetails(item.id);
        console.log('Details:', details);
        navigation.navigate('KundliScreen', {
            kundliData: { kundli: { result_json: details?.result_json } },
            name: item.name,
            birthDate: item.date_of_birth,
            birthTime: item.time_of_birth,
            birthPlace: item.birth_place,
        });
    } catch (error) {
        console.error("Failed to fetch details", error);
    } finally {
        setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, THEMESHADOW.shadow]}
      onPress={() => handleKundliPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>
            {moment(item.date_of_birth).format('DD MMM YYYY')} • {item.birth_place}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.textGray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <UserCustomHeader title={t('rashi_ful')} showBackButton={true} />
      <View style={styles.contentContainer}>
        <CustomeLoader loading={loading} />
        <FlatList
          data={kundliList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>{t('no_kundli_found')}</Text> : null
          }
        />
        
        <View style={styles.buttonContainer}>
            <PrimaryButton
            title="Create New Kundli"
            onPress={() => navigation.navigate('KundliInputScreen')}
            />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Space for button
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  details: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default KundliListScreen;
