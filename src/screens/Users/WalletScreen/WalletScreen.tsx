import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import UserCustomHeader from '../../../components/UserCustomHeader';
import CustomeLoader from '../../../components/CustomeLoader';
import { COLORS } from '../../../theme/theme';
import Fonts from '../../../theme/fonts';
import { getTransaction, getWallet } from '../../../api/apiService';
import type { TransactioData } from '../../../api/apiService';
import { useCommonToast } from '../../../common/CommonToast';
import { translateData } from '../../../utils/TranslateData';

type FilterTab = 'all' | 'credit' | 'debit';

interface WalletDetails {
  id?: number;
  user?: number;
  user_name?: string;
  balance?: string | number;
  created_at?: string;
  updated_at?: string;
}

const WalletScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showErrorToast } = useCommonToast();

  const [transactions, setTransactions] = useState<TransactioData[]>([]);
  const [walletData, setWalletData] = useState<WalletDetails>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [infoExpanded, setInfoExpanded] = useState<boolean>(false);

  const currentLanguage = i18n.language;
  const translationCacheRef = useRef<Map<string, TransactioData[]>>(new Map());

  const showErrorToastRef = useRef(showErrorToast);
  useEffect(() => {
    showErrorToastRef.current = showErrorToast;
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const cachedData = translationCacheRef.current.get(currentLanguage);
      if (cachedData) {
        setTransactions(cachedData);
        return;
      }

      const res: any = await getTransaction();
      if (res?.success && Array.isArray(res.data)) {
        const translated: any = await translateData(res.data, currentLanguage, [
          'puja_name',
        ]);
        const finalData = translated || res.data || [];
        translationCacheRef.current.set(currentLanguage, finalData);
        setTransactions(finalData);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || 'Failed to fetch transactions';
      showErrorToastRef.current(msg);
      setTransactions([]);
    }
  }, [currentLanguage]);

  const fetchWallet = useCallback(async () => {
    try {
      const res: any = await getWallet();
      if (res?.success && res.data) {
        setWalletData(res.data);
      } else {
        setWalletData({});
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to fetch wallet';
      showErrorToastRef.current(msg);
      setWalletData({});
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchTransactions()]);
    } finally {
      setLoading(false);
    }
  }, [fetchWallet, fetchTransactions]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    translationCacheRef.current.clear();
    await Promise.all([fetchWallet(), fetchTransactions()]);
    setRefreshing(false);
  }, [fetchWallet, fetchTransactions]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let creditCount = 0;
    let debitCount = 0;

    transactions.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      if (item.transaction_type === 'credit') {
        totalCredit += amt;
        creditCount++;
      } else {
        totalDebit += amt;
        debitCount++;
      }
    });

    return {
      totalCredit,
      totalDebit,
      creditCount,
      debitCount,
    };
  }, [transactions]);

  // Filtered & searched transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      if (activeTab === 'credit' && item.transaction_type !== 'credit') {
        return false;
      }
      if (activeTab === 'debit' && item.transaction_type !== 'debit') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (item.puja_name || '').toLowerCase();
        const note = (item.notes || '').toLowerCase();
        const reason = (item.reason || '').toLowerCase();
        const bookingId = String(item.booking || '').toLowerCase();
        return (
          name.includes(q) ||
          note.includes(q) ||
          reason.includes(q) ||
          bookingId.includes(q)
        );
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  // Helpers
  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '0.00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return { dateStr: '-', timeStr: '' };
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime()))
        return { dateStr: String(timestamp), timeStr: '' };
      const dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { dateStr, timeStr };
    } catch {
      return { dateStr: String(timestamp), timeStr: '' };
    }
  };

  const formatReason = (reason?: string) => {
    if (!reason) return '';
    return reason
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleToggleExpand = (id: number) => {
    setExpandedTxId(prev => (prev === id ? null : id));
  };

  const renderTransactionItem = (item: TransactioData) => {
    const isCredit = item.transaction_type === 'credit';
    const { dateStr, timeStr } = formatDateTime(item.timestamp);
    const isExpanded = expandedTxId === item.id;
    const readableReason = formatReason(item.reason);

    return (
      <TouchableOpacity
        key={`tx-${item.id}`}
        style={styles.txCard}
        activeOpacity={0.85}
        onPress={() => handleToggleExpand(item.id)}
      >
        <View style={styles.txCardMainRow}>
          {/* Status Icon */}
          <View
            style={[
              styles.txIconCircle,
              isCredit ? styles.txIconCreditBg : styles.txIconDebitBg,
            ]}
          >
            <Ionicons
              name={isCredit ? 'arrow-down' : 'arrow-up'}
              size={moderateScale(18)}
              color={isCredit ? '#059669' : '#DC2626'}
            />
          </View>

          {/* Details Column */}
          <View style={styles.txDetailsCol}>
            <Text style={styles.txPujaName} numberOfLines={1}>
              {item.puja_name || t('puja_booking') || 'Puja Ceremony'}
            </Text>

            {readableReason ? (
              <View style={styles.txMetaRow}>
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonBadgeText} numberOfLines={1}>
                    {readableReason}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.txTimeRow}>
              <Ionicons
                name="calendar-outline"
                size={moderateScale(12)}
                color="#64748B"
                style={styles.timeIconMargin}
              />
              <Text style={styles.txTimeText}>
                {dateStr}
                {timeStr ? ` • ${timeStr}` : ''}
              </Text>
            </View>
          </View>

          {/* Amount & Status Badge */}
          <View style={styles.txAmountCol}>
            <Text
              style={[
                styles.txAmountText,
                isCredit ? styles.creditAmountColor : styles.debitAmountColor,
              ]}
              numberOfLines={1}
            >
              {isCredit ? '+' : '-'} ₹{formatCurrency(item.amount)}
            </Text>

            <View
              style={[
                styles.txStatusPill,
                isCredit ? styles.txStatusPillCredit : styles.txStatusPillDebit,
              ]}
            >
              <Text
                style={[
                  styles.txStatusPillText,
                  isCredit
                    ? styles.txStatusPillCreditText
                    : styles.txStatusPillDebitText,
                ]}
              >
                {isCredit ? t('credits') || 'Credit' : t('debits') || 'Debit'}
              </Text>
            </View>
          </View>
        </View>

        {/* Expandable Note Section */}
        {item.notes ? (
          <View style={styles.txNoteTriggerRow}>
            <View style={styles.noteIndicatorRow}>
              <Ionicons
                name="information-circle-outline"
                size={moderateScale(13)}
                color="#64748B"
                style={styles.timeIconMargin}
              />
              <Text style={styles.noteIndicatorText}>
                {isExpanded
                  ? t('hide_details') || 'Hide Details'
                  : t('view_details') || 'View Details'}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={moderateScale(14)}
              color="#64748B"
            />
          </View>
        ) : null}

        {isExpanded && item.notes ? (
          <View style={styles.expandedNoteBox}>
            <Text style={styles.expandedNoteTitle}>
              {t('notes') || 'Transaction Details'}:
            </Text>
            <Text style={styles.expandedNoteText}>{item.notes}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <UserCustomHeader
        title={t('wallet') || 'Wallet'}
        showBackButton
        onBackPress={() => navigation?.goBack && navigation.goBack()}
      />
      <CustomeLoader loading={loading} />

      <View style={styles.sheetContainer}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* 1. Modern Digital Wallet Card */}
          <LinearGradient
            colors={['#DC2626', '#B91C1C', '#881337']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCardGradient}
          >
            {/* Ambient Graphic Circles */}
            <View pointerEvents="none" style={styles.cardCircleOne} />
            <View pointerEvents="none" style={styles.cardCircleTwo} />

            {/* Top Row: User Name & Wallet Identity */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIdentityGroup}>
                <View style={styles.walletIconCircle}>
                  <Ionicons
                    name="wallet"
                    size={moderateScale(16)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.cardNameWrapper}>
                  <Text style={styles.cardMemberName} numberOfLines={1}>
                    {walletData.user_name || 'PujaGuru Member'}
                  </Text>
                  <Text style={styles.cardSubText}>
                    {t('wallet') || 'Spiritual Wallet'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Middle: Available Balance Display */}
            <View style={styles.cardBalanceSection}>
              <Text style={styles.cardBalanceLabel}>
                {t('wallet_balance') || 'Available Balance'}
              </Text>
              <View style={styles.cardBalanceValueRow}>
                <Ionicons
                  name="cash"
                  size={moderateScale(28)}
                  color="#FCD34D"
                  style={styles.cardBalanceIcon}
                />
                <Text style={styles.cardBalanceAmount}>
                  {formatCurrency(walletData.balance)}
                </Text>
              </View>
            </View>

            {/* Bottom Row: Rule Pill & Guarantee */}
            <View style={styles.cardFooterRow}>
              <View style={styles.cardRulePill}>
                <Ionicons
                  name="sparkles"
                  size={moderateScale(12)}
                  color="#FCD34D"
                  style={styles.timeIconMargin}
                />
                <Text style={styles.cardRulePillText}>
                  {t('wallet_points_rule') || '1 Point = ₹1 Rupee'}
                </Text>
              </View>
              <Text style={styles.cardSecureText}>
                {t('secure_instant') || '100% Usable'}
              </Text>
            </View>
          </LinearGradient>

          {/* 2. Quick Metrics Row (Credited vs Debited) */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricCreditCard]}>
              <View style={styles.metricIconWrapCredit}>
                <Ionicons
                  name="arrow-down-circle"
                  size={moderateScale(20)}
                  color="#059669"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>
                  {t('total_credited') || 'Total Credited'}
                </Text>
                <Text style={[styles.metricValue, styles.creditAmountColor]}>
                  + ₹{formatCurrency(stats.totalCredit)}
                </Text>
              </View>
            </View>

            <View style={[styles.metricCard, styles.metricDebitCard]}>
              <View style={styles.metricIconWrapDebit}>
                <Ionicons
                  name="arrow-up-circle"
                  size={moderateScale(20)}
                  color="#DC2626"
                />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>
                  {t('total_debited') || 'Total Debited'}
                </Text>
                <Text style={[styles.metricValue, styles.debitAmountColor]}>
                  - ₹{formatCurrency(stats.totalDebit)}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Search Bar */}
          {transactions.length > 2 && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={moderateScale(18)}
                color="#94A3B8"
                style={styles.searchIconMargin}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  t('search_transactions') || 'Search transactions...'
                }
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={moderateScale(18)}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 4. Filter Tabs Row */}
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              style={[
                styles.filterTabBtn,
                activeTab === 'all' && styles.filterTabBtnActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setActiveTab('all')}
            >
              <Text
                style={[
                  styles.filterTabBtnText,
                  activeTab === 'all' && styles.filterTabBtnTextActive,
                ]}
              >
                {t('all') || 'All'} ({transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTabBtn,
                activeTab === 'credit' && styles.filterTabBtnActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setActiveTab('credit')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={moderateScale(14)}
                color={activeTab === 'credit' ? '#FFFFFF' : '#059669'}
                style={styles.tabIconMargin}
              />
              <Text
                style={[
                  styles.filterTabBtnText,
                  activeTab === 'credit' && styles.filterTabBtnTextActive,
                ]}
              >
                {t('credits') || 'Credits'} ({stats.creditCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTabBtn,
                activeTab === 'debit' && styles.filterTabBtnActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setActiveTab('debit')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={moderateScale(14)}
                color={activeTab === 'debit' ? '#FFFFFF' : '#DC2626'}
                style={styles.tabIconMargin}
              />
              <Text
                style={[
                  styles.filterTabBtnText,
                  activeTab === 'debit' && styles.filterTabBtnTextActive,
                ]}
              >
                {t('debits') || 'Debits'} ({stats.debitCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Transactions Section */}
          <View style={styles.transactionsHeaderRow}>
            <View style={styles.txHeaderTitleGroup}>
              <Ionicons
                name="time-outline"
                size={moderateScale(18)}
                color={COLORS.primary}
                style={styles.timeIconMargin}
              />
              <Text style={styles.sectionTitle}>
                {t('transaction_history') || 'Transaction History'}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {filteredTransactions.length}
              </Text>
            </View>
          </View>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconCircle}>
                <Ionicons
                  name="receipt-outline"
                  size={moderateScale(38)}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyStateTitle}>
                {searchQuery || activeTab !== 'all'
                  ? t('no_matching_transactions') || 'No Matching Transactions'
                  : t('no_transactions_found') || 'No Transactions Found'}
              </Text>
              <Text style={styles.emptyStateSub}>
                {searchQuery || activeTab !== 'all'
                  ? t('try_changing_filter') ||
                    'Try adjusting your search query or filter tab.'
                  : t('wallet_empty_desc') ||
                    'Refunds and wallet credits from your pujas will be recorded here.'}
              </Text>
              {(searchQuery.length > 0 || activeTab !== 'all') && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>
                    {t('reset_filters') || 'Reset Filters'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.txListContainer}>
              {filteredTransactions.map(renderTransactionItem)}
            </View>
          )}

          {/* 6. Wallet Rules & Policy Accordion Card */}
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoHeaderRow}
              activeOpacity={0.8}
              onPress={() => setInfoExpanded(prev => !prev)}
            >
              <View style={styles.infoTitleGroup}>
                <Ionicons
                  name="shield-checkmark"
                  size={moderateScale(18)}
                  color="#D97706"
                  style={styles.timeIconMargin}
                />
                <Text style={styles.infoCardTitle}>
                  {t('how_wallet_works') || 'How Wallet Balance Works'}
                </Text>
              </View>
              <Ionicons
                name={infoExpanded ? 'chevron-up' : 'chevron-down'}
                size={moderateScale(18)}
                color="#64748B"
              />
            </TouchableOpacity>

            {infoExpanded ? (
              <View style={styles.infoContent}>
                <View style={styles.infoRuleRow}>
                  <View style={styles.ruleBullet}>
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(12)}
                      color="#059669"
                    />
                  </View>
                  <View style={styles.ruleTextContainer}>
                    <Text style={styles.ruleTitle}>
                      {t('wallet_rule_1_title') ||
                        '100% Usable on Next Booking'}
                    </Text>
                    <Text style={styles.ruleDesc}>
                      {t('wallet_rule_1_desc') ||
                        'Your points are automatically deducted from the total during checkout.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRuleRow}>
                  <View style={styles.ruleBullet}>
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(12)}
                      color="#059669"
                    />
                  </View>
                  <View style={styles.ruleTextContainer}>
                    <Text style={styles.ruleTitle}>
                      {t('wallet_rule_2_title') ||
                        'Instant Cancellation Refunds'}
                    </Text>
                    <Text style={styles.ruleDesc}>
                      {t('wallet_rule_2_desc') ||
                        'Puja cancellations within policy limits are credited directly to your wallet.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRuleRow}>
                  <View style={styles.ruleBullet}>
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(12)}
                      color="#059669"
                    />
                  </View>
                  <View style={styles.ruleTextContainer}>
                    <Text style={styles.ruleTitle}>
                      {t('wallet_rule_3_title') || 'No Hidden Deductions'}
                    </Text>
                    <Text style={styles.ruleDesc}>
                      {t('wallet_rule_3_desc') ||
                        'Wallet points never expire and have 1:1 Rupee value for ceremonies.'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.infoCardCollapsedHint}>
                {t('condition') ||
                  '1 Point = ₹1 Rupee. Use points freely to schedule ceremonies with Vedic pandits.'}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(28),
  },

  // 1. Digital Wallet Card
  walletCardGradient: {
    borderRadius: moderateScale(22),
    padding: moderateScale(18),
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: moderateScale(16),
  },
  cardCircleOne: {
    position: 'absolute',
    width: moderateScale(160),
    height: moderateScale(160),
    borderRadius: moderateScale(80),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -moderateScale(40),
    right: -moderateScale(30),
  },
  cardCircleTwo: {
    position: 'absolute',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -moderateScale(20),
    left: -moderateScale(20),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  cardIdentityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardNameWrapper: {
    flex: 1,
  },
  walletIconCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10),
  },
  cardMemberName: {
    fontSize: moderateScale(15),
    fontFamily: Fonts.Sen_Bold,
    color: '#FFFFFF',
  },
  cardSubText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardBalanceSection: {
    marginBottom: moderateScale(18),
  },
  cardBalanceLabel: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Medium,
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: moderateScale(4),
  },
  cardBalanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBalanceIcon: {
    marginRight: moderateScale(8),
  },
  cardBalanceAmount: {
    fontSize: moderateScale(28),
    fontFamily: Fonts.Sen_Bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  cardRulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  cardRulePillText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#FEF3C7',
  },
  cardSecureText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: 'rgba(255, 255, 255, 0.75)',
  },

  // 2. Metrics Row
  metricsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  metricCreditCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  metricDebitCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  metricIconWrapCredit: {
    marginRight: moderateScale(10),
  },
  metricIconWrapDebit: {
    marginRight: moderateScale(10),
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
    marginBottom: moderateScale(2),
  },
  metricValue: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
  },
  creditAmountColor: {
    color: '#059669',
  },
  debitAmountColor: {
    color: '#DC2626',
  },

  // 3. Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(12),
  },
  searchIconMargin: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: moderateScale(4),
  },

  // 4. Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: moderateScale(16),
  },
  filterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabBtnText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },
  filterTabBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.Sen_Bold,
  },
  tabIconMargin: {
    marginRight: moderateScale(4),
  },

  // 5. Transactions Header
  transactionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  txHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  countBadgeText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: '#334155',
  },

  // Transaction Items
  txListContainer: {
    gap: moderateScale(10),
    marginBottom: moderateScale(18),
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  txCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  txIconCreditBg: {
    backgroundColor: '#ECFDF5',
  },
  txIconDebitBg: {
    backgroundColor: '#FEF2F2',
  },
  txDetailsCol: {
    flex: 1,
    marginRight: moderateScale(8),
  },
  txPujaName: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(3),
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  reasonBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonBadgeText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#475569',
  },
  txTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txTimeText: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: moderateScale(14.5),
    fontFamily: Fonts.Sen_Bold,
    marginBottom: moderateScale(4),
  },
  txStatusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
  },
  txStatusPillText: {
    fontSize: moderateScale(10.5),
    fontFamily: Fonts.Sen_Bold,
  },
  txStatusPillCredit: {
    backgroundColor: '#ECFDF5',
  },
  txStatusPillDebit: {
    backgroundColor: '#FEF2F2',
  },
  txStatusPillCreditText: {
    color: '#059669',
  },
  txStatusPillDebitText: {
    color: '#DC2626',
  },

  // Notes expand trigger
  txNoteTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: moderateScale(10),
    marginTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  noteIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIndicatorText: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Medium,
    color: '#64748B',
  },
  expandedNoteBox: {
    backgroundColor: '#F8FAFC',
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  expandedNoteTitle: {
    fontSize: moderateScale(11),
    fontFamily: Fonts.Sen_Bold,
    color: '#334155',
    marginBottom: moderateScale(2),
  },
  expandedNoteText: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Regular,
    color: '#475569',
    lineHeight: moderateScale(17),
  },

  // Empty State
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(18),
  },
  emptyStateIconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  emptyStateTitle: {
    fontSize: moderateScale(15.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#0F172A',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(14),
  },
  resetFilterBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  resetFilterBtnText: {
    fontSize: moderateScale(12.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#2563EB',
  },

  // 6. Policy / Info Accordion Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoCardTitle: {
    fontSize: moderateScale(13.5),
    fontFamily: Fonts.Sen_Bold,
    color: '#92400E',
  },
  infoCardCollapsedHint: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#78350F',
    marginTop: moderateScale(8),
    lineHeight: moderateScale(16),
  },
  infoContent: {
    marginTop: moderateScale(12),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
    gap: moderateScale(10),
  },
  infoRuleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleBullet: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(8),
    marginTop: moderateScale(2),
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: moderateScale(12),
    fontFamily: Fonts.Sen_Bold,
    color: '#1E293B',
    marginBottom: moderateScale(2),
  },
  ruleDesc: {
    fontSize: moderateScale(11.5),
    fontFamily: Fonts.Sen_Regular,
    color: '#475569',
    lineHeight: moderateScale(16),
  },

  // Global margins
  timeIconMargin: {
    marginRight: moderateScale(5),
  },
});

export default WalletScreen;
