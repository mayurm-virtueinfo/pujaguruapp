import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';
import CustomHeader from '../../../components/CustomHeader';
import { COLORS } from '../../../theme/theme';

export default function TermsPolicyScreen() {
  const route = useRoute<any>();
  const { htmlContent, title } = route.params || {};

  let htmlToShow = '';
  if (
    typeof htmlContent === 'string' &&
    htmlContent.trim().startsWith('<!DOCTYPE html')
  ) {
    htmlToShow = htmlContent;
  } else if (htmlContent?.data) {
    htmlToShow = htmlContent.data;
  } else if (typeof htmlContent === 'string') {
    htmlToShow = htmlContent;
  } else {
    htmlToShow =
      '<div style="padding:16px;font-size:24px;color:#222;">No content available.</div>';
  }

  return (
    <View style={[styles.container]}>
      <CustomHeader title={title || 'Policy'} showBackButton />
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlToShow }}
        style={styles.webview}
        startInLoadingState
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBackground },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
