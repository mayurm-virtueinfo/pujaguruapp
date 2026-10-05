import React, { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { useCommonToast } from '../../../common/CommonToast';
import CustomeLoader from '../../../components/CustomeLoader';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { UserProfileParamList } from '../../../navigation/User/userProfileNavigator';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { KundliDashaTimeline } from './components/KundliDashaTimeline';
import { KundliDiamondChart } from './components/KundliDiamondChart';
import { KundliHeroCard } from './components/KundliHeroCard';
import { KundliInsights } from './components/KundliInsights';
import { KundliPlanetaryTable } from './components/KundliPlanetaryTable';
import { KundliTabKey, KundliTabs } from './components/KundliTabs';
import {
  formatBirthDate,
  formatBirthPlace,
  formatBirthTime,
  getDerivedChart,
} from './utils/kundliAstroUtils';
import { generateKundliPdf } from './utils/kundliPdfTemplate';

const KundliScreen: React.FC = () => {
  const inset = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showSuccessToast, showErrorToast } = useCommonToast();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<KundliTabKey>('Lagna');

  // Chart capture references for PDF export
  const viewShotRefLagna = useRef<any>(null);
  const viewShotRefNavamsa = useRef<any>(null);
  const viewShotRefSun = useRef<any>(null);
  const viewShotRefMoon = useRef<any>(null);
  const viewShotRefDasamsa = useRef<any>(null);

  const route = useRoute<RouteProp<UserProfileParamList, 'KundliScreen'>>();
  const {
    kundliData: apiData,
    name,
    birthDate,
    birthTime,
    birthPlace,
    latitude,
    longitude,
  } = (route.params as any) || {};

  // Support both full kundli object and raw result_json
  const data = apiData?.kundli?.result_json || apiData?.result_json || apiData;
  const interpretation =
    apiData?.kundli?.interpretation || apiData?.interpretation;

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {t('no_kundli_found') || 'No data available'}
        </Text>
      </View>
    );
  }

  const user = data.user_details || {};
  const currentDasha = data.D1?.Dashas?.current || data.Dashas?.current;
  const hasDashas = Boolean(
    data.Dashas?.Vimshottari?.mahadashas ||
      data.D1?.Dashas?.Vimshottari?.mahadashas,
  );
  const hasInterpretation =
    Boolean(interpretation?.summary_bullets?.length) ||
    Boolean(interpretation?.overview?.yogas?.length);

  const formattedDate = formatBirthDate(birthDate, user.birthdetails);
  const formattedTime = formatBirthTime(birthTime, user.birthdetails);
  const place = formatBirthPlace(birthPlace, user.birthdetails);

  const captureAllCharts = async () => {
    const charts: Record<string, string> = {};
    try {
      if (viewShotRefLagna.current?.capture) {
        charts.lagna = await viewShotRefLagna.current.capture();
      }
      if (viewShotRefNavamsa.current?.capture) {
        charts.navamsa = await viewShotRefNavamsa.current.capture();
      }
      if (viewShotRefSun.current?.capture) {
        charts.sun = await viewShotRefSun.current.capture();
      }
      if (viewShotRefMoon.current?.capture) {
        charts.moon = await viewShotRefMoon.current.capture();
      }
      if (viewShotRefDasamsa.current?.capture) {
        charts.dasamsa = await viewShotRefDasamsa.current.capture();
      }
    } catch (e) {
      console.log('Error capturing charts', e);
    }
    return charts;
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const charts = await captureAllCharts();
      const filePath = await generateKundliPdf({
        data,
        interpretation,
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude,
        longitude,
        chartImages: charts,
        t,
      });

      if (filePath) {
        const shareOptions = {
          title: t('share_kundli') || 'Share Kundli',
          message: `${t('kundli_for')} ${name || user.name || 'User'}`,
          url: `file://${filePath}`,
          type: 'application/pdf',
        };
        await Share.open(shareOptions);
      } else {
        showErrorToast(t('failed_to_generate_pdf') || 'Failed to generate PDF');
      }
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.error('Share Error:', error);
        showErrorToast(t('failed_to_share_pdf') || 'Failed to share PDF');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const charts = await captureAllCharts();
      const filePath = await generateKundliPdf({
        data,
        interpretation,
        name,
        birthDate,
        birthTime,
        birthPlace,
        latitude,
        longitude,
        chartImages: charts,
        t,
      });

      if (filePath) {
        const fileName = `Kundli_${name || 'User'}_${Date.now()}.pdf`;
        if (Platform.OS === 'android') {
          const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          try {
            await RNFS.copyFile(filePath, downloadDest);
            await RNFS.scanFile(downloadDest);
            showSuccessToast(`${t('saved_to_downloads')}: ${fileName}`);
          } catch (err) {
            console.error('Download Error:', err);
            showErrorToast(
              t('failed_to_save_download') || 'Failed to save to Downloads',
            );
          }
        } else {
          const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
          try {
            await RNFS.copyFile(filePath, destPath);
            showSuccessToast(t('pdf_saved') || 'PDF saved');
            setTimeout(() => {
              Share.open({
                url: `file://${destPath}`,
                saveToFiles: true,
              }).catch(() => {});
            }, 1000);
          } catch (e) {
            console.error(e);
            showErrorToast(t('failed_to_save_pdf') || 'Failed to save PDF');
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerDynamic = { paddingTop: inset.top };

  return (
    <View style={[styles.container, containerDynamic]}>
      <CustomeLoader loading={isLoading} />
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
        title={t('kundli_report') || 'Kundli Report'}
        showBackButton={true}
      />

      {/* Hidden ViewShots for off-screen PDF capture */}
      <View style={styles.hiddenViewShots}>
        <ViewShot
          ref={viewShotRefLagna}
          options={{ format: 'jpg', quality: 0.8, result: 'base64' }}
        >
          {data?.D1 ? <KundliDiamondChart chartData={data.D1} /> : null}
        </ViewShot>
        <ViewShot
          ref={viewShotRefNavamsa}
          options={{ format: 'jpg', quality: 0.8, result: 'base64' }}
        >
          {data?.D9 ? <KundliDiamondChart chartData={data.D9} /> : null}
        </ViewShot>
        <ViewShot
          ref={viewShotRefSun}
          options={{ format: 'jpg', quality: 0.8, result: 'base64' }}
        >
          {data?.D1 ? (
            <KundliDiamondChart chartData={getDerivedChart(data.D1, 'Sun')} />
          ) : null}
        </ViewShot>
        <ViewShot
          ref={viewShotRefMoon}
          options={{ format: 'jpg', quality: 0.8, result: 'base64' }}
        >
          {data?.D1 ? (
            <KundliDiamondChart chartData={getDerivedChart(data.D1, 'Moon')} />
          ) : null}
        </ViewShot>
        <ViewShot
          ref={viewShotRefDasamsa}
          options={{ format: 'jpg', quality: 0.8, result: 'base64' }}
        >
          {data?.D10 ? <KundliDiamondChart chartData={data.D10} /> : null}
        </ViewShot>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Celestial Profile Hero Card */}
          <KundliHeroCard
            name={name}
            user={user}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            place={place}
            currentDasha={currentDasha}
            onDownload={handleDownload}
            onShare={handleShare}
          />

          {/* Chart Selection Tabs */}
          <KundliTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            hasDashas={hasDashas}
            hasInterpretation={hasInterpretation}
          />

          {/* Tab Contents */}
          {activeTab === 'Lagna' && (
            <>
              <KundliDiamondChart
                chartData={data.D1}
                chartTitle={
                  t('lagna_birth_chart') ||
                  t('lagna_chart') ||
                  'Lagna Birth Chart'
                }
              />
              <KundliPlanetaryTable chartData={data.D1} />
            </>
          )}

          {activeTab === 'Navamsa' && (
            <>
              <KundliDiamondChart
                chartData={data.D9}
                chartTitle={
                  t('navamsa_destiny_chart') ||
                  t('navamsa_chart') ||
                  'Navamsa Destiny Chart'
                }
              />
              <KundliPlanetaryTable chartData={data.D9} />
            </>
          )}

          {activeTab === 'Sun' && (
            <>
              <KundliDiamondChart
                chartData={getDerivedChart(data.D1, 'Sun')}
                chartTitle={
                  t('surya_kundli') || t('sun_chart') || 'Surya Kundli'
                }
              />
              <KundliPlanetaryTable
                chartData={getDerivedChart(data.D1, 'Sun')}
              />
            </>
          )}

          {activeTab === 'Moon' && (
            <>
              <KundliDiamondChart
                chartData={getDerivedChart(data.D1, 'Moon')}
                chartTitle={
                  t('chandra_kundli') || t('moon_chart') || 'Chandra Kundli'
                }
              />
              <KundliPlanetaryTable
                chartData={getDerivedChart(data.D1, 'Moon')}
              />
            </>
          )}

          {activeTab === 'Dasamsa' && (
            <>
              <KundliDiamondChart
                chartData={data.D10}
                chartTitle={
                  t('dasamsa_career_chart') ||
                  t('dasamsa_chart') ||
                  'Dasamsa Career Chart'
                }
              />
              <KundliPlanetaryTable chartData={data.D10} />
            </>
          )}

          {activeTab === 'Dasha' && (
            <KundliDashaTimeline
              mahadashas={
                data.Dashas?.Vimshottari?.mahadashas ||
                data.D1?.Dashas?.Vimshottari?.mahadashas
              }
            />
          )}

          {activeTab === 'Insights' && (
            <KundliInsights interpretation={interpretation} />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default KundliScreen;

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
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
    marginTop: verticalScale(6),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(36),
  },
  hiddenViewShots: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
});
