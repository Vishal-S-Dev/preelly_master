import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../types/dynamicForm.types';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { useCreatePostStore } from '../../../store/createPostStore';
import { FormCheckboxGroup } from '../../components/forms/FormCheckboxGroup';
import { FormDropdown } from '../../components/forms/FormDropdown';
import { FormRadioGroup } from '../../components/forms/FormRadioGroup';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { formStyles } from '../../components/forms/formStyles';
import { LocationMapPicker } from '../../components/createPost/LocationMapPicker';
import { CreatePostStepShell } from '../../components/createPost/CreatePostStepShell';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useDynamicFormStep } from '../../hooks/useDynamicFormStep';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostAdvancedFormStep'>;

export const AdvancedDetailsFormScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const {
    categoryName,
    locateYourItem,
    locationAddress,
    locationLatitude,
    locationLongitude,
    setLocateYourItem,
    setLocationAddress,
    setLocationCoordinates,
  } = useCreatePostStore();
  const {
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    data,
    stepFields,
    dynamicFields,
    handleFieldChange,
    requiredFilled,
  } = useDynamicFormStep('4');

  const onNext = useCallback(() => {
    navigation.navigate('CreatePostPreviewStep');
  }, [navigation]);

  const renderField = useCallback(
    (field: FormField) => {
      const value = dynamicFields[field.fieldName];
      switch (field.fieldType) {
        case 'Dropdown':
          return (
            <FormDropdown
              key={field.id}
              field={field}
              value={value}
              onChange={handleFieldChange}
              stepFields={stepFields}
              formValues={dynamicFields}
            />
          );
        case 'Text':
          return (
            <FormTextInput
              key={field.id}
              field={field}
              value={value}
              onChange={handleFieldChange}
            />
          );
        case 'Radio':
          return (
            <FormRadioGroup
              key={field.id}
              field={field}
              value={value}
              onChange={handleFieldChange}
            />
          );
        case 'Checkbox':
          return (
            <FormCheckboxGroup
              key={field.id}
              field={field}
              value={value}
              onChange={handleFieldChange}
              maxVisible={5}
            />
          );
        default:
          return null;
      }
    },
    [dynamicFields, handleFieldChange, stepFields],
  );

  return (
    <CreatePostStepShell
      header={
        <CreatePostHeader
          title={categoryName}
          backgroundColor={styles.screen.backgroundColor}
          onBack={() => navigation.goBack()}
        />
      }
      footer={
        <CreatePostFooter
          backgroundColor={styles.screen.backgroundColor}
          step={4}
          onNext={onNext}
          disabled={!requiredFilled || isLoading || isError}
        />
      }
    >
      <Text style={styles.title}>You're almost done!</Text>
      <Text style={styles.subtitle}>
        Add detailed information, upload clear photos, and set a competitive
        price to attract more buyers.
      </Text>
      {isLoading || (isFetching && !data) ? (
        <View>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={formStyles.skeleton} />
          ))}
        </View>
      ) : null}
      {isError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            {error instanceof Error ? error.message : 'Retry'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!isLoading && !isError ? stepFields.map(renderField) : null}
      <LocationMapPicker
        locateYourItem={locateYourItem}
        address={locationAddress}
        latitude={locationLatitude}
        longitude={locationLongitude}
        onLocateYourItemChange={setLocateYourItem}
        onAddressChange={setLocationAddress}
        onCoordinateChange={setLocationCoordinates}
        styles={styles}
      />
    </CreatePostStepShell>
  );
};
