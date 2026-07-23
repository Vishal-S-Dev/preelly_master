import React, { useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../types/dynamicForm.types';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { useCreatePostStore } from '../../../store/createPostStore';
import { validatePrice, validateUaePhone, validateYear } from '../../../utils/formValidation';
import { FormCheckboxGroup } from '../../components/forms/FormCheckboxGroup';
import { FormDropdown } from '../../components/forms/FormDropdown';
import { FormRadioGroup } from '../../components/forms/FormRadioGroup';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { formStyles } from '../../components/forms/formStyles';
import { CreatePostStepShell } from '../../components/createPost/CreatePostStepShell';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useDynamicFormStep } from '../../hooks/useDynamicFormStep';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostFormStep'>;

export const DynamicFormStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryName, phone, price, dynamicFields } = useCreatePostStore();
  const {
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    data,
    stepFields,
    handleFieldChange,
    requiredFilled,
  } = useDynamicFormStep('3');

  const onNext = useCallback(() => {
    if (phone && !validateUaePhone(phone)) {
      Alert.alert('Invalid phone', 'Enter a valid UAE mobile number.');
      return;
    }
    if (price && !validatePrice(price)) {
      Alert.alert('Invalid price', 'Enter a valid price.');
      return;
    }
    const year = dynamicFields.year;
    if (year && !validateYear(year)) {
      Alert.alert('Invalid year', 'Enter a valid manufacturing year.');
      return;
    }
    navigation.navigate('CreatePostAdvancedFormStep');
  }, [dynamicFields.year, navigation, phone, price]);

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
          step={3}
          onNext={onNext}
          disabled={!requiredFilled || isLoading || isError}
        />
      }
    >
      {/* <Text style={styles.title}>Basic vehicle information</Text> */}
      {/* <Text style={styles.subtitle}>Step 3 of 5</Text> */}
      {/* {!isLoading && data ? <FormProgressBar currentStep={3} totalSteps={5} /> : null} */}
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
            {error instanceof Error ? error.message : 'Failed to load form'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {!isLoading && !isError ? stepFields.map(renderField) : null}
    </CreatePostStepShell>
  );
};
