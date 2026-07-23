import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerCouponApi } from '../../../data/api/BuyerCouponApi';
import { CartApi } from '../../../data/api/CartApi';
import { CheckoutServiceApi } from '../../../data/api/CheckoutServiceApi';
import {
  PAY_PREELLY_FEATURES,
  PAY_VIA_PREELLY_FEE,
  PICK_DROP_FEATURES,
  PICK_DROP_FEE,
} from '../../../constants/cartCheckoutConstants';
import {
  BuyerCouponValidation,
  CartItem,
  CheckoutService,
  PickDropInfo,
  PreellyPayInfo,
} from '../../../types/cartCheckout.types';
import { formatAed } from '../../../utils/checkoutTotals';
import {
  buildSelectedServiceRows,
  computeCartCheckoutTotals,
  flattenProductConditions,
  formatCartDate,
  kindOfCheckoutService,
  resolveCartProduct,
  resolveCartProductId,
  resolveCategoryLabel,
  resolveListingPrice,
  serviceHighlights,
} from '../../../utils/cartCheckoutUtils';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import { openCcavenuePaymentWebView } from '../../../utils/openCcavenuePaymentWebView';
import { PickDropModal } from '../../components/cart/PickDropModal';
import { PreellyPayModal } from '../../components/cart/PreellyPayModal';
import { usePayment } from '../../hooks/usePayment';
import { RootStackParamList } from '../../navigation/types';
import { cartCheckoutStyles as styles } from './cartCheckoutStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'CartCheckout'>;

