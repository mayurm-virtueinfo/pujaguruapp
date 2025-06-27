import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../../../components/CustomHeader';
import {COLORS} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import PrimaryButton from '../../../components/PrimaryButton';
import Octicons from 'react-native-vector-icons/Octicons';
import {apiService, PoojaBookingPlace} from '../../../api/apiService';
import {useNavigation} from '@react-navigation/native';

const PlaceSelectionScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleNextPress = () => {
    navigation.navigate('AddressSelectionScreen');
  };

  const [poojaPlaces, setPoojaPlaces] = useState<PoojaBookingPlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  useEffect(() => {
    fetchAllPoojaPlaces();
  }, []);

  const fetchAllPoojaPlaces = async () => {
    try {
      const response = await apiService.getBookingPlaces();
      console.log('Fetched Pooja place Requests:', response);
      if (response && Array.isArray(response)) {
        setPoojaPlaces(response);
      }
    } catch (error) {
      console.error('Error fetching pooja places:', error);
    }
  };

  console.log('Pooja Places:', poojaPlaces);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <CustomHeader title="Puja Booking" showBackButton={true} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Select Your Preference</Text>
            <Text style={styles.descriptionText}>
              Choose where do you need to do this puja at your place or tirth
              place?
            </Text>
            <View style={styles.pricingContainer}>
              {poojaPlaces.map((place, index) => (
                <React.Fragment key={place.id}>
                  <TouchableOpacity
                    style={styles.pricingOption}
                    activeOpacity={0.7}
                    onPress={() => setSelectedPlaceId(place.id)}>
                    <Text style={styles.pricingText}>{place.name}</Text>
                    <Octicons
                      name={
                        selectedPlaceId === place.id ? 'check-circle' : 'circle'
                      }
                      size={24}
                      color={
                        selectedPlaceId === place.id
                          ? COLORS.primary
                          : COLORS.inputBoder
                      }
                    />
                  </TouchableOpacity>
                  {index !== poojaPlaces.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
            <PrimaryButton
              title="NEXT"
              onPress={handleNextPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
              disabled={!selectedPlaceId}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.white,
  },
  contentWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginTop: 20,
  },
  pricingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBoder,
    marginBottom: 25,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  pricingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 8,
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  buttonContainer: {
    height: 46,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 1,
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Medium,
    marginTop: 10,
    textAlign: 'justify',
    color: '#6c7278',
  },
});

export default PlaceSelectionScreen;
