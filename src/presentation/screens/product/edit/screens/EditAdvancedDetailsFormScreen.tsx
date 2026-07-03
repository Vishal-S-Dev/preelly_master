import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../../../types/dynamicForm.types';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { useEditProductStore } from '../../../../../store/editProductStore';
import { FormCheckboxGroup } from '../../../../components/forms/FormCheckboxGroup';
import { FormDropdown } from '../../../../components/forms/FormDropdown';
import { FormRadioGroup } from '../../../../components/forms/FormRadioGroup';
import { FormTextInput } from '../../../../components/forms/FormTextInput';
import { formStyles } from '../../../../components/forms/formStyles';
import { LocationMapPicker } from '../../../../components/createPost/LocationMapPicker';
import { CreatePostFooter, CreatePostHeader } from '../../../../components/createPost/StepIndicator';
import { useCreatePostStyles } from '../../../../hooks/useCreatePostStyles';
import { useEditDynamicFormStep } from '../hooks/useEditDynamicFormStep';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductAdvancedFormStep'>;

export const EditAdvancedDetailsFormScreen: React.FC<Props> = ({ navigation }) => {
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
  } = useEditProductStore();
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
    getFieldValue,
    requiredFilled,
  } = useEditDynamicFormStep('4');

  const onNext = useCallback(() => {
    navigation.navigate('EditProductPreviewStep');
  }, [navigation]);

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
          return (
            <FormCheckboxGroup key={field.id} field={field} value={value} onChange={handleFieldChange} maxVisible={5} />
          );
        default:
          return null;
      }
    },
    [dynamicFields, getFieldValue, handleFieldChange, stepFields],
  );

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={categoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 24 }]}>
        <Text style={styles.title}>You're almost done!</Text>
        <Text style={styles.subtitle}>
          Review detailed information, photos, and location before saving your changes.
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
      </ScrollView>
      <CreatePostFooter
        backgroundColor={styles.screen.backgroundColor}
        step={4}
        onNext={onNext}
        disabled={!requiredFilled || isLoading || isError}
      />
    </View>
  );
};