const priceLabel = (svc: CheckoutService): string => {
  if (svc.priceType === 'FREE') {
    return 'Free';
  }
  const amount = Number(svc.price ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (svc.priceType === 'STARTING_FROM') {
    return `Starts with AED ${amount}`;
  }
  return `AED ${amount}`;
};

export const CartCheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const productIdParam = route.params?.productId;
  const payingLock = useRef(false);
  const { loading: paying, initiateCheckout, setError } = usePayment();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<CartItem | null>(null);
  const [services, setServices] = useState<CheckoutService[]>([]);

  const [payPreelly, setPayPreelly] = useState(false);
  const [pickDrop, setPickDrop] = useState(false);
  const [simpleSelected, setSimpleSelected] = useState<Set<string>>(new Set());
  const [preellyInfo, setPreellyInfo] = useState<PreellyPayInfo>({ conditions: [], comment: '' });
  const [pickDropInfo, setPickDropInfo] = useState<PickDropInfo | null>(null);

  const [preellyModalOpen, setPreellyModalOpen] = useState(false);
  const [pickDropModalOpen, setPickDropModalOpen] = useState(false);

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<BuyerCouponValidation | null>(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const [cartItems, checkoutServices] = await Promise.all([
        CartApi.getCart(),
        CheckoutServiceApi.listActiveCheckoutServices().catch(() => []),
      ]);
      const targetId = productIdParam ? String(productIdParam) : '';
      const picked = targetId
        ? cartItems.find(cartItem => resolveCartProductId(cartItem) === targetId)
        : cartItems[0];
      setItem(picked ?? null);
      setServices(checkoutServices);
    } catch (error) {
      Alert.alert(
        'Cart unavailable',
        error instanceof Error ? error.message : 'Failed to load cart',
      );
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [productIdParam]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const product = useMemo(() => resolveCartProduct(item?.productId ?? null), [item?.productId]);
  const listingPrice = useMemo(
    () => resolveListingPrice(item, product),
    [item, product],
  );
  const categoryLabel = useMemo(() => resolveCategoryLabel(product), [product]);
  const productConditions = useMemo(() => flattenProductConditions(product), [product]);

  const preellyService = useMemo(
    () => services.find(svc => kindOfCheckoutService(svc) === 'preelly') ?? null,
    [services],
  );
  const pickDropService = useMemo(
    () => services.find(svc => kindOfCheckoutService(svc) === 'pickdrop') ?? null,
    [services],
  );

  const payPreellyFee = Number(preellyService?.price ?? PAY_VIA_PREELLY_FEE);
  const pickDropFixCost = Number(pickDropService?.price ?? PICK_DROP_FEE);

  const selectedServiceRows = useMemo(
    () =>
      buildSelectedServiceRows(services, {
        payPreelly,
        pickDrop,
        simpleSelected,
        pickDropInfo,
        preellyService,
        pickDropService,
      }),
    [
      payPreelly,
      pickDrop,
      pickDropInfo,
      pickDropService,
      preellyService,
      services,
      simpleSelected,
    ],
  );

  const totals = useMemo(
    () =>
      computeCartCheckoutTotals({
        listingPrice,
        selectedServiceRows,
        discountAmount: appliedCoupon?.discountAmount ?? 0,
      }),
    [appliedCoupon?.discountAmount, listingPrice, selectedServiceRows],
  );

  const imgSrc = useMemo(() => {
    if (!product?.images?.length) {
      if (product?.video) {
        return resolveMediaUrl(product.video) || null;
      }
      return null;
    }
    const first = product.images.find(path => !path.toLowerCase().endsWith('.mp4')) ?? product.images[0];
    return resolveMediaUrl(first) || first;
  }, [product]);

  const toggleSimple = useCallback((id: string, checked: boolean) => {
    setSimpleSelected(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleTogglePayPreelly = useCallback((checked: boolean) => {
    if (checked) {
      setPreellyModalOpen(true);
      return;
    }
    setPayPreelly(false);
    setPreellyInfo({ conditions: [], comment: '' });
  }, []);

  const handleTogglePickDrop = useCallback((checked: boolean) => {
    if (checked) {
      setPickDropModalOpen(true);
      return;
    }
    setPickDrop(false);
    setPickDropInfo(null);
  }, []);

  const handleApplyDiscount = useCallback(async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      return;
    }
    if (!selectedServiceRows.length) {
      const message = 'Select a checkout service before applying a coupon';
      setCouponError(message);
      Alert.alert('Coupon', message);
      return;
    }
    try {
      setApplyingCoupon(true);
      setCouponError('');
      const result = await BuyerCouponApi.validateFromRows(code, selectedServiceRows);
      if (!result.valid && !result.discountAmount) {
        throw new Error(result.message || 'This coupon could not be applied');
      }
      setAppliedCoupon({ ...result, couponCode: result.couponCode ?? code });
    } catch (error) {
      setAppliedCoupon(null);
      const message = error instanceof Error ? error.message : 'This coupon could not be applied';
      setCouponError(message);
      Alert.alert('Coupon', message);
    } finally {
      setApplyingCoupon(false);
    }
  }, [discountCode, selectedServiceRows]);

  const handleCheckout = useCallback(async () => {
    if (payingLock.current || paying) {
      return;
    }
    const checkoutProductId = resolveCartProductId(item);
    if (!checkoutProductId) {
      Alert.alert('Checkout', 'Missing product for checkout');
      return;
    }
    if (listingPrice <= 0) {
      Alert.alert('Checkout', 'This listing does not have a valid price.');
      return;
    }
    if (totals.total <= 0) {
      Alert.alert('Checkout', 'Unable to calculate checkout total. Please try again.');
      return;
    }
    if (payPreelly && preellyInfo.conditions.length === 0) {
      Alert.alert('Pay Through Preelly', 'Select at least one condition to continue.');
      setPreellyModalOpen(true);
      return;
    }
    if (pickDrop && !pickDropInfo) {
      Alert.alert('Pick & Drop Service', 'Please complete pick-up and drop-off details.');
      setPickDropModalOpen(true);
      return;
    }

    // Same pattern as Create Post BuyPackageScreen → CCAvenue WebView.
    payingLock.current = true;
    setError(null);
    try {
      const session = await initiateCheckout({
        productId: checkoutProductId,
        services: selectedServiceRows.map(row => ({
          checkoutServiceId: row.id,
          amount: row.fee,
        })),
        couponCode: appliedCoupon?.couponCode ?? null,
        pickDrop: pickDropInfo,
        preelly: payPreelly
          ? { conditions: preellyInfo.conditions, comment: preellyInfo.comment }
          : null,
      });

      openCcavenuePaymentWebView(navigation, {
        session,
        closeCreatePost: false,
        paymentFlow: 'cart',
        productId: checkoutProductId,
      });
    } catch (error) {
      Alert.alert(
        'Payment',
        error instanceof Error ? error.message : 'Unable to start payment.',
      );
    } finally {
      payingLock.current = false;
    }
  }, [
    appliedCoupon?.couponCode,
    initiateCheckout,
    item,
    listingPrice,
    navigation,
    payPreelly,
    paying,
    pickDrop,
    pickDropInfo,
    preellyInfo.comment,
    preellyInfo.conditions,
    selectedServiceRows,
    setError,
    totals.total,
  ]);

  const renderServiceCard = (svc: CheckoutService) => {
    const kind = kindOfCheckoutService(svc);
    const selected =
      kind === 'preelly' ? payPreelly : kind === 'pickdrop' ? pickDrop : simpleSelected.has(svc.id);
    const onToggle =
      kind === 'preelly'
        ? handleTogglePayPreelly
        : kind === 'pickdrop'
          ? handleTogglePickDrop
          : (checked: boolean) => toggleSimple(svc.id, checked);

    const highlights = serviceHighlights(
      svc,
      kind === 'pickdrop' ? PICK_DROP_FEATURES : PAY_PREELLY_FEATURES,
    );

    return (
      <View key={svc.id} style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <Pressable
            style={[styles.checkbox, selected ? styles.checkboxChecked : null]}
            onPress={() => onToggle(!selected)}
          >
            {selected ? <Icon name="check" size={14} color="#FFF" /> : null}
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={styles.serviceTitleRow}>
              <Text style={styles.serviceTitle}>{svc.serviceName}</Text>
              <Text style={styles.servicePrice}>
                {kind === 'pickdrop' && pickDropInfo
                  ? formatAed(pickDropInfo.total, 2)
                  : priceLabel(svc)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.serviceDivider} />

        {kind === 'preelly' && payPreelly && preellyInfo.conditions.length ? (
          <>
            <View style={styles.chipsWrap}>
              {preellyInfo.conditions.map(condition => (
                <View key={condition} style={styles.conditionChip}>
                  <Icon name="check-circle" size={14} color={styles.servicePrice.color} />
                  <Text style={styles.conditionChipText}>{condition}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={() => setPreellyModalOpen(true)}>
              <Text style={styles.editLink}>EDIT</Text>
            </Pressable>
          </>
        ) : kind === 'pickdrop' && pickDrop && pickDropInfo ? (
          <>
            <View style={styles.metaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Select Date*</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldText}>{formatCartDate(pickDropInfo.date)}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Select Time*</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldText}>{pickDropInfo.timeSlot}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.fieldLabel}>Address</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldText}>{pickDropInfo.address}</Text>
            </View>
            <Pressable onPress={() => setPickDropModalOpen(true)}>
              <Text style={styles.editLink}>EDIT</Text>
            </Pressable>
          </>
        ) : (
          <>
            {highlights.map(point => (
              <View key={point} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
            <Pressable
              onPress={() => {
                if (svc.learnMoreUrl) {
                  void Linking.openURL(svc.learnMoreUrl);
                } else {
                  Alert.alert(svc.serviceName, 'Details coming soon');
                }
              }}
            >
              <Text style={styles.learnMore}>{svc.buttonText || 'LEARN MORE'}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0000FF" />
      </View>
    );
  }

  if (!item || !product) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Icon name="chevron-left" size={28} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>My cart</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('MainTabs')}>
            <Text style={styles.emptyBtnText}>Continue shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-left" size={28} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>My cart</Text>
        <Pressable hitSlop={12}>
          <Icon name="help-circle-outline" size={22} color="#111827" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.secureTitle}>Secure Checkout</Text>

        <View style={styles.listingCard}>
          {imgSrc ? (
            <Image source={{ uri: imgSrc }} style={styles.listingImage} />
          ) : (
            <View style={styles.listingImage} />
          )}
          <View style={styles.listingBody}>
            <View>
              <Text style={styles.listingTitle} numberOfLines={2}>
                {product.title}
              </Text>
              {categoryLabel ? (
                <Text style={styles.listingCategory}>{categoryLabel}</Text>
              ) : null}
              <View style={styles.metaRow}>
                {product.year ? (
                  <View style={styles.metaItem}>
                    <Icon name="calendar" size={14} color={styles.metaText.color} />
                    <Text style={styles.metaText}>{product.year}</Text>
                  </View>
                ) : null}
                {(product.kilometers ?? product.mileage) != null ? (
                  <View style={styles.metaItem}>
                    <Icon name="speedometer" size={14} color={styles.metaText.color} />
                    <Text style={styles.metaText}>
                      {Number(product.kilometers ?? product.mileage).toLocaleString()} km
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.listingPrice}>{formatAed(listingPrice, 0)}</Text>
          </View>
        </View>

        <Text style={styles.sectionHint}>Purchase made risk-free & convenient</Text>

        {services.length ? services.map(renderServiceCard) : (
          <Text style={styles.bulletText}>No checkout services are available right now.</Text>
        )}

        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Product</Text>
          <Text style={styles.summaryValue}>{formatAed(totals.productFee, 2)}</Text>
        </View>
        {selectedServiceRows.map(row => (
          <View key={row.id} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{row.name}</Text>
            <Text style={styles.summaryValue}>{formatAed(row.fee, 2)}</Text>
          </View>
        ))}
        {totals.discountAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#047857' }]}>
              Discount ({appliedCoupon?.couponCode})
            </Text>
            <Text style={[styles.summaryValue, { color: '#047857' }]}>
              − {formatAed(totals.discountAmount, 2)}
            </Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>VAT 5%</Text>
          <Text style={styles.summaryValue}>{formatAed(totals.vatValue, 2)}</Text>
        </View>

        {appliedCoupon ? (
          <View style={styles.couponApplied}>
            <Text style={styles.couponAppliedText}>
              {appliedCoupon.couponCode} applied — saved {formatAed(totals.discountAmount, 2)}
            </Text>
            <Pressable
              onPress={() => {
                setAppliedCoupon(null);
                setCouponError('');
                setDiscountCode('');
              }}
            >
              <Icon name="close" size={18} color="#047857" />
            </Pressable>
          </View>
        ) : !showDiscount ? (
          <Pressable onPress={() => setShowDiscount(true)}>
            <Text style={styles.discountLink}>Apply Discount Code</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.discountInputRow}>
              <TextInput
                value={discountCode}
                onChangeText={value => {
                  setDiscountCode(value.toUpperCase());
                  if (couponError) {
                    setCouponError('');
                  }
                }}
                placeholder="Enter code"
                autoCapitalize="characters"
                style={styles.discountInput}
              />
              <Pressable
                style={styles.discountApplyBtn}
                onPress={() => void handleApplyDiscount()}
                disabled={applyingCoupon}
              >
                {applyingCoupon ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.discountApplyText}>Apply</Text>
                )}
              </Pressable>
            </View>
            {couponError ? (
              <Text style={[styles.bulletText, { color: '#EF4444', marginTop: 6 }]}>
                {couponError}
              </Text>
            ) : null}
          </>
        )}

        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatAed(totals.total, 2)}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[styles.payBtn, paying ? { opacity: 0.55 } : null]}
          onPress={() => void handleCheckout()}
          disabled={paying}
          accessibilityRole="button"
          accessibilityLabel={`Pay ${formatAed(totals.total, 2)}`}
        >
          {paying ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.payBtnText}>Pay {formatAed(totals.total, 2)}</Text>
          )}
        </Pressable>
      </View>

      <PreellyPayModal
        visible={preellyModalOpen}
        conditions={productConditions}
        charge={payPreellyFee}
        initialSelected={preellyInfo.conditions}
        initialComment={preellyInfo.comment}
        onClose={() => setPreellyModalOpen(false)}
        onConfirm={(conditions, comment) => {
          setPreellyInfo({ conditions, comment });
          setPayPreelly(true);
          setPreellyModalOpen(false);
        }}
      />

      <PickDropModal
        visible={pickDropModalOpen}
        fixCost={pickDropFixCost}
        initialValue={pickDropInfo}
        onClose={() => setPickDropModalOpen(false)}
        onConfirm={info => {
          setPickDropInfo(info);
          setPickDrop(true);
          setPickDropModalOpen(false);
        }}
      />
    </View>
  );
};
