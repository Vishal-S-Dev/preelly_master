import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { paymentService } from '../../../services/payment.service';
import { buildCcavenueCheckoutHtml } from '../../../utils/paymentUtils';
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

const isCompletionUrl = (url: string) => {
  const lower = url.toLowerCase();
  return (
    lower.includes('/api/payment/ccavenue/callback') ||
    lower.includes('/payment/ccavenue/callback') ||
    lower.includes('encresp=') ||
    lower.includes('enc_resp=') ||
    lower.includes('payment/success') ||
    lower.includes('payment/failure') ||
    lower.includes('payment/failed') ||
    lower.includes('payment/cancel')
  );
};

export const PaymentWebViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useStableSafeAreaInsets();
  const { session, closeCreatePost } = route.params;
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const handledRef = useRef(false);
  const webRef = useRef<WebView>(null);

  const html = useMemo(() => buildCcavenueCheckoutHtml(session), [session]);

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
        message: 'We are confirming your payment. Please check again shortly.',
      });
    } finally {
      setVerifying(false);
    }
  }, [closeCreatePost, navigation, session.amount, session.orderId]);

  const onNavChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url } = navState;
      if (!url || handledRef.current) {
        return;
      }

      const matchedExplicit = urlMatches(url, [
        session.redirectUrl,
        session.cancelUrl,
        session.callbackUrl,
      ]);

      if (matchedExplicit || isCompletionUrl(url)) {
        finishWithTransaction();
      }
    },
    [finishWithTransaction, session.callbackUrl, session.cancelUrl, session.redirectUrl],
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
              message: 'You cancelled the payment.',
            });
          },
        },
      ],
    );
  }, [closeCreatePost, navigation, session.amount, session.orderId, verifying]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => sub.remove();
  }, [onCancel]);

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
          onPress={() => webRef.current?.reload()}
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
          <Pressable
            onPress={() => {
              setWebError(null);
              handledRef.current = false;
              webRef.current?.reload();
            }}
          >
            <Text style={paymentStyles.linkBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html, baseUrl: session.paymentUrl }}
            onLoadProgress={e => setProgress(e.nativeEvent.progress)}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={onNavChange}
            onShouldStartLoadWithRequest={request => {
              if (!handledRef.current && request.url) {
                onNavChange({
                  url: request.url,
                  loading: false,
                  title: '',
                  canGoBack: false,
                  canGoForward: false,
                  lockIdentifier: 0,
                });
              }
              // Always allow CCAvenue redirects — blocking here can prevent callback.
              return true;
            }}
            onError={() =>
              setWebError('Unable to load payment page. Check your connection.')
            }
            onHttpError={() =>
              setWebError('Payment page returned an error. Please retry.')
            }
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows={false}
            style={{ flex: 1, opacity: loading ? 0.85 : 1 }}
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
