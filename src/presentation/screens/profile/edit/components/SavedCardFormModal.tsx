import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCard, SavedCardPayload } from '../../../../../types/profileEdit.types';
import { PE_COLORS, peStyles } from '../profileEditStyles';
import {
  CardFormErrors,
  detectCardBrand,
  formatCardInput,
  formatExpiryInput,
  validateCardForm,
} from '../utils/cardValidation';

interface Props {
  visible: boolean;
  initial?: SavedCard | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: SavedCardPayload, editId?: string) => void;
}

export const SavedCardFormModal = memo<Props>(({ visible, initial, saving, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initial?.id);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');
  const [nickname, setNickname] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [errors, setErrors] = useState<CardFormErrors>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    // Full card numbers are never returned by the API — always starts blank, even when editing.
    setCardNumber('');
    setCvv('');
    setExpiry(initial?.expiry ?? '');
    setHolderName(initial?.holderName ?? '');
    setNickname(initial?.nickname ?? '');
    setIsPrimary(initial?.isPrimary !== undefined ? Boolean(initial.isPrimary) : true);
    setErrors({});
  }, [initial, visible]);

  const digits = cardNumber.replace(/\D/g, '');
  const brand = useMemo(() => detectCardBrand(digits), [digits]);

  const submit = useCallback(() => {
    const nextErrors = validateCardForm({ isEditing, digits, brand, expiry, cvv, holderName });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // CVV is validated client-side only and never sent to the API.
    const payload: SavedCardPayload = {
      expiry: expiry.trim(),
      holderName: holderName.trim(),
      nickname: nickname.trim() || undefined,
      isPrimary,
    };
    if (digits) {
      payload.cardNumber = digits;
    }
    onSave(payload, initial?.id);
  }, [brand, cvv, digits, expiry, holderName, initial?.id, isEditing, isPrimary, nickname, onSave]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={peStyles.header}>
          <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Close">
            <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
          </Pressable>
          <Text style={peStyles.headerTitle}>{isEditing ? 'Edit Card' : 'Add Card Details'}</Text>
          <View style={peStyles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <Text style={peStyles.fieldHint}>
                Current card •••• {initial?.last4}. Enter a new number only if replacing it.
              </Text>
            ) : null}

            <TextInput
              value={cardNumber}
              onChangeText={value => setCardNumber(formatCardInput(value))}
              placeholder="Card No."
              placeholderTextColor={PE_COLORS.muted}
              keyboardType="number-pad"
              style={peStyles.addressField}
            />
            {errors.cardNumber ? (
              <Text style={peStyles.errorText}>{errors.cardNumber}</Text>
            ) : brand ? (
              <Text style={peStyles.fieldHint}>{brand}</Text>
            ) : null}

            <View style={peStyles.modalFieldRow}>
              <View style={peStyles.modalFieldRowItem}>
                <TextInput
                  value={expiry}
                  onChangeText={value => setExpiry(formatExpiryInput(value))}
                  placeholder="Valid Through (MM/YY)"
                  placeholderTextColor={PE_COLORS.muted}
                  keyboardType="number-pad"
                  style={peStyles.addressField}
                />
                {errors.expiry ? <Text style={peStyles.errorText}>{errors.expiry}</Text> : null}
              </View>
              <View style={peStyles.modalFieldRowItem}>
                <TextInput
                  value={cvv}
                  onChangeText={value => setCvv(value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  placeholderTextColor={PE_COLORS.muted}
                  keyboardType="number-pad"
                  secureTextEntry
                  style={peStyles.addressField}
                />
                {errors.cvv ? <Text style={peStyles.errorText}>{errors.cvv}</Text> : null}
              </View>
            </View>

            <TextInput
              value={holderName}
              onChangeText={setHolderName}
              placeholder="Name on card"
              placeholderTextColor={PE_COLORS.muted}
              style={peStyles.addressField}
            />
            {errors.holderName ? <Text style={peStyles.errorText}>{errors.holderName}</Text> : null}

            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Card Nickname (for easy identification)"
              placeholderTextColor={PE_COLORS.muted}
              style={peStyles.addressField}
            />

            <View style={[peStyles.defaultToggleRow, { justifyContent: 'flex-end' }]}>
              <Text style={peStyles.radioLabel}>Set as default</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={isPrimary ? PE_COLORS.primary : '#F9FAFB'}
                accessibilityLabel="Set as default card"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[peStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={[peStyles.submitBtn, saving ? peStyles.submitBtnDisabled : null]}
            onPress={submit}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save card details">
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={peStyles.submitText}>Save Details</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

SavedCardFormModal.displayName = 'SavedCardFormModal';
