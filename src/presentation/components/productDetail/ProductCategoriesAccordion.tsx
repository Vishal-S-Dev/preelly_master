import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductCategoryItem } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

interface Props {
  categories: ProductCategoryItem[];
}

export const ProductCategoriesAccordion = memo<Props>(({ categories }) => (
  <View>
    <Text style={pdStyles.sectionTitle}>Categories</Text>
    {categories.map(category => (
      <Pressable key={category.id} style={pdStyles.categoryRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name={category.icon} size={20} color="#6B7280" />
          <Text style={{ fontWeight: '600', color: '#111827', fontSize: 15 }}>{category.title}</Text>
        </View>
        <Icon name="plus-circle" size={22} color="#2563EB" />
      </Pressable>
    ))}
  </View>
));

ProductCategoriesAccordion.displayName = 'ProductCategoriesAccordion';
