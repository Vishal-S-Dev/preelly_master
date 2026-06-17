import React, { memo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProductMultiAttribute } from '../../../types/product.types';
import { pdStyles } from './productDetailStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  attributes: ProductMultiAttribute[];
}

export const ProductFeaturesAccordion = memo<Props>(({ attributes }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View>
      {attributes.map(attribute => {
        const isOpen = openId === attribute.fieldKey;
        return (
          <View key={attribute.fieldKey}>
            <Pressable
              style={pdStyles.featureRow}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setOpenId(prev =>
                  prev === attribute.fieldKey ? null : attribute.fieldKey,
                );
              }}
            >
              <Text style={pdStyles.featureTitle}>{attribute.fieldTitle}</Text>
              <View style={pdStyles.featureBadge}>
                <Text style={pdStyles.featureBadgeText}>{attribute.count}</Text>
                <Icon
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#2563EB"
                />
              </View>
            </Pressable>
            {isOpen
              ? attribute.fieldValues.map(item => (
                  <Text
                    key={item}
                    style={{
                      color: '#4B5563',
                      fontSize: 13,
                      marginBottom: 6,
                      paddingLeft: 4,
                    }}
                  >
                    • {item}
                  </Text>
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
});

ProductFeaturesAccordion.displayName = 'ProductFeaturesAccordion';
