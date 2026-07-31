import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreatePostStore } from '../../../store/createPostStore';
import { Category } from '../../../types/category.types';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { categoryHasChildren } from '../../../utils/categoryHasChildren';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { SubcategoryListSkeleton } from '../../components/createPost/SubcategoryListSkeleton';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useSubcategories } from '../../hooks/useSubcategories';

// NOTE: Property / classifieds nested accordion flows temporarily disabled.
// Use unified /api/categories?parent_id= tree with isChild instead.
// import { isClassifiedsCategory } from '../../../utils/isClassifiedsCategory';
// import { isPropertyCategory } from '../../../utils/isPropertyCategory';
// import {
//   PropertySubcategoryAccordion,
//   PropertySubcategorySelection,
// } from '../../components/createPost/PropertySubcategoryAccordion';
// import { useClassifiedsCategories } from '../../hooks/useClassifiedsCategories';
// import { usePropertyCategories } from '../../hooks/usePropertyCategories';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostSubcategory'>;

export const SubcategorySelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const styles = useCreatePostStyles();
  const { setSubcategory } = useCreatePostStore();

  const parentId = route.params.parentId;
  const headerTitle = route.params.title;

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useSubcategories(parentId);

  // --- Commented: property / classifieds special-case APIs ---
  // const isProperty = isPropertyCategory(categoryName);
  // const isClassifieds = isClassifiedsCategory(categoryName);
  // const isNestedCategory = isProperty || isClassifieds;
  // const { data: propertyCategories = [], ... } = usePropertyCategories(isProperty);
  // const { data: classifiedsCategories = [], ... } = useClassifiedsCategories(isClassifieds);

  const onSelect = useCallback(
    (item: Category) => {
      if (categoryHasChildren(item)) {
        // Nested level — same subcategory UI with this item as parent
        navigation.push('CreatePostSubcategory', {
          parentId: item._id,
          title: item.name,
        });
        return;
      }

      // Leaf — continue create-post media step
      setSubcategory(item._id, item.name);
      navigation.navigate('CreatePostMediaStep');
    },
    [navigation, setSubcategory],
  );

  const renderItem: ListRenderItem<Category> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.subcategoryRow}
        onPress={() => onSelect(item)}
        accessibilityRole="button"
        accessibilityLabel={item.name}>
        <Text style={styles.subcategoryRowText}>{item.name}</Text>
      </Pressable>
    ),
    [onSelect, styles.subcategoryRow, styles.subcategoryRowText],
  );

  const keyExtractor = useCallback((item: Category) => item._id, []);

  const ItemSeparator = useCallback(
    () => <View style={styles.subcategorySeparator} />,
    [styles.subcategorySeparator],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <SubcategoryListSkeleton />;
    }
    if (isError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Unable to load subcategories</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateTitle}>No subcategories available</Text>
      </View>
    );
  }, [isError, isLoading, refetch, styles]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={headerTitle}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={isLoading || isError ? [] : items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          styles.subcategoryListContent,
          (isLoading || isError || items.length === 0) && styles.subcategoryListContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};
