import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CategoryApi } from '../../../data/api/categoryApi';
import { Category } from '../../../types/category.types';
import {
  getCategoryCardColor,
  getCategoryIcon,
  normalizeCategoryKey,
  resolveCategoryImageUrl,
} from '../../../utils/categoryIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { CategoryGridSkeleton } from '../skeletons/CategoryGridSkeleton';

const CATEGORY_IMAGE_SIZE = 26;

interface Props {
  onPressCategory?: (categoryId: string, categoryName: string) => void;
  selectedCategoryId?: string;
}

const CATEGORY_ICON_COLORS: Record<string, string> = {
  motors: '#D97706',
  automotive: '#D97706',
  property: '#2563EB',
  fashion: '#DB2777',
  fashionaccessories: '#DB2777',
  fashionaccesseries: '#DB2777',
  furniture: '#16A34A',
  furniturefixtures: '#16A34A',
  classifieds: '#EA580C',
  electronics: '#4F46E5',
  applianceselectronics: '#4F46E5',
  giveaways: '#B45309',
  sportsoutdoors: '#2563EB',
  beautyhealth: '#EA580C',
  anythingeverything: '#4F46E5',
  gadgets: '#DB2777',
  kidsstuff: '#16A34A',
};

const resolveIconColor = (slug: string, name: string, themeText: string): string =>
  CATEGORY_ICON_COLORS[normalizeCategoryKey(slug)] ??
  CATEGORY_ICON_COLORS[normalizeCategoryKey(name)] ??
  themeText;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryCard = memo<{
  category: Category;
  color: string;
  selected: boolean;
  onPress: () => void;
}>(({ category, color, selected, onPress }) => {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  // Same priority as Create Post's CategoryGridCard: a real uploaded image wins,
  // then an emoji, and only as a last resort a MaterialCommunityIcons glyph — either
  // the API's own `icon` (when it isn't a media path) or our curated fallback map.
  const imageUri = useMemo(() => resolveCategoryImageUrl(category), [category]);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);
  const onImageError = useCallback(() => setImageFailed(true), []);

  const iconName =
    category.icon && !category.icon.includes('/')
      ? category.icon
      : getCategoryIcon(category.slug, category.name);
  const iconColor = resolveIconColor(category.slug, category.name, theme.text);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.name}`}
      accessibilityState={{ selected }}
      style={[
        styles.card,
        {
          backgroundColor: color,
          borderColor: selected ? theme.primary + '55' : 'transparent',
          shadowColor: '#000',
          shadowOpacity: selected ? 0.14 : 0.08,
          shadowRadius: selected ? 12 : 8,
          elevation: selected ? 5 : 3,
        },
        animStyle,
      ]}
    >
      {selected ? (
        <View style={styles.selectedBadge} accessibilityLabel="Selected category">
          <Icon name="check" size={13} color="#FFFFFF" />
        </View>
      ) : null}

      {imageUri && !imageFailed ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.categoryIcon, { width: CATEGORY_IMAGE_SIZE, height: CATEGORY_IMAGE_SIZE }]}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          onError={onImageError}
          accessibilityIgnoresInvertColors
        />
      ) : category.emoji?.trim() ? (
        <Text style={[styles.categoryIcon, { fontSize: 24, lineHeight: 28 }]}>
          {category.emoji.trim()}
        </Text>
      ) : (
        <Icon name={iconName} size={24} color={iconColor} style={styles.categoryIcon} />
      )}
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
        {category.name}
      </Text>
    </AnimatedPressable>
  );
});

CategoryCard.displayName = 'CategoryCard';

export const CategoryGrid = memo<Props>(({ onPressCategory, selectedCategoryId }) => {
  const theme = useAppTheme();

  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: () => CategoryApi.getRootCategories(),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const renderCategory = useCallback(
    (category: Category, index: number) => (
      <CategoryCard
        key={category._id}
        category={category}
        color={getCategoryCardColor(index)}
        selected={selectedCategoryId === category._id}
        onPress={() => onPressCategory?.(category._id, category.name)}
      />
    ),
    [onPressCategory, selectedCategoryId],
  );

  if (isLoading) {
    return <CategoryGridSkeleton />;
  }

  if (isError) {
    return (
      <View style={styles.stateWrap}>
        <Text style={[styles.stateText, { color: theme.subText }]}>
          Could not load categories.
        </Text>
        <Pressable
          style={[styles.retryButton, { borderColor: theme.primary }]}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading categories"
        >
          {isFetching ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <Text style={[styles.retryText, { color: theme.primary }]}>Retry</Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (!categories.length) {
    return (
      <View style={styles.stateWrap}>
        <Text style={[styles.stateText, { color: theme.subText }]}>No categories available.</Text>
      </View>
    );
  }

  return <View style={styles.grid}>{categories.map(renderCategory)}</View>;
});

CategoryGrid.displayName = 'CategoryGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16
  },
  card: {
    width: '31%',
    minHeight: 104,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 3 },
  },
  categoryIcon: {
    alignSelf: 'flex-start',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stateWrap: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 88,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
