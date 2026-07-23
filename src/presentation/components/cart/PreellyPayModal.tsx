import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FALLBACK_PREELLY_CONDITIONS,
  MAX_PREELLY_CONDITIONS,
} from '../../../constants/cartCheckoutConstants';
import { CART_COLORS } from '../../screens/cart/cartCheckoutStyles';

interface Props {
  visible: boolean;
  conditions?: string[];
  charge: number;
  initialSelected?: string[];
  initialComment?: string;
  onClose: () => void;
  onConfirm: (conditions: string[], comment: string) => void;
}

export const PreellyPayModal: React.FC<Props> = ({
  visible,
  conditions = [...FALLBACK_PREELLY_CONDITIONS],
  charge,
  initialSelected = [],
  initialComment = '',
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    if (visible) {
      setSelected(initialSelected);
      setComment(initialComment);
    }
  }, [visible, initialComment, initialSelected]);

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

  const availableConditions = useMemo(
    () => (conditions.length ? conditions : [...FALLBACK_PREELLY_CONDITIONS]),
    [conditions],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="chevron-left" size={28} color={CART_COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Opt for Preelly Pay</Text>
          <Pressable hitSlop={12}>
            <Icon name="help-circle-outline" size={22} color={CART_COLORS.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Preelly Pay Conditions</Text>
            <Text style={styles.chargeText}>
              Starts with{' '}
              <Text style={styles.chargeAmount}>AED {charge.toFixed(2)}</Text>
            </Text>
          </View>

          <Text style={styles.hint}>
            Select Preelly Pay conditions you can select up to {MAX_PREELLY_CONDITIONS} options
          </Text>

          <View style={styles.chipsWrap}>
            {availableConditions.map(condition => {
              const active = selected.includes(condition);
              return (
                <Pressable
                  key={condition}
                  onPress={() => toggle(condition)}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text style={styles.chipText}>{condition}</Text>
                  <View style={[styles.chipIcon, active ? styles.chipIconActive : null]}>
                    <Icon name="check" size={12} color="#FFF" />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Enter comments here"
            placeholderTextColor={CART_COLORS.muted}
            multiline
            style={styles.commentBox}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => onConfirm(selected, comment.trim())}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CART_COLORS.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CART_COLORS.text,
    flex: 1,
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
  commentBox: {
    marginTop: 20,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: CART_COLORS.text,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  confirmBtn: {
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
