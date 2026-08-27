import React, { memo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import AvatarIcon from '../../../../assets/icons/user.svg';
import { ProductSellerInfo } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

interface Props {
  seller: ProductSellerInfo;
  onViewAll?: () => void;
  onPressSeller?: (sellerId: string) => void;
}

export const SellerInfoCard = memo<Props>(({ seller, onViewAll, onPressSeller }) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatarFallback = !seller.avatar || avatarFailed;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={pdStyles.sectionTitle}>Posted by</Text>
        <Pressable onPress={onViewAll}>
          <Text style={{ color: '#2563EB', fontWeight: '700' }}>View All</Text>
        </Pressable>
      </View>
      <Pressable
        style={pdStyles.sellerRow}
        onPress={() => onPressSeller?.(seller.id)}
        disabled={!onPressSeller}
      >
        {showAvatarFallback ? (
          <View
            style={[
              pdStyles.sellerAvatar,
              { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
            ]}
          >
            <AvatarIcon width="100%" height="100%" />
          </View>
        ) : (
          <Image
            source={{ uri: seller.avatar }}
            style={pdStyles.sellerAvatar}
            onError={() => setAvatarFailed(true)}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#111827' }}>{seller.name}</Text>
          <Text style={{ color: '#6B7280', marginTop: 2 }}>{seller.role}</Text>
          {seller.postsCount > 0 || seller.followingCount > 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>
              Post {seller.postsCount} · Following {seller.followingCount}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});

SellerInfoCard.displayName = 'SellerInfoCard';
