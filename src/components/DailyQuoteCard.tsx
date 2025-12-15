import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, THEMESHADOW } from '../theme/theme';
import Fonts from '../theme/fonts';
import { moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';
import { useCommonToast } from '../common/CommonToast';

const QUOTES = [
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "The soul is healed by being with children.", author: "Fyodor Dostoevsky" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "You are the sky. Everything else – it’s just the weather.", author: "Pema Chödrön" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "What you think, you become. What you feel, you attract. What you imagine, you create.", author: "Buddha" },
];

const DailyQuoteCard: React.FC = () => {
  const { t } = useTranslation();
  const [quote, setQuote] = useState({ text: '', author: '' });
  const { showErrorToast, showSuccessToast } = useCommonToast();

  useEffect(() => {
    // Select a quote based on the day of the year to keep it consistent for the day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % QUOTES.length;
    setQuote(QUOTES[quoteIndex]);
  }, []);

  const handleCopy = () => {
    const content = `"${quote.text}" - ${quote.author}`;
    Clipboard.setString(content);
    showSuccessToast(t('quote_copied') || 'Quote copied to clipboard');
  };
  
  const handleShare = async () => {
      try {
        const content = `"${quote.text}" - ${quote.author}`;
        await Share.share({
          message: content,
        });
      } catch (error) {
        console.log('Error sharing quote:', error);
      }
    };

  return (
    <View style={[styles.card, THEMESHADOW.shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('daily_good_thoughts') || 'Daily Good Thoughts'}</Text>
        <View style={styles.actions}>
             <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
              <Ionicons name="copy-outline" size={20} color={COLORS.primaryTextDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.primaryTextDark} />
            </TouchableOpacity>
        </View>
       
      </View>
      <View style={styles.content}>
        <Entypo name="quote" size={24} color={COLORS.primary} style={styles.quoteIcon} />
        <Text style={styles.quoteText}>{quote.text}</Text>
        <Text style={styles.authorText}>- {quote.author}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(24),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: Fonts.Sen_SemiBold,
    color: COLORS.primaryTextDark,
  },
  actions: {
      flexDirection: 'row',
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
  },
  quoteIcon: {
    marginBottom: moderateScale(8),
    opacity: 0.3,
  },
  quoteText: {
    fontSize: moderateScale(16),
    fontFamily: Fonts.Sen_Regular,
    color: COLORS.primaryTextDark,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(24),
  },
  authorText: {
    fontSize: moderateScale(14),
    fontFamily: Fonts.Sen_Bold,
    color: COLORS.primaryTextDark,
    textAlign: 'right',
    width: '100%',
    marginTop: moderateScale(4),
  },
});

export default DailyQuoteCard;
