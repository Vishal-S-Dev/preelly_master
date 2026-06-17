import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { createPostService } from '../../../services/createPost.service';
import { findFormStep, sortStepFields } from '../../../utils/dynamicFormUtils';
import { resolveDynamicFormCategoryId } from '../../../utils/resolveDynamicFormCategoryId';
import { getProductFormFields } from '../../../utils/buildProductFormData';
import { validatePrice } from '../../../utils/formValidation';
import { resolveListingPrice } from '../../../utils/resolveListingPrice';
import { buildFieldReviewRows } from '../../../utils/reviewFormUtils';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { PhotoGrid } from '../../components/createPost/PhotoGrid';
import { ReviewSection } from '../../components/createPost/ReviewSection';
import { VideoPreview } from '../../components/createPost/VideoPreview';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useDynamicForm } from '../../hooks/useDynamicForm';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostPreviewStep'>;

export const PreviewStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const insets = useStableSafeAreaInsets();
  const store = useCreatePostStore();
  const [publishing, setPublishing] = useState(false);
  const formCategoryId =
    store.dynamicFormCategoryId ?? resolveDynamicFormCategoryId(store.subcategoryId, store.categoryId);
  const { data: formData } = useDynamicForm(formCategoryId);

  const step3Fields = useMemo(() => {
    const step = findFormStep(formData?.steps, '3');
    return step ? sortStepFields(step.fields) : [];
  }, [formData]);
  const step4Fields = useMemo(() => {
    const step = findFormStep(formData?.steps, '4');
    return step ? sortStepFields(step.fields) : [];
  }, [formData]);
  const formFields = useMemo(() => getProductFormFields(formData?.steps), [formData?.steps]);

  const onPublish = useCallback(async () => {
    const draft = store.getDraft();
    const listingPrice = resolveListingPrice(draft, draft.dynamicFields, formFields);
    if (!listingPrice) {
      Alert.alert('Price required', 'Please enter a valid price before posting your ad.');
      return;
    }
    if (!validatePrice(listingPrice)) {
      Alert.alert('Invalid price', 'Enter a valid price amount.');
      return;
    }

    setPublishing(true);
    try {
      await createPostService.publishListing(draft, { formFields });
      store.reset();
      Alert.alert('Success', 'Your ad has been posted.', [
        { text: 'OK', onPress: () => navigation.getParent()?.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Post failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [formFields, navigation, store]);

  return (
    <View style={styles.screen}>
      <CreatePostHeader title={store.categoryName} backgroundColor={styles.screen.backgroundColor} onBack={() => navigation.goBack()} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/*<Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>Step 5 of 5</Text>*/}
        {store.video ? <VideoPreview video={store.video} onDelete={() => undefined} onReplace={() => undefined} /> : null}
        <ReviewSection title="Basic Details" rows={buildFieldReviewRows(step3Fields, store.dynamicFields)} onEdit={() => navigation.navigate('CreatePostFormStep')} styles={styles} />
        <ReviewSection title="Additional Details" rows={buildFieldReviewRows(step4Fields.filter(f => f.fieldType !== 'Checkbox'), store.dynamicFields)} onEdit={() => navigation.navigate('CreatePostAdvancedFormStep')} styles={styles} />
        {step4Fields.filter(f => f.fieldType === 'Checkbox').map(group => (
          <ReviewSection key={group.id} title={group.fieldTitle.replace(/\*+$/, '')} rows={buildFieldReviewRows([group], store.dynamicFields)} onEdit={() => navigation.navigate('CreatePostAdvancedFormStep')} styles={styles} />
        ))}
        <ReviewSection
          title="Location"
          rows={[
            { label: 'Locate your item', value: store.locateYourItem },
            { label: 'Building / Street', value: store.locationAddress },
            { label: 'Coordinates', value: `${store.locationLatitude}, ${store.locationLongitude}` },
          ]}
          onEdit={() => navigation.navigate('CreatePostAdvancedFormStep')}
          styles={styles}
        />
        <Text style={styles.sectionTitle}>{store.title}</Text>
        <Text style={styles.subtitle}>{store.description}</Text>
        <PhotoGrid images={store.images} onRemove={() => undefined} styles={styles} />
      </ScrollView>
      <View style={{ backgroundColor: styles.screen.backgroundColor, paddingBottom: Math.max(insets.bottom, 12) }}>
        <View style={styles.footer}>
          <Text style={styles.progressText}>5 of 5</Text>
          <Pressable onPress={onPublish} disabled={publishing} style={[styles.primaryBtn, publishing && styles.primaryBtnDisabled]}>
            <Text style={styles.primaryBtnText}>{publishing ? 'Posting...' : 'Post Ad'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
