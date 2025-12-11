import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import moment from 'moment';
import { RouteProp, useRoute } from '@react-navigation/native';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const KundliScreen = () => {
  const inset = useSafeAreaInsets();
  const route = useRoute<RouteProp<UserProfileParamList, 'KundliScreen'>>();
  const { kundliData: apiData, name, birthDate, birthTime, birthPlace } = route.params || {};

  console.log("apiData", apiData);
  const [activeTab, setActiveTab] = useState<
    'Lagna' | 'Navamsa' | 'Dasha' | 'Sun' | 'Moon' | 'Dasamsa'
  >('Lagna');
  const data = apiData?.kundli?.result_json;

  if (!data) return <Text>No data</Text>;

  const user = data.user_details || {};
  // @ts-ignore
  const currentDasha = data.D1?.Dashas?.current || data.Dashas?.current;
  // @ts-ignore
  const hasDashas =
    data.Dashas?.Vimshottari?.mahadashas ||
    data.D1?.Dashas?.Vimshottari?.mahadashas;

  // Helper to get sign name
  const signNames = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ];

  // North Indian house numbers: fixed (1 at top-right, goes anti-clockwise)
  const houseOrder = [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  // Get planet symbol
  const planetSymbols: { [key: string]: string } = {
    Ascendant: 'As',
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
  };

  const getDerivedChart = (baseChart: any, planetName: string) => {
    if (!baseChart || !baseChart.planets || !baseChart.planets[planetName]) {
      return baseChart;
    }
    const planetData = baseChart.planets[planetName];
    return {
      ...baseChart,
      ascendant: {
        ...baseChart.ascendant,
        sign: planetData.sign,
        pos: planetData.pos,
      },
    };
  };

  const renderChart = (chartData: any) => {
    console.log('chartData', chartData);
    const planets = chartData?.planets || {};
    const ascendant = chartData?.ascendant;

    return (
      <View style={[styles.chartCard,THEMESHADOW.shadow]}>
        <View style={styles.diamondChart}>
          {/* Diagonals */}
          <View style={styles.diagonal1} />
          <View style={styles.diagonal2} />

          {/* Inner Diamond */}
          <View style={styles.innerDiamond} />

          {/* 12 Houses */}
          {houseOrder.map((houseNum, index) => {
            const signMap: { [key: string]: number } = {
              Aries: 1,
              Taurus: 2,
              Gemini: 3,
              Cancer: 4,
              Leo: 5,
              Virgo: 6,
              Libra: 7,
              Scorpio: 8,
              Sagittarius: 9,
              Capricorn: 10,
              Aquarius: 11,
              Pisces: 12,
            };

            const ascSignName = ascendant?.sign;
            const ascSignNum = signMap[ascSignName] || 1;

            const currentHouseSignNum = ((ascSignNum + houseNum - 2) % 12) + 1;

            // Find planets in this Sign (which corresponds to this House)
            const planetsInHouse = Object.entries(planets)
              .filter(([key, val]: [string, any]) => {
                const pSign = val.sign;
                const pSignNum = signMap[pSign];
                return pSignNum === currentHouseSignNum;
              })
              .map(([key]) => planetSymbols[key] || key);

            const isAscHouse = houseNum === 1;

            return (
              <View
                key={houseNum}
                style={[
                  styles.house,
                  styles[`house${houseNum}` as keyof typeof styles] as any,
                ]}
              >
                {/* Show Sign Number in the house */}
                <Text style={styles.houseNumber}>{currentHouseSignNum}</Text>

                {isAscHouse && <Text style={styles.asc}>Lagna</Text>}

                {planetsInHouse.map((p, i) => (
                  <Text key={i} style={styles.planet}>
                    {p}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTable = (chartData: any) => {
    const planets = chartData?.planets || {};
    const ascendant = chartData?.ascendant;
    const houses = chartData?.houses || [];

    // Map Sign to Sign Lord using houses data
    const signLordMap: { [key: string]: string } = {};
    houses.forEach((h: any) => {
      if (h.sign && h['sign-lord']) {
        signLordMap[h.sign] = h['sign-lord'];
      }
    });

    return (
      <View style={[styles.tableCard,THEMESHADOW.shadow]}>
        <Text style={styles.sectionTitle}>Planetary Positions</Text>

        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.2 }]}>
            Planet
          </Text>
          <Text style={[styles.cell, styles.headerCell]}>Sign</Text>
          <Text style={[styles.cell, styles.headerCell]}>Sign Lord</Text>
          <Text style={[styles.cell, styles.headerCell]}>Degree</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.5 }]}>
            House
          </Text>
        </View>

        {/* Ascendant Row */}
        <View style={styles.row}>
          <Text style={[styles.cell, { flex: 1.2, fontWeight: 'bold' }]}>
            Ascendant
          </Text>
          <Text style={styles.cell}>{ascendant?.sign}</Text>
          <Text style={styles.cell}>{signLordMap[ascendant?.sign] || '-'}</Text>
          <Text style={styles.cell}>{ascendant?.pos?.deg?.toFixed(2)}°</Text>
          <Text style={[styles.cell, { flex: 0.5 }]}>1</Text>
        </View>

        {/* Planets Rows */}
        {Object.entries(planets).map(([planet, info]: [string, any]) => (
          <View key={planet} style={styles.row}>
            <Text style={[styles.cell, { flex: 1.2, fontWeight: 'bold' }]}>
              {planet}
            </Text>
            <Text style={styles.cell}>{info.sign}</Text>
            <Text style={styles.cell}>{signLordMap[info.sign] || '-'}</Text>
            <Text style={styles.cell}>{info.pos?.deg?.toFixed(2)}°</Text>
            <Text style={[styles.cell, { flex: 0.5 }]}>
              {info['house-num']}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDashaList = () => {
    // @ts-ignore
    const mahadashas = data.Dashas?.Vimshottari?.mahadashas || {};
    const dashaList = Object.values(mahadashas).sort(
      (a: any, b: any) => a.dashaNum - b.dashaNum,
    );

    return (
      <View style={[styles.tableCard,THEMESHADOW.shadow]}>
        <Text style={styles.sectionTitle}>Vimshottari Dasha</Text>
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerCell]}>Dasha Lord</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>
            Start Date
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>
            End Date
          </Text>
          <Text style={[styles.cell, styles.headerCell]}>Duration</Text>
        </View>
        {dashaList.map((dasha: any, index: number) => (
          <View key={index} style={styles.row}>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>
              {dasha.lord}
            </Text>
            <Text style={[styles.cell, { flex: 1.5 }]}>
              {dasha.startDate?.split(' ')[0]}
            </Text>
            <Text style={[styles.cell, { flex: 1.5 }]}>
              {dasha.endDate?.split(' ')[0]}
            </Text>
            <Text style={styles.cell}>{dasha.duration}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      {/* Header pinned, not inside ScrollView */}
      <UserCustomHeader title="Kundli" showBackButton={true} />
      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Card below pinned header, with radii */}
          <View style={[styles.headerCard,THEMESHADOW.shadow]}>
            <Text style={styles.name}>{name || user.name || 'User'}</Text>
            <Text style={styles.details}>
              {birthDate
                ? moment(birthDate).format('DD-MM-YYYY')
                : `${user.birthdetails?.DOB?.day}-${user.birthdetails?.DOB?.month}-${user.birthdetails?.DOB?.year}`}{' '}
              •{' '}
              {birthTime
                ? moment(birthTime, 'HH:mm').format('HH:mm')
                : `${user.birthdetails?.TOB?.hour}:${user.birthdetails?.TOB?.min}`}{' '}
              • {birthPlace || user.birthdetails?.POB?.name}
            </Text>
            {currentDasha && (
              <Text style={styles.dasha}>
                Current Dasha: {currentDasha.dasha} - {currentDasha.bhukti} -{' '}
                {currentDasha.paryantardasha}
              </Text>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                'Lagna',
                'Navamsa',
                'Sun',
                'Moon',
                'Dasamsa',
                ...(hasDashas ? ['Dasha'] : []),
              ].map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    activeTab === tab && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          {activeTab === 'Lagna' && (
            <>
              {renderChart(data.D1)}
              {renderTable(data.D1)}
            </>
          )}
          {activeTab === 'Navamsa' && (
            <>
              {renderChart(data.D9)}
              {renderTable(data.D9)}
            </>
          )}
          {activeTab === 'Sun' && (
            <>
              {renderChart(getDerivedChart(data.D1, 'Sun'))}
              {renderTable(getDerivedChart(data.D1, 'Sun'))}
            </>
          )}
          {activeTab === 'Moon' && (
            <>
              {renderChart(getDerivedChart(data.D1, 'Moon'))}
              {renderTable(getDerivedChart(data.D1, 'Moon'))}
            </>
          )}
          {activeTab === 'Dasamsa' && (
            <>
              {renderChart(data.D10)}
              {renderTable(data.D10)}
            </>
          )}
          {activeTab === 'Dasha' && renderDashaList()}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  // Added separate content area so header stays fixed
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden', // Make sure border radii are clipped
  },
  headerCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    margin: 20,
    borderRadius: 15,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  details: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
  dasha: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 10,
    fontWeight: '600',
  },

  // Tabs
  tabContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  activeTabText: { color: COLORS.white },

  chartCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  diamondChart: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  line: { position: 'absolute', backgroundColor: COLORS.primary },
  // Diagonal 1: Top-Left to Bottom-Right
  diagonal1: {
    position: 'absolute',
    width: width * 0.8 * 1.414,
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -(width * 0.8 * 1.414) / 2 },
      { rotate: '45deg' },
    ],
  },
  // Diagonal 2: Top-Right to Bottom-Left
  diagonal2: {
    position: 'absolute',
    width: width * 0.8 * 1.414,
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -(width * 0.8 * 1.414) / 2 },
      { rotate: '-45deg' },
    ],
  },
  // Inner Diamond (Square rotated 45 degrees)
  innerDiamond: {
    position: 'absolute',
    width: '70.7%',
    height: '70.7%',
    top: '14.65%',
    left: '14.65%',
    borderWidth: 2,
    borderColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
  },
  house: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // North Indian Chart House Positions (Fixed Layout)
  // H1: Top Center (Diamond)
  house1: { top: '25%', left: '50%', marginLeft: -30, marginTop: -30 },
  // H2: Top Left (Triangle)
  house2: { top: '8%', left: '25%', marginLeft: -30, marginTop: -30 },
  // H3: Left Top (Triangle)
  house3: { top: '25%', left: '8%', marginLeft: -30, marginTop: -30 },
  // H4: Left Center (Diamond)
  house4: { top: '50%', left: '25%', marginLeft: -30, marginTop: -30 },
  // H5: Left Bottom (Triangle)
  house5: { top: '75%', left: '8%', marginLeft: -30, marginTop: -30 },
  // H6: Bottom Left (Triangle)
  house6: { top: '92%', left: '25%', marginLeft: -30, marginTop: -30 },
  // H7: Bottom Center (Diamond)
  house7: { top: '75%', left: '50%', marginLeft: -30, marginTop: -30 },
  // H8: Bottom Right (Triangle)
  house8: { top: '92%', left: '75%', marginLeft: -30, marginTop: -30 },
  // H9: Right Bottom (Triangle)
  house9: { top: '75%', left: '92%', marginLeft: -30, marginTop: -30 },
  // H10: Right Center (Diamond)
  house10: { top: '50%', left: '75%', marginLeft: -30, marginTop: -30 },
  // H11: Right Top (Triangle)
  house11: { top: '25%', left: '92%', marginLeft: -30, marginTop: -30 },
  // H12: Top Right (Triangle)
  house12: { top: '8%', left: '75%', marginLeft: -30, marginTop: -30 },

  houseNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 2,
    opacity: 0.7,
  },
  planet: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  asc: { fontSize: 10, color: COLORS.textPrimary, fontWeight: 'bold' },
  tableCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 15,
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeader: {
    backgroundColor: COLORS.lightGray,
    borderBottomWidth: 0,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 5,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  headerCell: {
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  planetName: { flex: 1.2, fontWeight: '600', textAlign: 'left' },
  value: { flex: 1, textAlign: 'center', color: COLORS.textSecondary },
});

export default KundliScreen;
