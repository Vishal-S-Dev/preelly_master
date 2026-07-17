import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category } from '../../../types/category.types';
import {
  getCategoryIcon,
  resolveCategoryBackgroundColor,
  resolveCategoryImageUrl,
} from '../../../utils/categoryIcons';
import { CreatePostStyles } from '../../hooks/useCreatePostStyles';

interface Props {
  category: Category;
  index: number;
  selected: boolean;
  onPress: () => void;
  styles: CreatePostStyles;
}

const CATEGORY_IMAGE_SIZE = 30;

export const CategoryGridCard = memo<Props>(({ category, index, selected, onPress, styles }) => {
  const imageUri = useMemo(() => resolveCategoryImageUrl(category), [category]);
  const backgroundColor = useMemo(
    () => resolveCategoryBackgroundColor(category, index),
    [category, index],
  );
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  const onImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  const fallbackIcon = category.icon && !category.icon.includes('/')
    ? category.icon
    : getCategoryIcon(category.slug, category.name);

  return (
    <Pressable
      style={[
        styles.categoryCard,
        { backgroundColor },
        selected && styles.categoryCardSelected,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select ${category.name}`}>
      {imageUri && !imageFailed ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: CATEGORY_IMAGE_SIZE,
            height: CATEGORY_IMAGE_SIZE,
            borderRadius: 8,
          }}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          onError={onImageError}
          accessibilityIgnoresInvertColors
        />
      ) : category.emoji?.trim() ? (
        <Text style={{ fontSize: 28, lineHeight: 32 }}>{category.emoji.trim()}</Text>
      ) : (
        <Icon name={fallbackIcon} size={28} color="#374151" />
      )}
      <Text style={styles.categoryTitle}>{category.name}</Text>
    </Pressable>
  );
});

CategoryGridCard.displayName = 'CategoryGridCard';
