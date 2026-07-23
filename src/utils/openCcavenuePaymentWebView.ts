import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { RootStackParamList } from '../presentation/navigation/types';
import { PaymentInitiateResponse } from '../types/payment.types';

type PaymentWebViewParams = RootStackParamList['PaymentWebView'];

type NavLike = {
  navigate: (name: 'PaymentWebView', params: PaymentWebViewParams) => void;
  getParent?: () => NavLike | undefined;
};

/**
 * Opens the shared CCAvenue WebView screen the same way Create Post does:
 * prefer parent (root) navigator when nested, otherwise navigate on current stack.
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
  const nav = navigation as NavLike;
  const target = nav.getParent?.() ?? nav;

  if (!target?.navigate) {
    throw new Error('Unable to open payment screen.');
  }

  if (!params.session?.paymentUrl || !params.session?.encRequest || !params.session?.accessCode) {
    throw new Error('Invalid payment session from server. Please try again.');
  }

  target.navigate('PaymentWebView', {
    session: params.session,
    closeCreatePost: params.closeCreatePost ?? false,
    ...(params.paymentFlow ? { paymentFlow: params.paymentFlow } : {}),
    ...(params.productId ? { productId: params.productId } : {}),
  });
}
