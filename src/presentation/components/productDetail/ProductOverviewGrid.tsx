import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { ProductAttribute } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

interface Props {
  attributes: ProductAttribute[];
}

export const ProductOverviewGrid = memo<Props>(({ attributes }) => {
  if (!attributes.length) {
    return null;
  }

  return (
    <View style={pdStyles.overviewGrid}>
      {attributes.map(attribute => (
        <View
          key={attribute.fieldKey || attribute.fieldTitle}
          style={pdStyles.overviewCell}
        >
          <Text style={pdStyles.overviewLabel}>{attribute.fieldTitle}</Text>
          <Text style={pdStyles.overviewValue}>{attribute.fieldValue}</Text>
        </View>
      ))}
    </View>
  );
});

ProductOverviewGrid.displayName = 'ProductOverviewGrid';
