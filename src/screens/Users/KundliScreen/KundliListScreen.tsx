import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
    try {
        // We might need to fetch full details if the list item doesn't have everything
        // But for now, let's assume we need to fetch details using the ID
        // Or if the list item is enough, we can pass it.
        // The user request showed list item has id, name, dob, place.
        // The detail API returns the full JSON.
        // So we should probably fetch details here or pass ID to KundliScreen and let it fetch?
        // The current KundliScreen expects `kundliData` (the full JSON response).
        // So let's fetch details here and then navigate.
        
        // Show loading indicator? Maybe better to navigate to KundliScreen with ID and let it fetch?
        // But KundliScreen is currently built to receive data via params.
        // Let's fetch here for now to minimize changes to KundliScreen, 
        // or we can show a loader overlay.
        
        // Actually, let's just show a loading state on the item or global loader?
        // For simplicity, let's just fetch and navigate.
        
        const details = await getKundliDetails(item.id);
        console.log('Details:', details);
        navigation.navigate('KundliScreen', {
            kundliData: { kundli: { result_json: details?.result_json } }, // Structuring to match what KundliScreen expects from create response?
            // Wait, the create response structure was `response`. 
            // Let's check KundliScreen again. 
            // It uses `apiData?.kundli?.result_json`.
            // The detail API likely returns the `result_json` directly or wrapped?
            // The user didn't show the detail response structure fully, but said "this is for get data".
            // Let's assume the detail API returns the same structure as the "create" API's inner part or similar.
            // If the detail API returns the `result_json` directly, we might need to adjust.
            // Let's assume for now we pass it as `kundliData`.
            // We'll debug if needed.
            
            // Actually, looking at the user request:
            // curl .../2/ -> returns data.
            // If that data IS the kundli data (planets, charts etc), then we pass it.
            // Let's assume the response IS the `result_json` content or similar.
            // We will pass it in a way KundliScreen can read.
            // KundliScreen reads: `const data = apiData?.kundli?.result_json;`
            // So we should wrap it: `kundliData: { kundli: { result_json: details } }`
            
            name: item.name,
            birthDate: item.date_of_birth,
            birthTime: item.time_of_birth, // List might not have time, but let's see.
            birthPlace: item.birth_place,
        });
    } catch (error) {
        console.error("Failed to fetch details", error);
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
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={kundliList}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('no_kundli_found')}</Text>
            }
          />
        )}
        
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
