import React, { memo } from 'react';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { pdStyles } from './productDetailStyles';

interface Props {
  title: string;
  address: string;
  onShowMap?: () => void;
  hideTitle?: boolean;
}

export const ProductLocationCard = memo<Props>(({ title, address, onShowMap, hideTitle = false }) => (
  <View>
    {!hideTitle ? <Text style={pdStyles.sectionTitle}>Location</Text> : null}
    <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }}>{title}</Text>
    <ImageBackground
      source={{ uri: 'https://picsum.photos/seed/map-preview/900/400' }}
      style={pdStyles.mapCard}
      imageStyle={{ opacity: 0.85 }}>
      <Pressable style={pdStyles.mapBtn} onPress={onShowMap}>
        <Icon name="map-marker" size={18} color="#2563EB" />
        <Text style={{ color: '#2563EB', fontWeight: '700' }}>Show Map</Text>
      </Pressable>
    </ImageBackground>
    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>{address}</Text>
  </View>
));

ProductLocationCard.displayName = 'ProductLocationCard';
