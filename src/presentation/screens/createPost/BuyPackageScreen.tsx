import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import {
  STORAGE_FACILITY_FIX_COST,
  computeCheckoutTotals,
  formatAed,
} from '../../../utils/checkoutTotals';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { usePayment } from '../../hooks/usePayment';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { useStorageFacilities } from '../../hooks/useStorageFacilities';
import { BUY_PKG_COLORS, buyPackageStyles as styles } from './buyPackageStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostBuyPackage'>;

const STORAGE_BENEFITS = [
  'Pick up form your place',
  'Drop to seller place (within 60 km of pickup location radius)',
  'Packaging included',
];

export const BuyPackageScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useStableSafeAreaInsets();
  const { listing, adPackage, productId } = route.params;
  const [storageEnabled, setStorageEnabled] = useState(false);
  const payingLock = useRef(false);

  const {
    facilities,
    loading: facilitiesLoading,
    error: facilitiesError,
    selectedId,
    selectedFacility,
    setSelectedId,
    reload,
  } = useStorageFacilities(storageEnabled);

  const { loading: paying, initiate, setError } = usePayment();

  useEffect(() => {
    if (!storageEnabled) {
      setSelectedId(null);
    }
  }, [setSelectedId, storageEnabled]);

  const totals = useMemo(
    () =>
      computeCheckoutTotals({
        adPackage,
        storageEnabled,
        selectedFacility,
      }),
    [adPackage, selectedFacility, storageEnabled],
  );

  const displayStorageHeaderPrice = selectedFacility
    ? totals.storageTotal
    : STORAGE_FACILITY_FIX_COST;

  const toggleStorage = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStorageEnabled(prev => !prev);
  }, []);

  const onPay = useCallback(async () => {
    if (payingLock.current || paying) {
      return;
    }
    if (storageEnabled && !selectedFacility) {
      Alert.alert(
        'Select a storage plan',
        'Choose a storage duration or uncheck Storage Facility to continue.',
      );
      return;
    }

    payingLock.current = true;
    setError(null);
    try {
      const session = await initiate({
        productId: productId || listing.productId,
        packageId: adPackage.id,
        storageFacilityId: selectedFacility?.id,
        couponCode: undefined,
      });

      const parent = navigation.getParent();
      if (!parent) {
        throw new Error('Unable to open payment screen.');
      }

      parent.navigate('PaymentWebView', {
        session,
        closeCreatePost: true,
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
    adPackage.id,
    initiate,
    listing.productId,
    navigation,
    paying,
    productId,
    selectedFacility,
    setError,
    storageEnabled,
  ]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title="Place an Ad"
        backgroundColor={BUY_PKG_COLORS.bg}
        onBack={() => navigation.goBack()}
        onHelp={() =>
          Alert.alert(
            'Secure Checkout',
            'Review your package and optional storage add-on before payment.',
          )
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.secureTitle}>Secure Checkout</Text>

        <View style={styles.listingCard}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={styles.listingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.listingImage, { alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="image-outline" size={28} color={BUY_PKG_COLORS.meta} />
            </View>
          )}
          <View style={styles.listingBody}>
            <View>
              <Text style={styles.listingTitle} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={styles.listingCategory} numberOfLines={1}>
                {listing.categoryName}
              </Text>
              <View style={styles.metaRow}>
                {listing.year ? (
                  <View style={styles.metaItem}>
                    <Icon name="calendar-month-outline" size={14} color={BUY_PKG_COLORS.meta} />
                    <Text style={styles.metaText}>{listing.year}</Text>
                  </View>
                ) : null}
                {listing.mileage ? (
                  <View style={styles.metaItem}>
                    <Icon name="speedometer" size={14} color={BUY_PKG_COLORS.meta} />
                    <Text style={styles.metaText}>{listing.mileage}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.listingPrice}>{listing.priceLabel}</Text>
          </View>
        </View>

        <Text style={styles.sectionHint}>Make your ad stand out unique badges</Text>

        <Animated.View layout={Layout.springify().damping(18)} style={styles.storageCard}>
          <Pressable
            onPress={toggleStorage}
            style={styles.storageHeader}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: storageEnabled }}
          >
            <View
              style={[styles.checkbox, storageEnabled && styles.checkboxChecked]}
            >
              {storageEnabled ? (
                <Icon name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <Text style={styles.storageTitle}>Storage Facility</Text>
            <Text style={styles.storagePrice}>
              {formatAed(displayStorageHeaderPrice)}
            </Text>
          </Pressable>

          {!storageEnabled ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <View style={styles.storageDivider} />
              {STORAGE_BENEFITS.map(line => (
                <View key={line} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Storage Facility',
                    'We pick up, store, and hand over your item. Packaging included.',
                  )
                }
                hitSlop={8}
              >
                <Text style={styles.learnMore}>LEARN MORE</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(280)}>
              <View style={styles.storageDivider} />
              <Text style={styles.storageDesc}>
                We pick up, store, and hand over your item. Packaging included.
              </Text>

              {facilitiesLoading ? (
                <View style={styles.loadingPlans}>
                  <ActivityIndicator color={BUY_PKG_COLORS.primary} />
                </View>
              ) : null}

              {facilitiesError ? (
                <Pressable onPress={reload} style={styles.loadingPlans}>
                  <Text style={styles.discountLink}>Retry loading plans</Text>
                </Pressable>
              ) : null}

              {!facilitiesLoading && !facilitiesError && facilities.length > 0 ? (
                <View style={styles.plansRow}>
                  {facilities.map(plan => {
                    const selected = plan.id === selectedId;
                    return (
                      <Pressable
                        key={plan.id}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setSelectedId(plan.id);
                        }}
                        style={[styles.planChip, selected && styles.planChipSelected]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[styles.planWeek, selected && styles.planWeekSelected]}
                          numberOfLines={1}
                        >
                          {plan.facilityWeek}
                        </Text>
                        <Text
                          style={[
                            styles.planAmount,
                            selected && styles.planAmountSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {formatAed(plan.facilityAmount)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {selectedFacility ? (
                <Animated.View
                  entering={FadeInDown.duration(240)}
                  style={styles.storageBreakdown}
                >
                  <View style={styles.breakdownRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.breakdownLabel}>Fix Cost</Text>
                      <Icon
                        name="information-outline"
                        size={14}
                        color={BUY_PKG_COLORS.secureTitle}
                      />
                    </View>
                    <Text style={styles.breakdownValue}>
                      {formatAed(totals.storageFixCost)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      Storage Cost ({selectedFacility.facilityWeek.replace(/\s+/g, '')})
                    </Text>
                    <Text style={styles.breakdownValue}>
                      {formatAed(totals.storagePlanCost)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownTotalLabel}>Total</Text>
                    <Text style={styles.breakdownTotalValue}>
                      {formatAed(totals.storageTotal)}
                    </Text>
                  </View>
                </Animated.View>
              ) : null}
            </Animated.View>
          )}
        </Animated.View>

        <Text style={styles.orderTitle}>Order Summary</Text>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Package({adPackage.packageName})</Text>
          <Text style={styles.orderValue}>{formatAed(totals.packageAmount)}</Text>
        </View>

        {totals.includeStorageInSummary ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.orderRow}>
            <Text style={styles.orderLabel}>Storage Facility</Text>
            <Text style={styles.orderValue}>{formatAed(totals.storageTotal)}</Text>
          </Animated.View>
        ) : null}

        {adPackage.isVatApplicable ? (
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>VAT {totals.vatRatePercent}%</Text>
            <Text style={styles.orderValue}>{formatAed(totals.vatAmount)}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            Alert.alert(
              'Discount',
              'Discount codes are applied when payment is initiated.',
            )
          }
          hitSlop={8}
        >
          <Text style={styles.discountLink}>Apply Discount Code</Text>
        </Pressable>

        <View style={styles.orderDivider} />
        <View style={styles.orderRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatAed(totals.total)}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          onPress={onPay}
          disabled={paying}
          style={[styles.payBtn, paying && { opacity: 0.55 }]}
          accessibilityRole="button"
          accessibilityLabel={`Pay ${formatAed(totals.total)}`}
        >
          {paying ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>Pay {formatAed(totals.total)}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
