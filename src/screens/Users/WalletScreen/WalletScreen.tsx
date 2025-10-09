import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import UserCustomHeader from '../../../components/UserCustomHeader';
import {COLORS, THEMESHADOW} from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import {Images} from '../../../theme/Images';
import {useTranslation} from 'react-i18next';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {useNavigation} from '@react-navigation/native';
import {getTransaction, getWallet} from '../../../api/apiService';
import type {TransactioData} from '../../../api/apiService';
import {useCommonToast} from '../../../common/CommonToast';
import {translateData} from '../../../utils/TranslateData';
import CustomeLoader from '../../../components/CustomeLoader';

const WalletScreen: React.FC = () => {
  const {t, i18n} = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {showErrorToast} = useCommonToast();

  const [transactions, setTransactions] = useState<TransactioData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<any>({});

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, any>>(new Map());

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const cachedData = translationCacheRef.current.get(currentLanguage);

      if (cachedData) {
        setTransactions(cachedData);
        setLoading(false);
        return;
      }

      const data: any = await getTransaction();
      if (data.success) {
        const translated: any = await translateData(
          data.data,
          currentLanguage,
          ['puja_name'],
        );
        translationCacheRef.current.set(currentLanguage, translated);
        setTransactions(translated || []);
      }
    } catch (error: any) {
      console.log('error of transaction :: ', error.response.data);
      showErrorToast(error.response.data.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await getWallet();
      if (data.success) {
        setWalletData(data.data);
      }
    } catch (error: any) {
      showErrorToast(error.response.data.message);
      console.log('error of wallet :: ', error.response.data);
      setWalletData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchTransactions, fetchWallet]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  const handleTopUpWallet = () => {
    navigation.navigate('WalletTopUpScreen' as never);
  };

  const formatTimestamp = (timestamp: any) => {
    const date = new Date(timestamp);

    const options: any = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const formattedDateString = date.toLocaleDateString('en-GB', options);

    return formattedDateString;
  };

  const renderTransactionItem = (item: TransactioData, index: number) => (
    <View key={item.id}>
      <View style={styles.transactionItem}>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.puja_name}</Text>
          <Text style={styles.transactionDate}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            item.transaction_type === 'credit'
              ? styles.creditAmount
              : styles.debitAmount,
          ]}>
          {item.amount}
        </Text>
      </View>
      {index < transactions.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.primaryBackground,
        paddingTop: insets.top,
      }}>
      <StatusBar
        translucent
        backgroundColor={COLORS.primaryBackground}
        barStyle="light-content"
      />
      <UserCustomHeader title={t('wallet')} showBackButton={true} />
      <CustomeLoader loading={loading} />

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom:
              Platform.OS !== 'ios' ? insets.bottom + verticalScale(32) : 0,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {/* Wallet Balance Section */}
          <View style={styles.walletBalanceContainer}>
            <View style={[styles.balanceCard, THEMESHADOW.shadow]}>
              <View style={styles.balanceContent}>
                <Text style={styles.walletBalanceLabel}>
                  {t('wallet_balance')}
                </Text>
                <View style={styles.balanceRow}>
                  <Image source={Images.ic_coin} style={styles.coinIcon} />
                  <Text style={styles.balanceAmount}>{walletData.balance}</Text>
                </View>
              </View>
              <Text style={styles.balanceDescription}>{t('condition')}</Text>
            </View>
          </View>

          {/* Transaction History Section */}
          <View style={styles.transactionContainer}>
            <View style={[styles.transactionCard, THEMESHADOW.shadow]}>
              <Text style={styles.transactionHistoryTitle}>
                {t('transaction_history')}
              </Text>
              <View style={styles.transactionList}>
                {transactions.length === 0 ? (
                  <Text
                    style={{
                      textAlign: 'center',
                      color: COLORS.pujaCardSubtext,
                      fontFamily: Fonts.Sen_Medium,
                      fontSize: moderateScale(14),
                      marginVertical: 16,
                    }}>
                    {t('no_transactions_found')}
                  </Text>
                ) : (
                  transactions.map((item, index) =>
                    renderTransactionItem(item, index),
                  )
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.pujaBackground,
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(24),
  },
  walletBalanceContainer: {
    marginBottom: verticalScale(14),
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    padding: scale(14),
  },
  balanceContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletBalanceLabel: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(6),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: scale(6),
  },
  balanceAmount: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  balanceDescription: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  topUpButton: {
    marginBottom: verticalScale(24),
  },
  topUpButtonText: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    textTransform: 'uppercase',
  },
  transactionContainer: {
    marginBottom: verticalScale(20),
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(10),
    padding: scale(14),
  },
  transactionHistoryTitle: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(20),
  },
  transactionList: {
    width: '100%',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(8),
  },
  transactionDetails: {
    flex: 1,
    marginRight: scale(16),
  },
  transactionTitle: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.primaryTextDark,
    marginBottom: verticalScale(4),
  },
  transactionDate: {
    fontSize: moderateScale(13),
    fontFamily: Fonts.Sen_Medium,
    color: COLORS.pujaCardSubtext,
  },
  transactionAmount: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_SemiBold,
  },
  creditAmount: {
    color: '#00A40E',
  },
  debitAmount: {
    color: COLORS.gradientEnd,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.separatorColor,
    marginVertical: verticalScale(8),
  },
});

export default WalletScreen;
