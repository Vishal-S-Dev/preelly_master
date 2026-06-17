import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  CREATE_POST_CATEGORIES,
  CREATE_POST_SUBCATEGORIES,
} from '../../../constants/createPostConstants';
import { CreatePostSubcategory } from '../../../types/createPost.types';
import { useAppTheme } from '../../hooks/useAppTheme';

const ACCORDION_BORDER = '#E5E7EB';
const ICON_COLUMN_WIDTH = 28;
const HEADER_GAP = 12;
const SUBCATEGORY_INDENT = ICON_COLUMN_WIDTH + HEADER_GAP;

interface Props {
  onPressSubcategory?: (categoryId: string, subcategoryId: string, label: string) => void;
}

const ToggleButton = memo<{ expanded: boolean; color: string }>(({ expanded, color }) => {
  const plusOpacity = useSharedValue(expanded ? 0 : 1);
  const minusOpacity = useSharedValue(expanded ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    plusOpacity.value = withTiming(expanded ? 0 : 1, { duration: 200 });
    minusOpacity.value = withTiming(expanded ? 1 : 0, { duration: 200 });
    scale.value = withTiming(expanded ? 1 : 1, { duration: 200 });
  }, [expanded, minusOpacity, plusOpacity, scale]);

  const plusStyle = useAnimatedStyle(() => ({
    opacity: plusOpacity.value,
    transform: [{ scale: scale.value }],
  }));
  const minusStyle = useAnimatedStyle(() => ({
    opacity: minusOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.toggleButton, { backgroundColor: color }]}>
      <Animated.View style={[styles.toggleIconLayer, plusStyle]}>
        <Icon name="plus" size={18} color="#FFFFFF" />
      </Animated.View>
      <Animated.View style={[styles.toggleIconLayer, minusStyle]}>
        <Icon name="minus" size={18} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
});

ToggleButton.displayName = 'ToggleButton';

const SubcategoryRow = memo<{
  subcategory: CreatePostSubcategory;
  accentColor: string;
  onPress: () => void;
}>(({ subcategory, accentColor, onPress }) => (
  <Pressable
    style={styles.subRow}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={subcategory.name}
    accessibilityHint="Search in this subcategory"
  >
    <Text style={[styles.subText, { color: accentColor }]} numberOfLines={2}>
      {subcategory.name}
    </Text>
    <Icon name="arrow-right" size={16} color={accentColor} />
  </Pressable>
));

SubcategoryRow.displayName = 'SubcategoryRow';

const AccordionRow = memo<{
  categoryId: string;
  title: string;
  icon: string;
  expanded: boolean;
  accentColor: string;
  textColor: string;
  onToggle: () => void;
  children: React.ReactNode;
  showDivider: boolean;
}>(({ title, icon, expanded, accentColor, textColor, onToggle, children, showDivider }) => (
  <View>
    {showDivider ? <View style={styles.divider} /> : null}
    <Pressable
      onPress={onToggle}
      style={styles.rowHeader}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${title} category`}
      accessibilityHint="Expands or collapses subcategories"
    >
      <Icon name={icon} size={22} color={textColor} style={styles.categoryIcon} />
      <Text style={[styles.rowTitle, { color: textColor }]} numberOfLines={2}>
        {title}
      </Text>
      <ToggleButton expanded={expanded} color={accentColor} />
    </Pressable>
    {expanded ? (
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(160)}
        layout={LinearTransition.springify().damping(20).stiffness(180)}
        style={styles.rowBody}
      >
        {children}
      </Animated.View>
    ) : null}
  </View>
));

AccordionRow.displayName = 'AccordionRow';

export const AccordionCategory = memo<Props>(({ onPressSubcategory }) => {
  const theme = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = useCallback((categoryId: string) => {
    setExpandedId(prev => (prev === categoryId ? null : categoryId));
  }, []);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(180)}
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderColor: ACCORDION_BORDER,
        },
      ]}
    >
      <Text style={[styles.headerTitle, { color: theme.text }]} accessibilityRole="header">
        Categories
      </Text>

      {CREATE_POST_CATEGORIES.map((category, index) => {
        const subcategories = CREATE_POST_SUBCATEGORIES[category.id] ?? [];
        const expanded = expandedId === category.id;

        return (
          <AccordionRow
            key={category.id}
            categoryId={category.id}
            title={category.name}
            icon={category.icon}
            expanded={expanded}
            accentColor={theme.primary}
            textColor={theme.text}
            onToggle={() => toggle(category.id)}
            showDivider={index > 0}
          >
            {subcategories.map(sub => (
              <SubcategoryRow
                key={sub.id}
                subcategory={sub}
                accentColor={theme.primary}
                onPress={() => onPressSubcategory?.(category.id, sub.id, sub.name)}
              />
            ))}
          </AccordionRow>
        );
      })}
    </Animated.View>
  );
});

AccordionCategory.displayName = 'AccordionCategory';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ACCORDION_BORDER,
    marginVertical: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: HEADER_GAP,
  },
  categoryIcon: {
    width: ICON_COLUMN_WIDTH,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  toggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    paddingLeft: SUBCATEGORY_INDENT,
    paddingBottom: 10,
    gap: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    gap: 12,
  },
  subText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});
