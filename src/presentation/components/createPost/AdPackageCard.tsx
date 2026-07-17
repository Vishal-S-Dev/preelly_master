import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AdPackage } from '../../../types/package.types';
import { PLACE_AD_COLORS, placeAdStyles } from '../../screens/createPost/placeAnAdStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Watermark art from `assets/icons/preelly_element.svg` (embedded PNG extract). */
const PREELLY_ELEMENT = require('../../../../assets/icons/preelly_element.png');

interface Props {
  item: AdPackage;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Display price like the reference (whole AED amounts). */
export const formatPackageAmount = (amount: number): string => {
  const rounded = Math.round(amount);
  return rounded.toLocaleString('en-US');
};

export const AdPackageCard = memo<Props>(({ item, selected, onSelect }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onSelect(item.id)}
      onPressIn={() => {
        scale.value = withSpring(0.985, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14 });
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.packageName} package, AED ${formatPackageAmount(item.packageAmount)}`}
      style={[placeAdStyles.card, selected && placeAdStyles.cardSelected, animStyle]}
    >
      <View style={placeAdStyles.cardHeader}>
        <View
          style={[
            placeAdStyles.radioOuter,
            selected && placeAdStyles.radioOuterSelected,
          ]}
        >
          {selected ? <View style={placeAdStyles.radioInner} /> : null}
        </View>
        <Text style={placeAdStyles.packageName}>{item.packageName}</Text>
        {item.isRecommended ? (
          <View style={placeAdStyles.recommendedBadge}>
            <Text style={placeAdStyles.recommendedText}>RECOMMENDED</Text>
          </View>
        ) : null}
      </View>

      <View style={placeAdStyles.priceBlock}>
        <View style={placeAdStyles.doodleWrap} pointerEvents="none">
          <Image
            source={PREELLY_ELEMENT}
            style={placeAdStyles.doodleImage}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={placeAdStyles.priceRow}>
          <Text style={placeAdStyles.currency}>AED</Text>
          <Text style={placeAdStyles.amount}>
            {formatPackageAmount(item.packageAmount)}
          </Text>
          {item.isVatApplicable ? (
            <Text style={placeAdStyles.vat}>+VAT</Text>
          ) : null}
        </View>
      </View>

      <View style={placeAdStyles.divider} />

      {item.packageFeatures.map((feature, index) => (
        <View key={`${item.id}_f_${index}`} style={placeAdStyles.featureRow}>
          <View style={placeAdStyles.checkWrap}>
            <Icon name="check" size={13} color={PLACE_AD_COLORS.check} />
          </View>
          <Text style={placeAdStyles.featureText}>{feature}</Text>
        </View>
      ))}
    </AnimatedPressable>
  );
});

AdPackageCard.displayName = 'AdPackageCard';
