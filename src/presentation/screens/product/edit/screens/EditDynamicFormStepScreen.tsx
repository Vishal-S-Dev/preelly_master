import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../../../types/dynamicForm.types';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { validatePrice, validateUaePhone, validateYear } from '../../../../../utils/formValidation';
import { FormCheckboxGroup } from '../../../../components/forms/FormCheckboxGroup';
import { FormDropdown } from '../../../../components/forms/FormDropdown';
import { FormProgressBar } from '../../../../components/forms/FormProgressBar';
import { FormRadioGroup } from '../../../../components/forms/FormRadioGroup';
import { FormTextInput } from '../../../../components/forms/FormTextInput';
import { formStyles } from '../../../../components/forms/formStyles';
import { CreatePostFooter, CreatePostHeader } from '../../../../components/createPost/StepIndicator';
import { useCreatePostStyles } from '../../../../hooks/useCreatePostStyles';
import { useEditDynamicFormStep } from '../hooks/useEditDynamicFormStep';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductFormStep'>;

export const EditDynamicFormStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryName, phone, price, dynamicFields } = useEditProductStore();
  const {
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    data,
    stepFields,
    handleFieldChange,
    getFieldValue,
    requiredFilled,
  } = useEditDynamicFormStep('3');

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
    navigation.navigate('EditProductAdvancedFormStep');
  }, [dynamicFields.year, navigation, phone, price]);

  const renderField = useCallback(
    (field: FormField) => {
      const value = getFieldValue(field.fieldName);
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
          return <FormTextInput key={field.id} field={field} value={value} onChange={handleFieldChange} />;
        case 'Radio':
          return <FormRadioGroup key={field.id} field={field} value={value} onChange={handleFieldChange} />;
        case 'Checkbox':
          return <FormCheckboxGroup key={field.id} field={field} value={value} onChange={handleFieldChange} />;
        default:
          return null;
      }
    },
    [getFieldValue, handleFieldChange, stepFields],
  );

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={categoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
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
      </ScrollView>
      {!isLoading && data ? <FormProgressBar currentStep={3} totalSteps={5} /> : null}
      <CreatePostFooter
        backgroundColor={styles.screen.backgroundColor}
        step={3}
        onNext={onNext}
        disabled={!requiredFilled || isLoading || isError}
      />
    </View>
  );
};
