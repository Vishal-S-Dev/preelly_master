import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { isPropertyCategory } from '../../../utils/isPropertyCategory';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import {
  PropertySubcategoryAccordion,
  PropertySubcategorySelection,
} from '../../components/createPost/PropertySubcategoryAccordion';
import { SubcategoryListSkeleton } from '../../components/createPost/SubcategoryListSkeleton';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { usePropertyCategories } from '../../hooks/usePropertyCategories';
import { useSubcategories } from '../../hooks/useSubcategories';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostSubcategory'>;

export const SubcategorySelectionScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryId, categoryName, subcategoryId, setSubcategory, setPropertySubcategory } =
    useCreatePostStore();

  const isProperty = isPropertyCategory(categoryName);

  const {
    data: propertyCategories = [],
    isLoading: isPropertyLoading,
    isError: isPropertyError,
    refetch: refetchProperty,
  } = usePropertyCategories(isProperty);

  const {
    data: standardItems = [],
    isLoading: isStandardLoading,
    isError: isStandardError,
    refetch: refetchStandard,
  } = useSubcategories(isProperty ? undefined : categoryId);

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>(
    subcategoryId,
  );
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string | undefined>();

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

  const onSelectPropertySubcategory = useCallback(
    (selection: PropertySubcategorySelection) => {
      setSelectedParentId(selection.parentId);
      setSelectedSubcategoryId(selection.subcategoryId);
      setSelectedSubcategoryName(selection.name);
      setPropertySubcategory(selection.parentId, selection.subcategoryId, selection.name);
      navigation.navigate('CreatePostMediaStep');
    },
    [navigation, setPropertySubcategory],
  );

  const propertyContent = useMemo(() => {
    if (isPropertyLoading) {
      return <SubcategoryListSkeleton />;
    }

    if (isPropertyError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Unable to load property categories</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchProperty()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (propertyCategories.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No Property Categories Available</Text>
        </View>
      );
    }

    return (
      <PropertySubcategoryAccordion
        categories={propertyCategories}
        expandedCategoryId={expandedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onToggleExpand={onToggleExpand}
        onSelectSubcategory={onSelectPropertySubcategory}
      />
    );
  }, [
    expandedCategoryId,
    isPropertyError,
    isPropertyLoading,
    onSelectPropertySubcategory,
    onToggleExpand,
    propertyCategories,
    refetchProperty,
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
        {isProperty ? propertyContent : standardContent}
      </ScrollView>
    </View>
  );
};
