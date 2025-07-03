import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
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
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {UserPoojaListParamList} from '../../../navigation/User/UserPoojaListNavigator';
import {PujaListItemType, RecommendedPuja} from '../../../api/apiService';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const PujaDetailsScreen: React.FC = () => {
  type ScreenNavigationProp = StackNavigationProp<
    UserPoojaListParamList,
    'PlaceSelectionScreen'
  >;
  const inset = useSafeAreaInsets();
  const navigation = useNavigation<ScreenNavigationProp>();
  const route = useRoute();

  const {data} = route.params as {data: PujaListItemType | RecommendedPuja};

  console.log('data in PujaDetailsScreen :: ', data);

  const handleBookNowPress = () => {
    console.log('Book Now pressed');
    navigation.navigate('PlaceSelectionScreen');
  };

  const [selectedPricingId, setSelectedPricingId] = useState<number | null>(
    null,
  );

  const handleCheckboxToggle = (id: number) => {
    setSelectedPricingId(id === selectedPricingId ? null : id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, {paddingTop: inset.top}]}>
      <StatusBar barStyle="light-content" />
      <UserCustomHeader
        title={data.name}
        showBackButton={true}
        showBellButton={true}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentWrapper}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: data.image,
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.descriptionText}>{data.description}</Text>
            <Text style={styles.sectionTitle}>Pricing Options</Text>
            <View style={styles.pricingContainer}>
              {data.pricing.map((option: any, idx: number) => (
                <React.Fragment key={option.id}>
                  <TouchableOpacity
                    style={styles.pricingOption}
                    activeOpacity={0.7}
                    onPress={() => handleCheckboxToggle(option.id)}>
                    <Text style={styles.pricingText}>
                      {option.priceDes} - Rs. {option.price}
                    </Text>
                    <Octicons
                      name={
                        selectedPricingId === option.id
                          ? 'check-circle'
                          : 'circle'
                      }
                      size={24}
                      color={
                        selectedPricingId === option.id
                          ? COLORS.primary
                          : COLORS.inputBoder
                      }
                    />
                  </TouchableOpacity>
                  {idx < data.pricing.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Visual Section</Text>
            <Text style={styles.visualText}>{data.visualSection}</Text>
            <PrimaryButton
              title="BOOK NOW"
              onPress={handleBookNowPress}
              style={styles.buttonContainer}
              textStyle={styles.buttonText}
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
    backgroundColor: COLORS.primaryBackground,
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
  imageContainer: {
    width: '100%',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  detailsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
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
  },
  pricingText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
  divider: {
    borderColor: COLORS.inputBoder,
    borderWidth: 1,
    marginVertical: 10,
  },
  visualText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    textAlign: 'justify',
  },
  buttonContainer: {
    height: 46,
    marginTop: 30,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts.Sen_Medium,
  },
});

export default PujaDetailsScreen;
