import React, { memo } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SavedCard } from '../../../../../types/profileEdit.types';
import { peStyles } from '../profileEditStyles';

interface Props {
  card: SavedCard;
  onSetPrimary: (id: string) => void;
  onEdit: (card: SavedCard) => void;
  onDelete: (id: string) => void;
}

/** Only the last 4 digits are ever stored — never render a fabricated first-4. */
const maskCardNumber = (last4: string): string => `XXXX XXXX XXXX ${last4 || '----'}`;

export const SavedCardCard = memo<Props>(({ card, onSetPrimary, onEdit, onDelete }) => (
  <View style={peStyles.bankCard}>
    <View style={peStyles.bankCardTop}>
      <View style={peStyles.bankCardTitleRow}>
        <Icon name="credit-card-outline" size={18} color="#111827" />
        <Text style={peStyles.bankCardTitle}>{card.nickname || card.brand}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={peStyles.bankCardFieldLabel}>Set as Primary</Text>
        <Switch
          value={card.isPrimary}
          disabled={card.isPrimary}
          onValueChange={() => onSetPrimary(card.id)}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={card.isPrimary ? '#2563EB' : '#F9FAFB'}
          accessibilityLabel={`Set ${card.nickname || card.brand} as primary card`}
        />
      </View>
    </View>

    <View style={peStyles.bankCardFieldsRow}>
      <View style={peStyles.bankCardFieldWrap}>
        <Text style={peStyles.bankCardFieldLabel}>Card No.</Text>
        <Text style={peStyles.bankCardFieldValue}>{maskCardNumber(card.last4)}</Text>
      </View>
      {card.expiry ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>Valid through</Text>
          <Text style={peStyles.bankCardFieldValue}>{card.expiry}</Text>
        </View>
      ) : null}
      {card.holderName ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>Name on card</Text>
          <Text style={peStyles.bankCardFieldValue}>{card.holderName}</Text>
        </View>
      ) : null}
      {card.nickname ? (
        <View style={peStyles.bankCardFieldWrap}>
          <Text style={peStyles.bankCardFieldLabel}>Card Nick Name</Text>
          <Text style={peStyles.bankCardFieldValue}>{card.nickname}</Text>
        </View>
      ) : null}
    </View>

    <View style={peStyles.addressActions}>
      <Pressable onPress={() => onEdit(card)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Edit</Text>
      </Pressable>
      <Pressable onPress={() => onDelete(card.id)} accessibilityRole="button">
        <Text style={peStyles.addressAction}>Delete</Text>
      </Pressable>
    </View>
  </View>
));

SavedCardCard.displayName = 'SavedCardCard';
