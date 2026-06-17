import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CalendarIcon from '../../../../assets/icons/calender.svg';
import KmIcon from '../../../../assets/icons/km.svg';
import { ProductQuickViewData } from './productQuickViewTypes';
import { qvStyles } from './productQuickViewStyles';

interface Props {
  data: ProductQuickViewData;
  onTitlePress?: () => void;
}

export const ProductMetaInfo: React.FC<Props> = ({ data, onTitlePress }) => {
  const { product } = data;

  return (
    <>
      <View style={qvStyles.headerRow}>
        <Pressable onPress={onTitlePress} disabled={!onTitlePress} style={{ flex: 1 }}>
          <Text style={qvStyles.title}>{product.title}</Text>
        </Pressable>
        <View style={qvStyles.pricePill}>
          <Text style={qvStyles.priceText}>
            {product.currency} {product.price.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={qvStyles.metaRow}>
        <View style={qvStyles.metaItem}>
          <CalendarIcon width={14} height={14} />
          <Text style={qvStyles.metaText}>{data.year}</Text>
        </View>
        <View style={qvStyles.metaItem}>
          <KmIcon width={14} height={14} />
          <Text style={qvStyles.metaText}>{data.mileage}</Text>
        </View>
        <View style={qvStyles.metaItem}>
          <Icon name="earth" size={14} color="#6B7280" />
          <Text style={qvStyles.metaText}>{data.specsLabel}</Text>
        </View>
        <View style={qvStyles.availablePill}>
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
