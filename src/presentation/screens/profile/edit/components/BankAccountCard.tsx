import React, { memo } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BankAccount } from '../../../../../types/profileEdit.types';
import { peStyles } from '../profileEditStyles';

interface Props {
  account: BankAccount;
  onSetPrimary: (id: string) => void;
  onEdit: (account: BankAccount) => void;
  onDelete: (id: string) => void;
}

export const BankAccountCard = memo<Props>(({ account, onSetPrimary, onEdit, onDelete }) => (
  <View style={peStyles.bankCard}>
    <View style={peStyles.bankCardTop}>
      <View style={peStyles.bankCardTitleRow}>
        <Icon name="bank-outline" size={18} color="#111827" />
        <Text style={peStyles.bankCardTitle}>{account.bankName}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={peStyles.bankCardFieldLabel}>Set as Primary</Text>
        <Switch
          value={account.isPrimary}
          disabled={account.isPrimary}
          onValueChange={() => onSetPrimary(account.id)}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={account.isPrimary ? '#2563EB' : '#F9FAFB'}
          accessibilityLabel={`Set ${account.bankName} as primary bank account`}
        />
      </View>
    </View>

    <View style={peStyles.bankCardFieldsRow}>
      <View style={peStyles.bankCardFieldWrap}>
        <Text style={peStyles.bankCardFieldLabel}>Account No.</Text>
        <Text style={peStyles.bankCardFieldValue}>{account.accountNumber}</Text>
      </View>
      {account.swift ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>SWIFT/BIC Code</Text>
          <Text style={peStyles.bankCardFieldValue}>{account.swift}</Text>
        </View>
      ) : null}
      {account.iban ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>IBAN</Text>
          <Text style={peStyles.bankCardFieldValue}>{account.iban}</Text>
        </View>
      ) : null}
      {account.branchName ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>Branch Name</Text>
          <Text style={peStyles.bankCardFieldValue}>{account.branchName}</Text>
        </View>
      ) : null}
    </View>

    <View style={peStyles.addressActions}>
      <Pressable onPress={() => onEdit(account)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Edit</Text>
      </Pressable>
      <Pressable onPress={() => onDelete(account.id)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Delete</Text>
      </Pressable>
    </View>
  </View>
));

BankAccountCard.displayName = 'BankAccountCard';
