import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { navigateRoot } from '../presentation/navigation/navigationRef';
import { RootStackParamList } from '../presentation/navigation/types';
import { PaymentInitiateResponse } from '../types/payment.types';

type PaymentWebViewParams = RootStackParamList['PaymentWebView'];

type NavLike = {
  navigate: (name: 'PaymentWebView', params: PaymentWebViewParams) => void;
  getParent?: () => NavLike | undefined;
};

/**
 * Opens the shared CCAvenue WebView (same POST form flow as web CartCheckoutPage).
 *
 * Prefer the root NavigationContainer ref so this works from:
 * - CartCheckout (root stack) — avoids getParent() no-op
 * - CreatePostBuyPackage (nested stack) — reaches root PaymentWebView
 */
export function openCcavenuePaymentWebView(
  navigation: NavLike | NavigationProp<ParamListBase>,
  params: {
    session: PaymentInitiateResponse;
    closeCreatePost?: boolean;
    paymentFlow?: PaymentWebViewParams['paymentFlow'];
    productId?: string;
  },
): void {
  if (!params.session?.paymentUrl || !params.session?.encRequest) {
    throw new Error('Invalid payment session from server. Please try again.');
  }
  if (!params.session.accessCode) {
    throw new Error('Invalid payment session from server. Please try again.');
  }

  const screenParams: PaymentWebViewParams = {
    session: params.session,
    closeCreatePost: params.closeCreatePost ?? false,
    ...(params.paymentFlow ? { paymentFlow: params.paymentFlow } : {}),
    ...(params.productId ? { productId: params.productId } : {}),
  };

  if (navigateRoot('PaymentWebView', screenParams)) {
    return;
  }

  const nav = navigation as NavLike;
  // Fallback when the container ref is not ready yet (rare race on cold start).
  let cursor: NavLike | undefined = nav;
  const seen = new Set<NavLike>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    if (typeof cursor.navigate === 'function') {
      try {
        cursor.navigate('PaymentWebView', screenParams);
        return;
      } catch {
        /* try parent */
      }
    }
    cursor = cursor.getParent?.();
  }

  throw new Error('Unable to open payment screen.');
}
