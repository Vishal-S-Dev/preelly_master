import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PaymentTransaction } from '../../../types/payment.types';
import { PaymentError } from '../../components/payment/PaymentError';
import { TransactionCard } from '../../components/payment/TransactionCard';
import { useInvoiceDownload } from '../../hooks/useInvoiceDownload';
import { usePaymentHistory } from '../../hooks/usePaymentHistory';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { PAYMENT_COLORS, paymentStyles } from './paymentStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentHistory'>;

export const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useStableSafeAreaInsets();
  const {
    items,
    loading,
    refreshing,
    loadingMore,
    error,
    search,
    setSearch,
    refresh,
    loadMore,
    reload,
  } = usePaymentHistory();
  const { download, downloading } = useInvoiceDownload();

  const onBack = useCallback(() => navigation.goBack(), [navigation]);

  const onDownload = useCallback(
    (item: PaymentTransaction) => {
      if (downloading) {
        return;
      }
      download(item.id || item.orderId);
    },
    [download, downloading],
  );

  const onOpenDetails = useCallback(
    (item: PaymentTransaction) => {
      const common = {
        orderId: item.orderId,
        transactionId: item.transactionId,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        message: item.failureReason,
      };
      if (item.status === 'SUCCESS') {
        navigation.navigate('PaymentSuccess', common);
      } else if (item.status === 'CANCELLED') {
        navigation.navigate('PaymentCancelled', common);
      } else if (item.status === 'PENDING' || item.status === 'UNKNOWN') {
        navigation.navigate('PaymentPending', common);
      } else {
        navigation.navigate('PaymentFailed', common);
      }
    },
    [navigation],
  );

  const header = useMemo(
    () => (
      <View>
        <View style={paymentStyles.header}>
          <Pressable onPress={onBack} style={paymentStyles.headerBtn} hitSlop={8}>
            <Icon name="chevron-left" size={28} color={PAYMENT_COLORS.text} />
          </Pressable>
          <Text style={paymentStyles.headerTitle}>Transactions</Text>
          <View style={paymentStyles.headerBtn} />
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by order ID"
          placeholderTextColor={PAYMENT_COLORS.muted}
          style={paymentStyles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={reload}
        />
      </View>
    ),
    [onBack, reload, search, setSearch],
  );

  return (
    <View style={[paymentStyles.screen, { paddingTop: insets.top }]}>
      {header}
      {loading && items.length === 0 ? (
        <View style={paymentStyles.center}>
          <ActivityIndicator color={PAYMENT_COLORS.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <PaymentError message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id || item.orderId}
          contentContainerStyle={paymentStyles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={[paymentStyles.statusSubtitle, { marginTop: 40 }]}>
              No transactions yet.
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={PAYMENT_COLORS.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <TransactionCard
              item={item}
              onPress={() => onOpenDetails(item)}
              onDownloadInvoice={
                item.status === 'SUCCESS'
                  ? () => onDownload(item)
                  : undefined
              }
              onRetry={
                item.status === 'FAILED' || item.status === 'CANCELLED'
                  ? () => navigation.goBack()
                  : undefined
              }
            />
          )}
        />
      )}
    </View>
  );
};
