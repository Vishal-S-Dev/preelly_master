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
import { BankAccount, BankAccountPayload } from '../../../../../types/profileEdit.types';
import { PE_COLORS, peStyles } from '../profileEditStyles';

interface Props {
  visible: boolean;
  initial?: BankAccount | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: BankAccountPayload, editId?: string) => void;
}

export const BankAccountFormModal = memo<Props>(({ visible, initial, saving, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initial?.id);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errors, setErrors] = useState<{ bankName?: string; accountNumber?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setBankName(initial?.bankName ?? '');
    setAccountNumber(initial?.accountNumber ?? '');
    setIban(initial?.iban ?? '');
    setSwift(initial?.swift ?? '');
    setBranchName(initial?.branchName ?? '');
    setIsPrimary(Boolean(initial?.isPrimary));
    setErrors({});
  }, [initial, visible]);

  const canSubmit = useMemo(
    () => Boolean(bankName.trim() && accountNumber.trim().length >= 4),
    [accountNumber, bankName],
  );

  const submit = useCallback(() => {
    const nextErrors: { bankName?: string; accountNumber?: string } = {};
    if (!bankName.trim()) {
      nextErrors.bankName = 'Bank name is required';
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 4) {
      nextErrors.accountNumber = 'Enter a valid account number';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave(
      {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim() || undefined,
        swift: swift.trim().toUpperCase() || undefined,
        branchName: branchName.trim() || undefined,
        isPrimary,
      },
      initial?.id,
    );
  }, [accountNumber, bankName, branchName, iban, initial?.id, isPrimary, onSave, swift]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View style={peStyles.header}>
          <Pressable onPress={onClose} style={peStyles.headerBtn} accessibilityLabel="Close">
            <Icon name="arrow-left" size={24} color={PE_COLORS.text} />
          </Pressable>
          <Text style={peStyles.headerTitle}>{isEditing ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
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
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="Bank name"
              placeholderTextColor={PE_COLORS.muted}
              style={peStyles.addressField}
            />
            {errors.bankName ? <Text style={peStyles.errorText}>{errors.bankName}</Text> : null}

            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Account number"
              placeholderTextColor={PE_COLORS.muted}
              keyboardType="number-pad"
              style={peStyles.addressField}
            />
            {errors.accountNumber ? <Text style={peStyles.errorText}>{errors.accountNumber}</Text> : null}

            <TextInput
              value={iban}
              onChangeText={setIban}
              placeholder="IBAN (optional)"
              placeholderTextColor={PE_COLORS.muted}
              autoCapitalize="characters"
              style={peStyles.addressField}
            />
            <TextInput
              value={swift}
              onChangeText={setSwift}
              placeholder="SWIFT / BIC (optional)"
              placeholderTextColor={PE_COLORS.muted}
              autoCapitalize="characters"
              style={peStyles.addressField}
            />
            <TextInput
              value={branchName}
              onChangeText={setBranchName}
              placeholder="Branch name (optional)"
              placeholderTextColor={PE_COLORS.muted}
              style={peStyles.addressField}
            />

            <View style={peStyles.defaultToggleRow}>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={isPrimary ? PE_COLORS.primary : '#F9FAFB'}
                accessibilityLabel="Set as primary bank account"
              />
              <Text style={peStyles.radioLabel}>Set as Primary</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[peStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={[peStyles.submitBtn, saving || !canSubmit ? peStyles.submitBtnDisabled : null]}
            onPress={submit}
            disabled={saving || !canSubmit}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Update bank account' : 'Add bank account'}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={peStyles.submitText}>{isEditing ? 'Update Account' : 'Add Account'}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

BankAccountFormModal.displayName = 'BankAccountFormModal';
