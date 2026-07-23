import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Image,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { THREAD_UI } from '../../screens/chat/chatThreadStyles';
import { formatAed } from '../../../utils/checkoutTotals';

export interface ProductOfferPreview {
  imageUrl?: string | null;
  title?: string | null;
  categoryLabel?: string | null;
  year?: string | number | null;
  kilometers?: string | number | null;
  originalPrice?: number | null;
}

type PropsBase = {
  visible: boolean;
  onClose: () => void;
  maxOfferAmount?: number | null;
};

export interface MakeOfferSheetProps extends PropsBase {
  product?: ProductOfferPreview | null;
  onSendOffer: (amount: number) => Promise<void> | void;
}

export const MakeOfferSheet: React.FC<MakeOfferSheetProps> = ({
  visible,
  onClose,
  maxOfferAmount,
  product,
  onSendOffer,
}) => {
  const [amountRaw, setAmountRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAmountRaw('');
      setError(null);
      setSending(false);
    }
  }, [visible]);

  const parsed = useMemo(() => {
    const n = Number(String(amountRaw).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountRaw]);

  const submit = useCallback(async () => {
    setError(null);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (typeof maxOfferAmount === 'number' && maxOfferAmount > 0 && parsed > maxOfferAmount) {
      setError(`Amount cannot exceed AED ${maxOfferAmount.toLocaleString('en-US')}`);
      return;
    }

    try {
      setSending(true);
      await onSendOffer(parsed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your offer');
    } finally {
      setSending(false);
    }
  }, [maxOfferAmount, onClose, onSendOffer, parsed]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Confirm amount</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Feather name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            {product ? (
              <View style={styles.productCard}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]} />
                )}
                <View style={styles.productBody}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title ?? 'Listing'}
                  </Text>
                  {product.categoryLabel ? (
                    <Text style={styles.productCategory}>{product.categoryLabel}</Text>
                  ) : null}
                  <View style={styles.productMetaRow}>
                    {product.year ? (
                      <View style={styles.productMetaItem}>
                        <Icon name="calendar" size={14} color="#8B95B5" />
                        <Text style={styles.productMetaText}>{product.year}</Text>
                      </View>
                    ) : null}
                    {product.kilometers != null ? (
                      <View style={styles.productMetaItem}>
                        <Icon name="speedometer" size={14} color="#8B95B5" />
                        <Text style={styles.productMetaText}>
                          {Number(product.kilometers).toLocaleString()} km
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {typeof product.originalPrice === 'number' && product.originalPrice > 0 ? (
                    <Text style={styles.productPrice}>
                      {formatAed(product.originalPrice, 0)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <Text style={styles.confirmHint}>Enter the final amount for this deal</Text>

            <View
              style={[
                styles.amountInputWrap,
                error ? { borderColor: '#EF4444' } : null,
              ]}
            >
              <TextInput
                value={amountRaw}
                onChangeText={setAmountRaw}
                placeholder="Enter the final price here"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
                style={styles.amountInputPlain}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={sending}
              style={[
                styles.confirmBtn,
                sending ? { opacity: 0.7 } : null,
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm</Text>
              )}
            </Pressable>

            <View style={{ height: 6 }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export interface OfferResponseSheetProps extends PropsBase {
  senderName?: string | null;
  senderAvatar?: string | null;
  offerAmount: number;
  onAcceptOffer: (amount: number) => Promise<void> | void;
  onRejectOffer: () => Promise<void> | void;
  onSendCounterOffer: (amount: number) => Promise<void> | void;
}

export const OfferResponseSheet: React.FC<OfferResponseSheetProps> = ({
  visible,
  onClose,
  maxOfferAmount,
  senderName,
  senderAvatar,
  offerAmount,
  onAcceptOffer,
  onRejectOffer,
  onSendCounterOffer,
}) => {
  const [counterRaw, setCounterRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<null | 'accept' | 'reject' | 'counter'>(null);

  useEffect(() => {
    if (!visible) {
      setCounterRaw('');
      setError(null);
      setLoadingAction(null);
    }
  }, [visible]);

  const counterValue = useMemo(() => {
    const n = Number(String(counterRaw).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [counterRaw]);

  const maxText = useMemo(() => {
    if (typeof maxOfferAmount !== 'number' || maxOfferAmount <= 0) return null;
    return maxOfferAmount.toLocaleString('en-US');
  }, [maxOfferAmount]);

  const validateCounter = useCallback(() => {
    setError(null);
    if (!counterValue || counterValue <= 0) {
      setError('Enter a valid counter offer');
      return false;
    }
    if (typeof maxOfferAmount === 'number' && maxOfferAmount > 0 && counterValue > maxOfferAmount) {
      setError(`Amount cannot exceed AED ${maxText}`);
      return false;
    }
    return true;
  }, [counterValue, maxOfferAmount, maxText]);

  const accept = useCallback(async () => {
    setError(null);
    try {
      setLoadingAction('accept');
      await onAcceptOffer(offerAmount);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept offer');
    } finally {
      setLoadingAction(null);
    }
  }, [offerAmount, onAcceptOffer, onClose]);

  const reject = useCallback(async () => {
    setError(null);
    try {
      setLoadingAction('reject');
      await onRejectOffer();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reject offer');
    } finally {
      setLoadingAction(null);
    }
  }, [onClose, onRejectOffer]);

  const counter = useCallback(async () => {
    if (!validateCounter()) return;
    setError(null);
    try {
      setLoadingAction('counter');
      await onSendCounterOffer(counterValue);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send counter offer');
    } finally {
      setLoadingAction(null);
    }
  }, [counterValue, onClose, onSendCounterOffer, validateCounter]);

  const formattedOffer = offerAmount.toLocaleString('en-US');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Offer for your ad</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Feather name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.senderRow}>
              {senderAvatar ? (
                <View style={styles.avatarCircle}>
                  <Image source={{ uri: senderAvatar }} style={styles.avatarImage} />
                </View>
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(senderName?.trim() ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.senderName} numberOfLines={1}>
                  {senderName ?? 'User'}
                </Text>
              </View>
            </View>

            <Text style={styles.infoText}>
              You have got an offer of{' '}
              <Text style={{ fontWeight: '800' }}>AED {formattedOffer}</Text>
            </Text>

            <Text style={styles.inputLabel}>Enter your counter offer</Text>

            <View style={[styles.amountInputWrap, error ? { borderColor: '#EF4444' } : null]}>
              <Text style={styles.currencyLabel}>AED</Text>
              <TextInput
                value={counterRaw}
                onChangeText={setCounterRaw}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.amountInput}
                returnKeyType="done"
                onSubmitEditing={counter}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.footerRow}>
              <Pressable
                onPress={reject}
                disabled={loadingAction !== null}
                style={[styles.footerBtn, styles.footerBtnGhost, { flex: 1 }]}
              >
                {loadingAction === 'reject' ? (
                  <ActivityIndicator color="#7C3AED" />
                ) : (
                  <Text style={[styles.footerBtnText, styles.footerBtnGhostText]}>Reject</Text>
                )}
              </Pressable>

              <Pressable
                onPress={accept}
                disabled={loadingAction !== null}
                style={[styles.footerBtn, styles.footerBtnPrimary, { flex: 1, marginLeft: 10 }]}
              >
                {loadingAction === 'accept' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.footerBtnText, { color: '#fff' }]}>Accept</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.counterFooterWrap}>
              <Pressable
                onPress={counter}
                disabled={loadingAction !== null}
                style={[
                  styles.counterBtn,
                  counterValue <= 0 ? { opacity: 0.7 } : null,
                ]}
              >
                {loadingAction === 'counter' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.counterBtnText, { color: '#fff' }]}>Send Counter offer</Text>
                )}
              </Pressable>
            </View>

            {typeof maxOfferAmount === 'number' && maxOfferAmount > 0 ? (
              <Text style={styles.maxHintText}>Max AED {maxOfferAmount.toLocaleString('en-US')}</Text>
            ) : null}

            <View style={{ height: 6 }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: { width: '100%' },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    paddingRight: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F2F4F7',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  avatarInitial: {
    color: THREAD_UI.primary,
    fontWeight: '900',
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    marginTop: 2,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  errorText: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnGhost: {
    backgroundColor: '#EEF2FF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  footerBtnGhostText: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  footerBtnPrimary: {
    backgroundColor: THREAD_UI.primary,
    marginLeft: 0,
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  counterFooterWrap: {
    marginTop: 14,
  },
  counterBtn: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  maxHintText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  productCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productImage: {
    width: 92,
    height: 92,
    backgroundColor: '#E5E7EB',
  },
  productImagePlaceholder: {
    backgroundColor: '#F3F4F6',
  },
  productBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  productMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productMetaText: {
    fontSize: 12,
    color: '#8B95B5',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0000FF',
    textAlign: 'right',
    marginTop: 6,
  },
  confirmHint: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2B6B',
    marginBottom: 10,
  },
  amountInputPlain: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  confirmBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#0000FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

