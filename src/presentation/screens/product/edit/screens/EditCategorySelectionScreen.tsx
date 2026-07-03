import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { getCategoryCardColor, getCategoryIcon } from '../../../../../utils/categoryIcons';
import { CreatePostHeader } from '../../../../components/createPost/StepIndicator';
import { useCategories } from '../../../../hooks/useCategories';
import { useCreatePostStyles } from '../../../../hooks/useCreatePostStyles';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductCategory'>;

export const EditCategorySelectionScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryId, setCategory } = useEditProductStore();
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  const onSelect = useCallback(
    (id: string, name: string) => {
      setCategory(id, name);
      navigation.navigate('EditProductSubcategory');
    },
    [navigation, setCategory],
  );

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        backgroundColor={styles.screen.backgroundColor}
        showTitleInHeader={false}
        onBack={() => navigation.getParent()?.goBack()}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, styles.categoryScrollContent]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit your listing</Text>
        <Text style={styles.subtitle}>Review or change the category for your ad.</Text>
        {isLoading ? (
          <View style={styles.categoryGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : null}
        {isError ? (
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
        <View style={styles.categoryGrid}>
          {categories.map((item, index) => (
            <Animated.View key={item._id} entering={FadeInDown.delay(index * 40).duration(300)} style={{ width: '47%' }}>
              <Pressable
                style={[
                  styles.categoryCard,
                  { backgroundColor: getCategoryCardColor(index) },
                  categoryId === item._id && styles.categoryCardSelected,
                ]}
                onPress={() => onSelect(item._id, item.name)}>
                <Icon name={item.icon ?? getCategoryIcon(item.slug, item.name)} size={24} color="#374151" />
                <Text style={styles.categoryTitle}>{item.name}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
