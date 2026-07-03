import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { isClassifiedsCategory } from '../../../utils/isClassifiedsCategory';
import { isPropertyCategory } from '../../../utils/isPropertyCategory';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import {
  PropertySubcategoryAccordion,
  PropertySubcategorySelection,
} from '../../components/createPost/PropertySubcategoryAccordion';
import { SubcategoryListSkeleton } from '../../components/createPost/SubcategoryListSkeleton';
import { useClassifiedsCategories } from '../../hooks/useClassifiedsCategories';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { usePropertyCategories } from '../../hooks/usePropertyCategories';
import { useSubcategories } from '../../hooks/useSubcategories';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostSubcategory'>;

export const SubcategorySelectionScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryId, categoryName, subcategoryId, setSubcategory, setPropertySubcategory } =
    useCreatePostStore();

  const isProperty = isPropertyCategory(categoryName);
  const isClassifieds = isClassifiedsCategory(categoryName);
  const isNestedCategory = isProperty || isClassifieds;

  const {
    data: propertyCategories = [],
    isLoading: isPropertyLoading,
    isError: isPropertyError,
    refetch: refetchProperty,
  } = usePropertyCategories(isProperty);

  const {
    data: classifiedsCategories = [],
    isLoading: isClassifiedsLoading,
    isError: isClassifiedsError,
    refetch: refetchClassifieds,
  } = useClassifiedsCategories(isClassifieds);

  const {
    data: standardItems = [],
    isLoading: isStandardLoading,
    isError: isStandardError,
    refetch: refetchStandard,
  } = useSubcategories(isNestedCategory ? undefined : categoryId);

  const nestedCategories = isProperty ? propertyCategories : classifiedsCategories;
  const isNestedLoading = isProperty ? isPropertyLoading : isClassifiedsLoading;
  const isNestedError = isProperty ? isPropertyError : isClassifiedsError;
  const refetchNested = isProperty ? refetchProperty : refetchClassifieds;
  const nestedEmptyTitle = isProperty
    ? 'No Property Categories Available'
    : 'No Classifieds Categories Available';
  const nestedErrorTitle = isProperty
    ? 'Unable to load property categories'
    : 'Unable to load classifieds categories';

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>(
    subcategoryId,
  );

  const onSelectStandard = useCallback(
    (id: string, name: string) => {
      setSubcategory(id, name);
      navigation.navigate('CreatePostMediaStep');
    },
    [navigation, setSubcategory],
  );

  const onToggleExpand = useCallback((parentId: string) => {
    setExpandedCategoryId(prev => (prev === parentId ? null : parentId));
  }, []);

  const onSelectNestedSubcategory = useCallback(
    (selection: PropertySubcategorySelection) => {
      setSelectedSubcategoryId(selection.subcategoryId);
      setPropertySubcategory(selection.parentId, selection.subcategoryId, selection.name);
      navigation.navigate('CreatePostMediaStep');
    },
    [navigation, setPropertySubcategory],
  );

  const nestedContent = useMemo(() => {
    if (isNestedLoading) {
      return <SubcategoryListSkeleton />;
    }

    if (isNestedError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>{nestedErrorTitle}</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchNested()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (nestedCategories.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>{nestedEmptyTitle}</Text>
        </View>
      );
    }

    return (
      <PropertySubcategoryAccordion
        categories={nestedCategories}
        expandedCategoryId={expandedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onToggleExpand={onToggleExpand}
        onSelectSubcategory={onSelectNestedSubcategory}
      />
    );
  }, [
    expandedCategoryId,
    isNestedError,
    isNestedLoading,
    nestedCategories,
    nestedEmptyTitle,
    nestedErrorTitle,
    onSelectNestedSubcategory,
    onToggleExpand,
    refetchNested,
    selectedSubcategoryId,
    styles,
  ]);

  const standardContent = useMemo(() => {
    if (isStandardLoading) {
      return <SubcategoryListSkeleton />;
    }

    if (isStandardError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Unable to load subcategories</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchStandard()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (standardItems.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No subcategories available</Text>
        </View>
      );
    }

    return standardItems.map(item => (
      <Pressable key={item._id} style={styles.listItem} onPress={() => onSelectStandard(item._id, item.name)}>
        <Text style={styles.listItemText}>{item.name}</Text>
        <Icon name="chevron-right" size={22} color="#9CA3AF" />
      </Pressable>
    ));
  }, [
    isStandardError,
    isStandardLoading,
    onSelectStandard,
    refetchStandard,
    standardItems,
    styles,
  ]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={categoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {isNestedCategory ? nestedContent : standardContent}
      </ScrollView>
    </View>
  );
};
