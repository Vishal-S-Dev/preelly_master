import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { paymentService } from '../../../services/payment.service';
import {
  buildCcavenueCheckoutHtml,
  isCcavenueGatewayUrl,
  isPaymentCompletionUrl,
  resolveCcavenueHtmlBaseUrl,
} from '../../../utils/paymentUtils';
import { PaymentLoader } from '../../components/payment/PaymentLoader';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { PAYMENT_COLORS, paymentStyles } from './paymentStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentWebView'>;

const urlMatches = (url: string, candidates: Array<string | undefined>) => {
  const lower = url.toLowerCase();
  return candidates.some(candidate => {
    if (!candidate) {
      return false;
    }
    const c = candidate.toLowerCase();
    return lower.startsWith(c) || lower.includes(c);
  });
};

const isIgnorableNavUrl = (url?: string | null) => {
  if (!url) {
    return true;
  }
  const lower = url.toLowerCase();
  return (
    lower.startsWith('about:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower === 'about:blank'
  );
};

export const PaymentWebViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useStableSafeAreaInsets();
  const { session, closeCreatePost, paymentFlow, productId } = route.params;
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const handledRef = useRef(false);
  const gatewayEnteredRef = useRef(false);
  const fatalErrorRef = useRef(false);
  const webRef = useRef<WebView>(null);

  const html = useMemo(() => buildCcavenueCheckoutHtml(session), [session]);
  const htmlBaseUrl = useMemo(
    () => resolveCcavenueHtmlBaseUrl(session.paymentUrl),
    [session.paymentUrl],
  );

  const finishWithTransaction = useCallback(async () => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;
    setVerifying(true);
    try {
      const tx = await paymentService.waitForTransactionStatus(session.orderId);
      const common = {
        orderId: tx.orderId || session.orderId,
        transactionId: tx.transactionId,
        amount: tx.amount || session.amount,
        currency: tx.currency,
        status: tx.status,
        message: tx.failureReason,
        closeCreatePost,
        paymentFlow,
        productId,
      };

      if (tx.status === 'SUCCESS') {
        navigation.replace('PaymentSuccess', common);
      } else if (tx.status === 'CANCELLED') {
        navigation.replace('PaymentCancelled', common);
      } else if (tx.status === 'PENDING' || tx.status === 'UNKNOWN') {
        navigation.replace('PaymentPending', common);
      } else {
        navigation.replace('PaymentFailed', common);
      }
    } catch {
      navigation.replace('PaymentPending', {
        orderId: session.orderId,
        amount: session.amount,
        closeCreatePost,
        paymentFlow,
        productId,
        message: 'We are confirming your payment. Please check again shortly.',
      });
    } finally {
      setVerifying(false);
    }
  }, [closeCreatePost, navigation, paymentFlow, productId, session.amount, session.orderId]);

  const handleNavigationUrl = useCallback(
    (url?: string | null) => {
      if (!url || handledRef.current || isIgnorableNavUrl(url)) {
        return;
      }

      if (isCcavenueGatewayUrl(url)) {
        gatewayEnteredRef.current = true;
        fatalErrorRef.current = false;
        setWebError(null);
        return;
      }

      if (!gatewayEnteredRef.current) {
        return;
      }

      const matchedExplicit = urlMatches(url, [
        session.redirectUrl,
        session.cancelUrl,
        session.callbackUrl,
      ]);

      if (matchedExplicit || isPaymentCompletionUrl(url)) {
        void finishWithTransaction();
      }
    },
    [
      finishWithTransaction,
      session.callbackUrl,
      session.cancelUrl,
      session.redirectUrl,
    ],
  );

  const onNavChange = useCallback(
    (navState: WebViewNavigation) => {
      handleNavigationUrl(navState.url);
    },
    [handleNavigationUrl],
  );

  const onCancel = useCallback(() => {
    if (handledRef.current || verifying) {
      return;
    }
    Alert.alert(
      'Cancel payment?',
      'Your payment may still be processing. You can check Transactions later.',
      [
        { text: 'Continue payment', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            handledRef.current = true;
            navigation.replace('PaymentCancelled', {
              orderId: session.orderId,
              amount: session.amount,
              closeCreatePost,
              paymentFlow,
              productId,
              message: 'You cancelled the payment.',
            });
          },
        },
      ],
    );
  }, [closeCreatePost, navigation, paymentFlow, productId, session.amount, session.orderId, verifying]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => sub.remove();
  }, [onCancel]);

  const retryPaymentPage = useCallback(() => {
    fatalErrorRef.current = false;
    handledRef.current = false;
    gatewayEnteredRef.current = false;
    setWebError(null);
    setLoading(true);
    setProgress(0);
    setReloadKey(key => key + 1);
  }, []);

  /**
   * Only treat hard network failures as fatal.
   * CCAvenue / redirects often emit HTTP status noise that must not blank the WebView.
   */
  const onWebViewError = useCallback(
    (event?: {
      nativeEvent?: { description?: string; code?: number; domain?: string; url?: string };
    }) => {
      if (gatewayEnteredRef.current || handledRef.current) {
        return;
      }
      if (fatalErrorRef.current) {
        return;
      }
      fatalErrorRef.current = true;
      const native = event?.nativeEvent;
      const code = native?.code;
      const description = native?.description;
      const failedUrl = native?.url;
      if (__DEV__) {
        console.warn('[PaymentWebView] load error', {
          code,
          domain: native?.domain,
          description,
          url: failedUrl,
          paymentUrl: session.paymentUrl,
        });
      }

      // iOS NSURLErrorCannotConnectToHost (-1004): usually localhost callback or unreachable host.
      const looksLocal =
        typeof failedUrl === 'string' &&
        (failedUrl.includes('localhost') || failedUrl.includes('127.0.0.1'));
      if (code === -1004 || looksLocal) {
        setWebError(
          looksLocal
            ? 'Payment callback points to localhost, which this phone cannot reach. Set API BASE_URL / BACKEND_URL to your public server IP (not localhost), restart the API, and try again.'
            : 'Could not connect to the payment server. Check that the device can reach the internet and that the API callback URL is a public host (not localhost).',
        );
        return;
      }

      setWebError(
        description
          ? `Unable to open payment gateway. ${description}`
          : 'Unable to load payment page. Check your connection.',
      );
    },
    [session.paymentUrl],
  );

  const onHttpError = useCallback(
    (event: { nativeEvent?: { statusCode?: number; url?: string } }) => {
      const status = event.nativeEvent?.statusCode ?? 0;
      const url = event.nativeEvent?.url ?? '';
      // Gateway redirects / intermediate pages often surface as HTTP errors — ignore.
      if (status < 500 || isCcavenueGatewayUrl(url) || gatewayEnteredRef.current) {
        return;
      }
      if (__DEV__) {
        console.warn('[PaymentWebView] http error', status, url);
      }
    },
    [],
  );

  if (verifying) {
    return (
      <View style={[paymentStyles.screen, { paddingTop: insets.top }]}>
        <PaymentLoader message="Verifying payment with bank…" />
      </View>
    );
  }

  return (
    <View style={[paymentStyles.screen, { paddingTop: insets.top }]}>
      <View style={paymentStyles.header}>
        <Pressable
          onPress={onCancel}
          style={paymentStyles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close payment"
        >
          <Icon name="close" size={24} color={PAYMENT_COLORS.text} />
        </Pressable>
        <Text style={paymentStyles.headerTitle}>Secure Payment</Text>
        <Pressable
          onPress={retryPaymentPage}
          style={paymentStyles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Reload"
        >
          <Icon name="refresh" size={22} color={PAYMENT_COLORS.navy} />
        </Pressable>
      </View>

      <View style={paymentStyles.progressTrack}>
        <View
          style={[
            paymentStyles.progressFill,
            { width: `${Math.max(2, Math.round(progress * 100))}%` },
          ]}
        />
      </View>

      {webError ? (
        <View style={paymentStyles.center}>
          <Text style={paymentStyles.errorText}>{webError}</Text>
          <Pressable onPress={retryPaymentPage}>
            <Text style={paymentStyles.linkBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            key={`ccavenue-${reloadKey}`}
            originWhitelist={['https://*', 'http://*', 'about:blank']}
            source={{ html, baseUrl: htmlBaseUrl }}
            onLoadProgress={e => setProgress(e.nativeEvent.progress)}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={onNavChange}
            onShouldStartLoadWithRequest={request => {
              // Allow the initial HTML document + all gateway / callback navigations.
              if (isIgnorableNavUrl(request.url)) {
                return true;
              }
              handleNavigationUrl(request.url);
              return true;
            }}
            onError={onWebViewError}
            onHttpError={onHttpError}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            allowsBackForwardNavigationGestures={false}
            cacheEnabled={false}
            style={{ flex: 1, opacity: loading ? 0.9 : 1 }}
            {...(Platform.OS === 'android'
              ? {
                  nestedScrollEnabled: true,
                  overScrollMode: 'never' as const,
                }
              : {})}
          />
          {loading ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 24,
                alignSelf: 'center',
              }}
            >
              <ActivityIndicator color={PAYMENT_COLORS.primary} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};
