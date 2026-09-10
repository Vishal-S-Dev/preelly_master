import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { createPostService } from '../../../services/createPost.service';
import { findFormStep, sortStepFields } from '../../../utils/dynamicFormUtils';
import { resolveDynamicFormCategoryId } from '../../../utils/resolveDynamicFormCategoryId';
import { getProductFormFields } from '../../../utils/buildProductFormData';
import { validatePrice } from '../../../utils/formValidation';
import { resolveListingPrice } from '../../../utils/resolveListingPrice';
import { buildFieldReviewRows } from '../../../utils/reviewFormUtils';
import { buildCheckoutListingSnapshot } from '../../../utils/buildCheckoutListingSnapshot';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { PhotoGrid } from '../../components/createPost/PhotoGrid';
import { ReviewSection } from '../../components/createPost/ReviewSection';
import { VideoPreview } from '../../components/createPost/VideoPreview';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useDynamicForm } from '../../hooks/useDynamicForm';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostPreviewStep'>;

export const PreviewStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
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
    // Guards a real crash: if the app was relaunched (e.g. after being reclaimed in the
    // background) and the user's tap lands before the persisted draft finishes rehydrating,
    // `getDraft()` below would silently return the empty default draft — category/subcategory
    // fall back to hardcoded defaults, video/images/dynamicFields come back empty — and the
    // request reaches the server with none of the user's actual listing data, surfacing as a
    // confusing "Video is required" error even though the screen still shows everything
    // correctly (it re-renders correctly once hydration finishes moments later).
    if (!useCreatePostStore.persist.hasHydrated()) {
      Alert.alert('One moment', 'Your draft is still loading — please try again in a second.');
      return;
    }

    const draft = store.getDraft();
    // Defense-in-depth for the same race, and for any other future cause of a hollowed-out
    // draft: video is mandatory from step 1 onward (MediaUploadStepScreen won't let you past
    // it without one), so if it's missing here despite reaching Preview, the draft snapshot
    // itself is untrustworthy — fail fast client-side with an actionable message instead of
    // letting the server reject a request that's silently missing the user's actual listing.
    if (!draft.video) {
      Alert.alert('Draft not ready', 'Your video wasn’t found. Please go back and re-check it, then try again.');
      return;
    }

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
      const result = await createPostService.publishListing(draft, { formFields });
      const priceNum = Number(String(listingPrice).replace(/[^\d.]/g, '')) || 0;
      const listing = buildCheckoutListingSnapshot(draft, result?.id, priceNum);
      store.reset();
      navigation.replace('CreatePostPlaceAnAd', {
        productId: result?.id,
        listing,
      });
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
        <PhotoGrid images={store.images} onRemove={() => undefined} styles={styles} readOnly />
      </ScrollView>
      <CreatePostFooter
        backgroundColor={styles.screen.backgroundColor}
        step={5}
        total={5}
        onNext={onPublish}
        nextLabel={publishing ? 'Posting...' : 'Post Ad'}
        disabled={publishing}
      />
    </View>
  );
};
