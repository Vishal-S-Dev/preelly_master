import React, { memo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import { pdStyles } from './productDetailStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  description: string;
  hideTitle?: boolean;
}

export const ProductDescription = memo<Props>(({ title, description, hideTitle = false }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = description.length > 160 ? `${description.slice(0, 160)}...` : description;

  return (
    <View>
      {!hideTitle ? (
        <Text style={[pdStyles.sectionTitle, { marginBottom: 8 }]}>{title}</Text>
      ) : null}
      <Text style={{ color: '#4B5563', lineHeight: 22, fontSize: 14 }}>
        {expanded ? description : preview}
      </Text>
      {description.length > 160 ? (
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(prev => !prev);
          }}>
          <Text style={pdStyles.readMore}>{expanded ? 'Read Less' : 'Read More'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

ProductDescription.displayName = 'ProductDescription';
