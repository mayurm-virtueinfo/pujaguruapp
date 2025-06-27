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
import {useNavigation} from '@react-navigation/native';

const PujaDetailsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBookNowPress = () => {
    console.log('Book Now pressed');
    navigation.navigate('PlaceSelectionScreen');
  };

  const [isCheckedWithItems, setIsCheckedWithItems] = useState(false);
  const [isCheckedWithoutItems, setIsCheckedWithoutItems] = useState(false);

  const handleCheckboxToggle = (option: 'withItems' | 'withoutItems') => {
    if (option === 'withItems') {
      setIsCheckedWithItems(!isCheckedWithItems);
      setIsCheckedWithoutItems(false);
    } else {
      setIsCheckedWithoutItems(!isCheckedWithoutItems);
      setIsCheckedWithItems(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <CustomHeader
        title="Ganesh Puja"
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
                uri: 'https://static.toiimg.com/thumb/msid-86058708,width-1280,height-720,resizemode-4/86058708.jpg',
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.descriptionText}>
              Ganesh Puja is a significant Hindu festival celebrated to honor
              Lord Ganesha, the remover of obstacles and the god of beginnings.
              The puja involves various rituals including the chanting of
              mantras, offering...
            </Text>
            <Text style={styles.sectionTitle}>Pricing Options</Text>
            <View style={styles.pricingContainer}>
              <TouchableOpacity
                style={styles.pricingOption}
                activeOpacity={0.7}
                onPress={() => handleCheckboxToggle('withItems')}>
                <Text style={styles.pricingText}>
                  With Puja Items - Rs. 5000
                </Text>
                <Octicons
                  name={isCheckedWithItems ? 'check-circle' : 'circle'}
                  size={24}
                  color={
                    isCheckedWithItems ? COLORS.primary : COLORS.inputBoder
                  }
                />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.pricingOption}
                activeOpacity={0.7}
                onPress={() => handleCheckboxToggle('withoutItems')}>
                <Text style={styles.pricingText}>
                  Without Puja Items - Rs. 3000
                </Text>
                <Octicons
                  name={isCheckedWithoutItems ? 'check-circle' : 'circle'}
                  size={24}
                  color={
                    isCheckedWithoutItems ? COLORS.primary : COLORS.inputBoder
                  }
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Visual Section</Text>
            <Text style={styles.visualText}>
              The images below showcase the various stages and items involved in
              the Ganesh Puja. From the beautifully decorated altar to the
              essential puja items, these visuals provide a clear idea of what
              to expect...
            </Text>
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
