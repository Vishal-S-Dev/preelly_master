import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { ProductSellerInfo } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

interface Props {
  seller: ProductSellerInfo;
  onViewAll?: () => void;
}

export const SellerInfoCard = memo<Props>(({ seller, onViewAll }) => (
  <View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={pdStyles.sectionTitle}>Posted by</Text>
      <Pressable onPress={onViewAll}>
        <Text style={{ color: '#2563EB', fontWeight: '700' }}>View All</Text>
      </Pressable>
    </View>
    <View style={pdStyles.sellerRow}>
      <Image source={{ uri: seller.avatar }} style={pdStyles.sellerAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: '#111827' }}>{seller.name}</Text>
        <Text style={{ color: '#6B7280', marginTop: 2 }}>{seller.role}</Text>
        {seller.postsCount > 0 || seller.followingCount > 0 ? (
          <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>
            Post {seller.postsCount} · Following {seller.followingCount}
          </Text>
        ) : null}
      </View>
    </View>
  </View>
));

SellerInfoCard.displayName = 'SellerInfoCard';
