import React, { memo, useCallback } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PropertyCategory, PropertySubcategory } from '../../../types/category.types';
import { CREATE_POST_PRIMARY, useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useAppTheme } from '../../hooks/useAppTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SubcategoryRowProps {
  subcategory: PropertySubcategory;
  selected: boolean;
  onPress: () => void;
}

const SubcategoryRow = memo<SubcategoryRowProps>(({ subcategory, selected, onPress }) => {
  const styles = useCreatePostStyles();
  const theme = useAppTheme();

  return (
    <Pressable
      style={[accordionStyles.subcategoryRow, selected && accordionStyles.subcategoryRowSelected]}
      onPress={onPress}
    >
      <View
        style={[
          accordionStyles.radioOuter,
          selected && accordionStyles.radioOuterSelected,
          { borderColor: selected ? CREATE_POST_PRIMARY : theme.subText + '66' },
        ]}
      >
        {selected ? <View style={accordionStyles.radioInner} /> : null}
      </View>
      <Text style={[styles.listItemText, accordionStyles.subcategoryText]}>{subcategory.name}</Text>
    </Pressable>
  );
});

SubcategoryRow.displayName = 'SubcategoryRow';

interface ParentSectionProps {
  category: PropertyCategory;
  expanded: boolean;
  selectedSubcategoryId?: string;
  onToggle: () => void;
  onSelectSubcategory: (subcategory: PropertySubcategory) => void;
}

const ParentSection = memo<ParentSectionProps>(
  ({ category, expanded, selectedSubcategoryId, onToggle, onSelectSubcategory }) => {
    const styles = useCreatePostStyles();
    const theme = useAppTheme();
    const childCount = category.subcategories.length;

    return (
      <View style={accordionStyles.section}>
        <Pressable
          style={[
            accordionStyles.parentRow,
            expanded && accordionStyles.parentRowExpanded,
            { borderColor: theme.subText + '33' },
          ]}
          onPress={onToggle}
        >
          <Text style={styles.listItemText}>{category.name}</Text>
          <View style={accordionStyles.parentRight}>
            {childCount > 0 ? (
              <View style={accordionStyles.countBadge}>
                <Text style={accordionStyles.countBadgeText}>{childCount}</Text>
              </View>
            ) : null}
            <Icon
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#9CA3AF"
            />
          </View>
        </Pressable>

        {expanded ? (
          <View style={accordionStyles.childrenWrap}>
            {childCount > 0 ? (
              category.subcategories.map(subcategory => (
                <SubcategoryRow
                  key={subcategory._id}
                  subcategory={subcategory}
                  selected={selectedSubcategoryId === subcategory._id}
                  onPress={() => onSelectSubcategory(subcategory)}
                />
              ))
            ) : (
              <Text style={[styles.stateText, accordionStyles.emptyChildrenText]}>
                No subcategories available
              </Text>
            )}
          </View>
        ) : null}
      </View>
    );
  },
);

ParentSection.displayName = 'ParentSection';

export interface PropertySubcategorySelection {
  parentId: string;
  subcategoryId: string;
  name: string;
}

interface Props {
  categories: PropertyCategory[];
  expandedCategoryId: string | null;
  selectedSubcategoryId?: string;
  onToggleExpand: (categoryId: string) => void;
  onSelectSubcategory: (selection: PropertySubcategorySelection) => void;
}

export const PropertySubcategoryAccordion = memo<Props>(
  ({ categories, expandedCategoryId, selectedSubcategoryId, onToggleExpand, onSelectSubcategory }) => {
    const handleToggle = useCallback(
      (categoryId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggleExpand(categoryId);
      },
      [onToggleExpand],
    );

    const handleSelect = useCallback(
      (parent: PropertyCategory, subcategory: PropertySubcategory) => {
        onSelectSubcategory({
          parentId: parent._id,
          subcategoryId: subcategory._id,
          name: subcategory.name,
        });
      },
      [onSelectSubcategory],
    );

    return (
      <View style={accordionStyles.container}>
        {categories.map(category => (
          <ParentSection
            key={category._id}
            category={category}
            expanded={expandedCategoryId === category._id}
            selectedSubcategoryId={selectedSubcategoryId}
            onToggle={() => handleToggle(category._id)}
            onSelectSubcategory={subcategory => handleSelect(category, subcategory)}
          />
        ))}
      </View>
    );
  },
);

PropertySubcategoryAccordion.displayName = 'PropertySubcategoryAccordion';

const accordionStyles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  section: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  parentRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  parentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: CREATE_POST_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  childrenWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderColor: '#C7D2FE',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
  },
  subcategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  subcategoryRowSelected: {
    backgroundColor: '#F5F7FF',
  },
  subcategoryText: {
    flex: 1,
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: CREATE_POST_PRIMARY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CREATE_POST_PRIMARY,
  },
  emptyChildrenText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
