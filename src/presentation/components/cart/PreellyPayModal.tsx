import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_PREELLY_CONDITIONS } from '../../../constants/cartCheckoutConstants';
import { CART_COLORS } from '../../screens/cart/cartCheckoutStyles';

interface Props {
  visible: boolean;
  /** Ignored for display — conditions are user-typed via Add More only. Kept for call-site compat. */
  conditions?: string[];
  charge: number;
  /** Previously confirmed user-typed conditions (e.g. edit from checkout). */
  initialSelected?: string[];
  initialComment?: string;
  onClose: () => void;
  onConfirm: (conditions: string[], comment: string) => void;
  /** Skip Preelly Pay (chat → secure checkout with option disabled). */
  onNotInterested?: () => void;
}

/**
 * Opt For Preelly Pay — matches web `PreellyPayModal` + reference screenshots:
 * empty start, type + ADD MORE chips only, Not Interested / Confirm.
 */
export const PreellyPayModal: React.FC<Props> = ({
  visible,
  charge,
  initialSelected,
  initialComment,
  onClose,
  onConfirm,
  onNotInterested,
}) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [addedConditions, setAddedConditions] = useState<string[]>([]);
  // Seed only on open (false → true), same as web — never on every parent re-render.
  const wasVisibleRef = useRef(false);
  const initialSelectedRef = useRef(initialSelected);
  const initialCommentRef = useRef(initialComment);
  initialSelectedRef.current = initialSelected;
  initialCommentRef.current = initialComment;

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      const seeded = (initialSelectedRef.current || [])
        .map(item => String(item).trim())
        .filter(Boolean);
      setSelected(seeded);
      setAddedConditions(seeded);
      setDraft(
        typeof initialCommentRef.current === 'string' ? initialCommentRef.current : '',
      );
    }
    wasVisibleRef.current = visible;
  }, [visible]);

  const toggle = useCallback((condition: string) => {
    setSelected(prev => {
      if (prev.includes(condition)) {
        return prev.filter(item => item !== condition);
      }
      if (prev.length >= MAX_PREELLY_CONDITIONS) {
        Alert.alert(
          'Limit reached',
          `You can select up to ${MAX_PREELLY_CONDITIONS} options`,
        );
        return prev;
      }
      return [...prev, condition];
    });
  }, []);

  const validateCondition = useCallback((raw: string): string | null => {
    const value = raw.trim();
    if (!value) return 'Please enter a condition';
    if (value.length > 60) return 'Condition must be 60 characters or less';
    if (!/^[a-zA-Z0-9 ,.()/&-]+$/.test(value)) return 'No special characters allowed';
    if (value.includes('--')) return 'Invalid input';
    if (
      /\b(select|insert|update|delete|drop|alter|create|truncate|union|exec|where|table|database)\b/i.test(
        value,
      )
    ) {
      return 'Invalid input';
    }
    return null;
  }, []);

  const handleAddMore = useCallback(() => {
    const validationError = validateCondition(draft);
    if (validationError) {
      Alert.alert('Invalid condition', validationError);
      return;
    }

    const value = draft.trim();
    if (addedConditions.some(item => item.toLowerCase() === value.toLowerCase())) {
      Alert.alert('Already added', 'This condition is already in the list');
      return;
    }

    setAddedConditions(prev => [...prev, value]);
    setSelected(prev =>
      prev.length < MAX_PREELLY_CONDITIONS ? [...prev, value] : prev,
    );
    setDraft('');
  }, [addedConditions, draft, validateCondition]);

  const handleConfirm = useCallback(() => {
    if (!selected.length) {
      Alert.alert('Preelly Pay', 'Select at least one condition');
      return;
    }
    onConfirm(selected, draft.trim());
  }, [draft, onConfirm, selected]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.backdrop,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Dismiss"
          />
          <View style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Opt For Preelly Pay</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Icon name="close" size={22} color="#94A3B8" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={styles.titleRow}>
                  <Text style={styles.sectionTitle}>Preelly Pay Conditions</Text>
                  <Text style={styles.chargeText}>
                    Charges{' '}
                    <Text style={styles.chargeAmount}>
                      AED {Number(charge || 0).toFixed(2)}
                    </Text>
                  </Text>
                </View>

                <Text style={styles.hint}>
                  Select Preelly Pay conditions you can select up to{' '}
                  {MAX_PREELLY_CONDITIONS} options
                </Text>

                <View style={styles.chipsWrap}>
                  {addedConditions.length === 0 ? (
                    <Text style={styles.emptyConditions}>
                      No conditions available for this product.
                    </Text>
                  ) : (
                    addedConditions.map(condition => {
                      const active = selected.includes(condition);
                      return (
                        <Pressable
                          key={condition}
                          onPress={() => toggle(condition)}
                          style={[styles.chip, active ? styles.chipActive : null]}
                        >
                          <Text style={styles.chipText}>{condition}</Text>
                          <View
                            style={[styles.chipIcon, active ? styles.chipIconActive : null]}
                          >
                            <Icon name="check" size={12} color="#FFF" />
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Add more condition"
                  placeholderTextColor={CART_COLORS.muted}
                  multiline
                  maxLength={60}
                  style={styles.addMoreBox}
                  onSubmitEditing={handleAddMore}
                  blurOnSubmit
                  returnKeyType="done"
                  textAlignVertical="top"
                  autoCorrect={false}
                  autoCapitalize="sentences"
                />

                <View style={styles.addMoreRow}>
                  <Pressable
                    style={styles.addMoreBtn}
                    onPress={handleAddMore}
                    accessibilityRole="button"
                    accessibilityLabel="Add more condition"
                  >
                    <Icon name="plus" size={16} color={CART_COLORS.primary} />
                    <Text style={styles.addMoreText}>Add More</Text>
                  </Pressable>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.footerRow}>
                  {onNotInterested ? (
                    <Pressable
                      style={styles.notInterestedBtn}
                      onPress={onNotInterested}
                      accessibilityRole="button"
                      accessibilityLabel="Not Interested"
                    >
                      <Text style={styles.notInterestedText}>Not Interested</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm"
                  >
                    <Text style={styles.confirmText}>Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    maxHeight: '92%',
    zIndex: 1,
  },
  cardInner: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CART_COLORS.secureTitle,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CART_COLORS.secureTitle,
    flexShrink: 1,
  },
  chargeText: {
    fontSize: 13,
    color: CART_COLORS.secureTitle,
    fontWeight: '600',
  },
  chargeAmount: {
    color: CART_COLORS.primary,
    fontWeight: '800',
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: CART_COLORS.secureTitle,
  },
  emptyConditions: {
    fontSize: 13,
    color: CART_COLORS.muted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  chipActive: {
    borderColor: CART_COLORS.chipBorder,
    backgroundColor: CART_COLORS.chipBg,
  },
  chipText: {
    fontSize: 13,
    color: CART_COLORS.text,
    flexShrink: 1,
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconActive: {
    backgroundColor: CART_COLORS.success,
  },
  addMoreBox: {
    marginTop: 18,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: CART_COLORS.text,
    textAlignVertical: 'top',
  },
  addMoreRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  addMoreText: {
    color: CART_COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notInterestedBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  notInterestedText: {
    color: CART_COLORS.secureTitle,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: CART_COLORS.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
