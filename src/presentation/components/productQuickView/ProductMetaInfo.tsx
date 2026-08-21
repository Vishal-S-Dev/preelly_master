import React, { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CalendarIcon from '../../../../assets/icons/calender.svg';
import KmIcon from '../../../../assets/icons/km.svg';
import { ProductQuickViewData } from './productQuickViewTypes';
import { qvStyles } from './productQuickViewStyles';
import GradientPriceBadge from '../common/GradientPriceBadge';
import { getProductFieldIcon } from '../../../utils/productFieldIcons';

interface Props {
  data: ProductQuickViewData;
  onTitlePress?: () => void;
}

const AVAILABILITY_PILL_STYLE = {
  Available: qvStyles.availablePill,
  Sold: qvStyles.soldPill,
  Reserved: qvStyles.reservedPill,
} as const;

/** Keep the meta row compact — the full list already renders below via ProductSpecificationGrid. */
const MAX_META_FIELDS = 4;

/** Hide fallback chips with no real value instead of showing an empty "—" placeholder. */
const hasValue = (value?: string): boolean => Boolean(value?.trim() && value.trim() !== '—');

export const ProductMetaInfo: React.FC<Props> = ({ data, onTitlePress }) => {
  const { product } = data;
  const metaFields = useMemo(
    () =>
      data.quickViewData
        .filter(field => field.fieldTitle?.trim() && field.fieldValue?.trim())
        .slice(0, MAX_META_FIELDS),
    [data.quickViewData],
  );
  const fallbackFields = useMemo(
    () =>
      [
        { key: 'year', icon: CalendarIcon, value: data.year },
        { key: 'mileage', icon: KmIcon, value: data.mileage },
        { key: 'specsLabel', icon: null, value: data.specsLabel },
      ].filter(field => hasValue(field.value)),
    [data.year, data.mileage, data.specsLabel],
  );

  return (
    <>
      <View style={qvStyles.headerRow}>
        <Pressable
          onPress={onTitlePress}
          disabled={!onTitlePress}
          style={{ flex: 1 }}
        >
          <Text style={qvStyles.title}>{product.title}</Text>
        </Pressable>
        {/*<View style={qvStyles.pricePill}>
          <Text style={qvStyles.priceText}>
            {product.currency} {product.price.toLocaleString()}
          </Text>
        </View>*/}
        <GradientPriceBadge
          currency={product.currency}
          price={product.price}
          size="compact"
        />
      </View>

      <View style={qvStyles.metaRow}>
        {metaFields.length > 0
          ? metaFields.map(field => (
              <View key={field.fieldKey} style={qvStyles.metaItem}>
                <Icon name={getProductFieldIcon(field.fieldKey, field.fieldTitle)} size={14} color="#6B7280" />
                <Text style={qvStyles.metaText}>{field.fieldValue}</Text>
              </View>
            ))
          : fallbackFields.map(field => (
              <View key={field.key} style={qvStyles.metaItem}>
                {field.icon ? (
                  <field.icon width={14} height={14} />
                ) : (
                  <Icon name="earth" size={14} color="#6B7280" />
                )}
                <Text style={qvStyles.metaText}>{field.value}</Text>
              </View>
            ))}
        <View style={AVAILABILITY_PILL_STYLE[data.availability]}>
          <Text style={qvStyles.availableText}>{data.availability}</Text>
        </View>
      </View>

      <View style={qvStyles.seenRow}>
        <View style={qvStyles.seenLeft}>
          <Image
            source={{
              uri: product.user?.avatar ?? 'https://i.pravatar.cc/200?img=12',
            }}
            style={qvStyles.seenAvatar}
          />
          <Text style={qvStyles.seenText} numberOfLines={2}>
            Seen by <Text style={qvStyles.seenBold}>{data.seenByName}</Text> and{' '}
            {data.seenByOthers} others
          </Text>
        </View>
        <Text style={qvStyles.postedText}>Posted On: {data.postedOnLabel}</Text>
      </View>
    </>
  );
};
