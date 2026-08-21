import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductDetailView } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';
import GradientPriceBadge from '../common/GradientPriceBadge';
import { getProductFieldIcon } from '../../../utils/productFieldIcons';

interface Props {
  detail: ProductDetailView;
}

const AVAILABILITY_BADGE_STYLE: Record<string, typeof pdStyles.availableBadge> = {
  Sold: pdStyles.soldBadge,
  Unavailable: pdStyles.unavailableBadge,
  Available: pdStyles.availableBadge,
};

/** Keep the meta row compact — the full list already renders below via the overview/specs sections. */
const MAX_META_FIELDS = 4;

/** Hide fallback chips with no real value instead of showing an empty "—" placeholder. */
const hasValue = (value?: string): boolean => Boolean(value?.trim() && value.trim() !== '—');

const FALLBACK_ICONS = {
  year: 'calendar-blank-outline',
  mileage: 'speedometer',
  specsLabel: 'earth',
} as const;

export const ProductHeaderCard = memo<Props>(({ detail }) => {
  const { product, year, mileage, specsLabel, postedOnLabel, availability, productAttributes } = detail;
  const metaFields = useMemo(
    () =>
      productAttributes
        .filter(field => field.fieldTitle?.trim() && field.fieldValue?.trim())
        .slice(0, MAX_META_FIELDS),
    [productAttributes],
  );
  const fallbackFields = useMemo(
    () =>
      (
        [
          { key: 'year' as const, value: year },
          { key: 'mileage' as const, value: mileage },
          { key: 'specsLabel' as const, value: specsLabel },
        ]
      ).filter(field => hasValue(field.value)),
    [year, mileage, specsLabel],
  );
  //const priceLabel = `${product.currency} ${product.price.toLocaleString()}`;

  return (
    <View style={pdStyles.headerCard}>
      <View style={pdStyles.badgeRow}>
        {/*<View style={pdStyles.priceBadge}>
          <Text style={pdStyles.priceBadgeText}>{priceLabel}</Text>
        </View>*/}
        <GradientPriceBadge
          currency={product.currency}
          price={product.price}
          size="compact"
        />
        <View style={AVAILABILITY_BADGE_STYLE[availability] ?? pdStyles.availableBadge}>
          <Text style={pdStyles.availableText}>{availability}</Text>
        </View>
      </View>
      <Text style={pdStyles.productTitle}>{product.title}</Text>
      <View style={pdStyles.metaRow}>
        {metaFields.length > 0
          ? metaFields.map(field => (
              <View key={field.fieldKey} style={pdStyles.metaItem}>
                <Icon name={getProductFieldIcon(field.fieldKey, field.fieldTitle)} size={14} color="#6B7280" />
                <Text style={pdStyles.metaText}>{field.fieldValue}</Text>
              </View>
            ))
          : fallbackFields.map(field => (
              <View key={field.key} style={pdStyles.metaItem}>
                <Icon name={FALLBACK_ICONS[field.key]} size={14} color="#6B7280" />
                <Text style={pdStyles.metaText}>{field.value}</Text>
              </View>
            ))}
        <View style={pdStyles.metaItem}>
          <Icon name="calendar-check-outline" size={14} color="#6B7280" />
          <Text style={pdStyles.metaText}>{postedOnLabel}</Text>
        </View>
      </View>
    </View>
  );
});

ProductHeaderCard.displayName = 'ProductHeaderCard';
