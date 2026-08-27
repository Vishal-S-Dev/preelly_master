import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const scrollViewRef = useRef<ScrollView>(null);
  const cardNumberInputRef = useRef<TextInput>(null);
  const expiryInputRef = useRef<TextInput>(null);
  const cvvInputRef = useRef<TextInput>(null);
  const holderNameInputRef = useRef<TextInput>(null);
  const nicknameInputRef = useRef<TextInput>(null);
  // y-offset of each field within the ScrollView's content, captured via `onLayout` below —
  // used to scroll the first invalid field into view on a failed submit.
  const fieldOffsetsRef = useRef<Partial<Record<keyof CardFormErrors, number>>>({});

  // Defensive guard against a double-tap firing `onSave` twice before the parent's `saving`
  // prop has a chance to flip true and disable the button (state updates aren't synchronous
  // with the tap that triggered them).
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!saving) {
      isSubmittingRef.current = false;
    }
  }, [saving]);

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
    isSubmittingRef.current = false;
  }, [initial, visible]);

  const digits = cardNumber.replace(/\D/g, '');
  const brand = useMemo(() => detectCardBrand(digits), [digits]);

  const focusFirstInvalidField = useCallback((nextErrors: CardFormErrors) => {
    const fieldOrder: Array<{ key: keyof CardFormErrors; ref: React.RefObject<TextInput | null> }> = [
      { key: 'cardNumber', ref: cardNumberInputRef },
      { key: 'expiry', ref: expiryInputRef },
      { key: 'cvv', ref: cvvInputRef },
      { key: 'holderName', ref: holderNameInputRef },
    ];
    const firstInvalid = fieldOrder.find(field => nextErrors[field.key]);
    if (!firstInvalid) {
      return;
    }
    firstInvalid.ref.current?.focus();
    const offset = fieldOffsetsRef.current[firstInvalid.key];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, offset - 16), animated: true });
    }
  }, []);

  const submit = useCallback(() => {
    if (isSubmittingRef.current || saving) {
      return;
    }

    const nextErrors = validateCardForm({ isEditing, digits, brand, expiry, cvv, holderName });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors);
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
    isSubmittingRef.current = true;
    onSave(payload, initial?.id);
  }, [
    brand,
    cvv,
    digits,
    expiry,
    focusFirstInvalidField,
    holderName,
    initial?.id,
    isEditing,
    isPrimary,
    nickname,
    onSave,
    saving,
  ]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={peStyles.screen} edges={['top']}>
        <View style={peStyles.header}>
          <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Close">
            <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
          </Pressable>
          <Text style={peStyles.headerTitle}>{isEditing ? 'Edit Card' : 'Add Card Details'}</Text>
          <View style={peStyles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={peStyles.flex1}
          // RN's `Modal` renders in its own native window on Android, so the activity's
          // `windowSoftInputMode="adjustResize"` doesn't reach it — `behavior="padding"` is a
          // no-op there. `"height"` shrinks the view itself and reliably keeps the CVV/expiry
          // row above the keyboard on both platforms.
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={peStyles.cardFormScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <Text style={peStyles.fieldHint}>
                Current card •••• {initial?.last4}. Enter a new number only if replacing it.
              </Text>
            ) : null}

            <View onLayout={e => (fieldOffsetsRef.current.cardNumber = e.nativeEvent.layout.y)}>
              <TextInput
                ref={cardNumberInputRef}
                value={cardNumber}
                onChangeText={value => setCardNumber(formatCardInput(value))}
                placeholder="Card No."
                placeholderTextColor={PE_COLORS.muted}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => expiryInputRef.current?.focus()}
                style={peStyles.addressField}
                accessibilityLabel="Card number"
              />
              {errors.cardNumber ? (
                <Text style={peStyles.errorText}>{errors.cardNumber}</Text>
              ) : brand ? (
                <Text style={peStyles.fieldHint}>{brand}</Text>
              ) : null}
            </View>

            <View style={peStyles.modalFieldRow}>
              <View
                style={peStyles.modalFieldRowItem}
                onLayout={e => (fieldOffsetsRef.current.expiry = e.nativeEvent.layout.y)}>
                <TextInput
                  ref={expiryInputRef}
                  value={expiry}
                  onChangeText={value => setExpiry(formatExpiryInput(value))}
                  placeholder="Valid Through (MM/YY)"
                  placeholderTextColor={PE_COLORS.muted}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => cvvInputRef.current?.focus()}
                  style={peStyles.addressField}
                  accessibilityLabel="Valid through, month and year"
                />
                {errors.expiry ? <Text style={peStyles.errorText}>{errors.expiry}</Text> : null}
              </View>
              <View
                style={peStyles.modalFieldRowItem}
                onLayout={e => (fieldOffsetsRef.current.cvv = e.nativeEvent.layout.y)}>
                <TextInput
                  ref={cvvInputRef}
                  value={cvv}
                  onChangeText={value => setCvv(value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV (optional)"
                  placeholderTextColor={PE_COLORS.muted}
                  keyboardType="number-pad"
                  secureTextEntry
                  returnKeyType="next"
                  onSubmitEditing={() => holderNameInputRef.current?.focus()}
                  style={peStyles.addressField}
                  accessibilityLabel="CVV, optional"
                />
                {errors.cvv ? <Text style={peStyles.errorText}>{errors.cvv}</Text> : null}
              </View>
            </View>

            <View onLayout={e => (fieldOffsetsRef.current.holderName = e.nativeEvent.layout.y)}>
              <TextInput
                ref={holderNameInputRef}
                value={holderName}
                onChangeText={setHolderName}
                placeholder="Name on card"
                placeholderTextColor={PE_COLORS.muted}
                returnKeyType="next"
                onSubmitEditing={() => nicknameInputRef.current?.focus()}
                style={peStyles.addressField}
                accessibilityLabel="Name on card"
              />
              {errors.holderName ? <Text style={peStyles.errorText}>{errors.holderName}</Text> : null}
            </View>

            <TextInput
              ref={nicknameInputRef}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Card Nickname (for easy identification)"
              placeholderTextColor={PE_COLORS.muted}
              returnKeyType="done"
              onSubmitEditing={submit}
              style={peStyles.addressField}
              accessibilityLabel="Card nickname, optional"
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
