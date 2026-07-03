import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductDetailView } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';
import GradientPriceBadge from '../common/GradientPriceBadge';

interface Props {
  detail: ProductDetailView;
}

export const ProductHeaderCard = memo<Props>(({ detail }) => {
  const { product, year, mileage, specsLabel, postedOnLabel, availability } = detail;
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
        <View style={pdStyles.availableBadge}>
          <Text style={pdStyles.availableText}>{availability}</Text>
        </View>
      </View>
      <Text style={pdStyles.productTitle}>{product.title}</Text>
      <View style={pdStyles.metaRow}>
        <View style={pdStyles.metaItem}>
          <Icon name="calendar-blank-outline" size={14} color="#6B7280" />
          <Text style={pdStyles.metaText}>{year}</Text>
        </View>
        <View style={pdStyles.metaItem}>
          <Icon name="speedometer" size={14} color="#6B7280" />
          <Text style={pdStyles.metaText}>{mileage}</Text>
        </View>
        <View style={pdStyles.metaItem}>
          <Icon name="earth" size={14} color="#6B7280" />
          <Text style={pdStyles.metaText}>{specsLabel}</Text>
        </View>
        <View style={pdStyles.metaItem}>
          <Icon name="calendar-check-outline" size={14} color="#6B7280" />
          <Text style={pdStyles.metaText}>{postedOnLabel}</Text>
        </View>
      </View>
    </View>
  );
});

ProductHeaderCard.displayName = 'ProductHeaderCard';
