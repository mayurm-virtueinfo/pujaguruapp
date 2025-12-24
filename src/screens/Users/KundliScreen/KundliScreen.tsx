import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
// import { Toast } from 'react-native-toast-notifications';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import moment from 'moment';
import { RouteProp, useRoute } from '@react-navigation/native';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
// @ts-ignore
import { generatePDF as htmlToPdfConvert } from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { useCommonToast } from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const KundliScreen = () => {
  const inset = useSafeAreaInsets();
  const {t} = useTranslation();
  const viewShotRefLagna = useRef<ViewShot>(null);
  const viewShotRefNavamsa = useRef<ViewShot>(null);
  const viewShotRefSun = useRef<ViewShot>(null);
  const viewShotRefMoon = useRef<ViewShot>(null);
  const viewShotRefDasamsa = useRef<ViewShot>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useCommonToast();

  const route = useRoute<RouteProp<UserProfileParamList, 'KundliScreen'>>();
  const {
    kundliData: apiData,
    name,
    birthDate,
    birthTime,
    birthPlace,
  } = route.params || {};

  console.log('apiData', apiData);
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
      <View style={[styles.chartCard, THEMESHADOW.shadow]}>
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
      <View style={[styles.tableCard, THEMESHADOW.shadow]}>
        <Text style={styles.sectionTitle}>{t('planetary_positions')}</Text>

        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.2 }]}>
            {t('planet')}
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.3 }]}>
            {t('sign')}
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.1 }]}>
            {t('sign_lord')}
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.9 }]}>
            {t('degree')}
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.7 }]}>
            {t('house')}
          </Text>
        </View>

        {/* Ascendant Row */}
        <View style={styles.row}>
          <Text style={[styles.cell, styles.planetText, { flex: 1.2 }]}>
            Ascendant
          </Text>
          <Text style={[styles.cell, { flex: 1.3 }]}>{ascendant?.sign}</Text>
          <Text style={[styles.cell, { flex: 1.1 }]}>
            {signLordMap[ascendant?.sign] || '-'}
          </Text>
          <Text style={[styles.cell, { flex: 0.9 }]}>
            {ascendant?.pos?.deg?.toFixed(2)}°
          </Text>
          <Text style={[styles.cell, { flex: 0.7 }]}>1</Text>
        </View>

        {/* Planets Rows */}
        {Object.entries(planets).map(
          ([planet, info]: [string, any], index, array) => (
            <View
              key={planet}
              style={[
                styles.row,
                index === array.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={[styles.cell, styles.planetText, { flex: 1.2 }]}>
                {planet}
              </Text>
              <Text style={[styles.cell, { flex: 1.3 }]}>{info.sign}</Text>
              <Text style={[styles.cell, { flex: 1.1 }]}>
                {signLordMap[info.sign] || '-'}
              </Text>
              <Text style={[styles.cell, { flex: 0.9 }]}>
                {info.pos?.deg?.toFixed(2)}°
              </Text>
              <Text style={[styles.cell, { flex: 0.7 }]}>
                {info['house-num']}
              </Text>
            </View>
          ),
        )}
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
      <View style={[styles.tableCard, THEMESHADOW.shadow]}>
        <Text style={styles.sectionTitle}>{t('vimshottari_dasha')}</Text>
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerCell]}>{t('lord')}</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>
            {t('start_date')}
          </Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>
            {t('end_date')}
          </Text>
          <Text style={[styles.cell, styles.headerCell]}>{t('duration')}</Text>
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

  const generatePDF = async (chartImages: any = {}) => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; padding-bottom: 50px; }
              h1 { text-align: center; color: #E7503D; }
              .section { margin-bottom: 20px; }
              .header-info { text-align: center; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
              .chart-container { text-align: center; margin-bottom: 30px; page-break-inside: avoid; }
              .chart-img { max-width: 100%; height: auto; background-color: #fff; }
              .footer { text-align: center; color: #E7503D; font-size: 18px; padding: 20px; background: white; margin-top: 50px; }
              .page-break { page-break-after: always; }
              .chart-title { font-size: 20px; color: #E7503D; text-align: center; margin-bottom: 10px; margin-top: 20px; }
            </style>
          </head>
          <body>

            <h1>${t('kundli_report')}</h1>
            
            <div class="header-info">
              <h2>${name || user.name || 'User'}</h2>
              <p>
                <strong>${t('birth_date')}:</strong> ${
                  birthDate
                    ? moment(birthDate).format('DD-MM-YYYY')
                    : `${user.birthdetails?.DOB?.day}-${user.birthdetails?.DOB?.month}-${user.birthdetails?.DOB?.year}`
                } &nbsp; • &nbsp;
                <strong>${t('time_of_birth')}:</strong> ${
                  birthTime
                    ? moment(birthTime, 'HH:mm').format('HH:mm')
                    : `${user.birthdetails?.TOB?.hour}:${user.birthdetails?.TOB?.min}`
                }
              </p>
              <p><strong>${t('birth_place')}:</strong> ${
                birthPlace || user.birthdetails?.POB?.name
              }</p>
            </div>

            <!-- Lagna Chart -->
            ${
                chartImages.lagna 
                ? `
                <div class="section chart-container">
                  <div class="chart-title">${t('lagna_chart')}</div>
                  <img src="data:image/jpeg;base64,${chartImages.lagna}" class="chart-img" />
                </div>
                ` 
                : ''
            }
            
            <div class="section" style="margin-top: 20px;">
              <h3>${t('planetary_positions')}</h3>
              <table>
                <tr>
                  <th>${t('planet')}</th>
                  <th>${t('sign')}</th>
                  <th>${t('degree')}</th>
                  <th>${t('house')}</th>
                </tr>
                <tr>
                  <td>Ascendant</td>
                  <td>${data.D1?.ascendant?.sign}</td>
                  <td>${data.D1?.ascendant?.pos?.deg?.toFixed(2)}°</td>
                  <td>1</td>
                </tr>
                ${Object.entries(data.D1?.planets || {})
                  .map(
                    ([planet, info]: any) => `
                  <tr>
                    <td>${planet}</td>
                    <td>${info.sign}</td>
                    <td>${info.pos?.deg?.toFixed(2)}°</td>
                    <td>${info['house-num']}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </table>
            </div>

            <div class="footer">
              <p>${t('app_tagline')}</p>
            </div>

            <div class="page-break"></div>

            <!-- Navamsa Chart -->
            ${
                chartImages.navamsa 
                ? `
                <div class="section chart-container">
                  <div class="chart-title">${t('navamsa_chart')}</div>
                  <img src="data:image/jpeg;base64,${chartImages.navamsa}" class="chart-img" style="max-height: 500px;" />
                   <div class="footer">
                    <p>${t('app_tagline')}</p>
                   </div>
                </div>
                <div class="page-break"></div>
                ` 
                : ''
            }

            <!-- Sun Chart -->
            ${
                chartImages.sun 
                ? `
                <div class="section chart-container">
                  <div class="chart-title">${t('sun_chart')}</div>
                  <img src="data:image/jpeg;base64,${chartImages.sun}" class="chart-img" style="max-height: 500px;" />
                   <div class="footer">
                    <p>${t('app_tagline')}</p>
                   </div>
                </div>
                <div class="page-break"></div>
                ` 
                : ''
            }

             <!-- Moon Chart -->
            ${
                chartImages.moon 
                ? `
                <div class="section chart-container">
                  <div class="chart-title">${t('moon_chart')}</div>
                  <img src="data:image/jpeg;base64,${chartImages.moon}" class="chart-img" style="max-height: 500px;" />
                   <div class="footer">
                    <p>${t('app_tagline')}</p>
                   </div>
                </div>
                <div class="page-break"></div>
                ` 
                : ''
            }

             <!-- Dasamsa Chart -->
            ${
                chartImages.dasamsa 
                ? `
                <div class="section chart-container">
                  <div class="chart-title">${t('dasamsa_chart')}</div>
                  <img src="data:image/jpeg;base64,${chartImages.dasamsa}" class="chart-img" style="max-height: 500px;" />
                   <div class="footer">
                    <p>${t('app_tagline')}</p>
                   </div>
                </div>
                <div class="page-break"></div>
                ` 
                : ''
            }

            <div class="section">
              <h3>${t('vimshottari_dasha')}</h3>
               <table>
                <tr>
                  <th>${t('lord')}</th>
                  <th>${t('start_date')}</th>
                  <th>${t('end_date')}</th>
                </tr>
                 ${Object.values(
                   // @ts-ignore
                   data.Dashas?.Vimshottari?.mahadashas ||
                     data.D1?.Dashas?.Vimshottari?.mahadashas ||
                     {},
                 )
                   .sort((a: any, b: any) => a.dashaNum - b.dashaNum)
                   .map(
                     (dasha: any) => `
                  <tr>
                    <td>${dasha.lord}</td>
                    <td>${dasha.startDate?.split(' ')[0]}</td>
                    <td>${dasha.endDate?.split(' ')[0]}</td>
                  </tr>
                `,
                   )
                   .join('')}
              </table>
            </div>

            <div class="footer">
              <p>${t('app_tagline')}</p>
            </div>
          </body>
        </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `Kundli_${name || 'User'}`,
        base64: false,
      };

      // @ts-ignore
      const file = await htmlToPdfConvert(options);
      console.log('PDF Generated:', file.filePath);
      return file.filePath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const captureAllCharts = async () => {
    const charts: any = {};
    try {
        if(viewShotRefLagna.current?.capture) charts.lagna = await viewShotRefLagna.current.capture();
        if(viewShotRefNavamsa.current?.capture) charts.navamsa = await viewShotRefNavamsa.current.capture();
        if(viewShotRefSun.current?.capture) charts.sun = await viewShotRefSun.current.capture();
        if(viewShotRefMoon.current?.capture) charts.moon = await viewShotRefMoon.current.capture();
        if(viewShotRefDasamsa.current?.capture) charts.dasamsa = await viewShotRefDasamsa.current.capture();
    } catch(e) {
        console.log("Error capturing charts", e);
    }
    return charts;
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const chartImages = await captureAllCharts();
      const filePath = await generatePDF(chartImages);
      if (filePath) {
        const shareOptions = {
          title: t('share_kundli'),
          message: `${t('kundli_for')} ${name || 'User'}`,
          url: `file://${filePath}`,
          type: 'application/pdf',
        };
        await Share.open(shareOptions);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const chartImages = await captureAllCharts();
      const filePath = await generatePDF(chartImages);
      if (filePath) {
        if (Platform.OS === 'android') {
          const fileName = `Kundli_${name || 'User'}_${Date.now()}.pdf`;
          const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          
          try {
            await RNFS.copyFile(filePath, downloadDest);
            await RNFS.scanFile(downloadDest); 
            
            showSuccessToast(`${t('saved_to_downloads')}: ${fileName}`);
          } catch (err) {
            console.error('Download Error:', err);
            showErrorToast(t('failed_to_save_pdf'));
          }
        } else {
          const fileName = `Kundli_${name || 'User'}_${Date.now()}.pdf`;
          const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
          try {
             await RNFS.copyFile(filePath, destPath);
             showSuccessToast(t('pdf_saved'));
             setTimeout(() => {
                  Share.open({ url: `file://${destPath}`, saveToFiles: true }).catch(() => {});
             }, 1000);
          } catch (e) {
              console.error(e);
              showErrorToast(t('failed_to_save_pdf'));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <CustomeLoader loading={isLoading} />
      {/* Header pinned, not inside ScrollView */}
      <UserCustomHeader
        title={t('kundli_report')}
        showBackButton={true}
      />
      
      {/* Hidden ViewShots for all charts */}
      <View style={{ position: 'absolute', left: -10000, top: 0 }}>
        <ViewShot ref={viewShotRefLagna} options={{ format: 'jpg', quality: 0.8, result: 'base64' }}>
             {data && data.D1 ? renderChart(data.D1) : null}
        </ViewShot>
        <ViewShot ref={viewShotRefNavamsa} options={{ format: 'jpg', quality: 0.8, result: 'base64' }}>
             {data && data.D9 ? renderChart(data.D9) : null}
        </ViewShot>
        <ViewShot ref={viewShotRefSun} options={{ format: 'jpg', quality: 0.8, result: 'base64' }}>
             {data && data.D1 ? renderChart(getDerivedChart(data.D1, 'Sun')) : null}
        </ViewShot>
        <ViewShot ref={viewShotRefMoon} options={{ format: 'jpg', quality: 0.8, result: 'base64' }}>
             {data && data.D1 ? renderChart(getDerivedChart(data.D1, 'Moon')) : null}
        </ViewShot>
        <ViewShot ref={viewShotRefDasamsa} options={{ format: 'jpg', quality: 0.8, result: 'base64' }}>
             {data && data.D10 ? renderChart(data.D10) : null}
        </ViewShot>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Card below pinned header, with radii */}
          <View style={[styles.headerCard, THEMESHADOW.shadow]}>
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
                {t('current_dasha')}: {currentDasha.dasha} - {currentDasha.bhukti} -{' '}
                {currentDasha.paryantardasha}
              </Text>
            )}

            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                   <Ionicons name="download-outline" size={20} color={COLORS.white} style={{marginRight: 8}}/>
                   <Text style={styles.actionButtonText}>{t('download')}</Text>
                </TouchableOpacity>

                 <TouchableOpacity style={[styles.actionButton, {backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary}]} onPress={handleShare}>
                   <Ionicons name="share-social-outline" size={20} color={COLORS.primary} style={{marginRight: 8}}/>
                   <Text style={[styles.actionButtonText, {color: COLORS.primary}]}>{t('share')}</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'Lagna', label: t('lagna_chart') },
                { key: 'Navamsa', label: t('navamsa_chart') },
                { key: 'Sun', label: t('sun_chart') },
                { key: 'Moon', label: t('moon_chart') },
                { key: 'Dasamsa', label: t('dasamsa_chart') },
                ...(hasDashas ? [{ key: 'Dasha', label: t('vimshottari_dasha') }] : []),
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    activeTab === tab.key && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.activeTabText,
                    ]}
                  >
                    {tab.label}
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
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  tableHeader: {
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 2,
    borderColor: '#D0D0D0',
    paddingVertical: 10,
    marginBottom: 4,
    borderRadius: 6,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  headerCell: {
    fontWeight: '700',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  planetText: {
    fontWeight: '600',
    textAlign: 'left',
    paddingLeft: 4,
  },
  planetCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planetIcon: {
    marginRight: 8,
  },
  planetName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  value: { flex: 1, textAlign: 'center', color: COLORS.textSecondary },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEMESHADOW.shadow,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default KundliScreen;
