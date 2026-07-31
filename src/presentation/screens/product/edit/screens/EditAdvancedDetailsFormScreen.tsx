import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../../../types/dynamicForm.types';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { useEditProductStore } from '../../../../../store/editProductStore';
import {
  findBuildingStreetField,
  findLocateYourItemField,
  getLocationMapInsertIndex,
} from '../../../../../utils/locationFormFields';
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

  const locateField = useMemo(() => findLocateYourItemField(stepFields), [stepFields]);
  const buildingField = useMemo(() => findBuildingStreetField(stepFields), [stepFields]);
  const mapInsertIndex = useMemo(() => getLocationMapInsertIndex(stepFields), [stepFields]);
  const hasLocationFormFields = Boolean(locateField || buildingField);

  const onNext = useCallback(() => {
    navigation.navigate('EditProductPreviewStep');
  }, [navigation]);

  const syncLocateYourItem = useCallback(
    (value: string) => {
      setLocateYourItem(value);
      if (locateField) {
        handleFieldChange(locateField.fieldName, value);
      }
    },
    [handleFieldChange, locateField, setLocateYourItem],
  );

  const syncBuildingStreet = useCallback(
    (value: string) => {
      setLocationAddress(value);
      if (buildingField) {
        handleFieldChange(buildingField.fieldName, value);
      }
    },
    [buildingField, handleFieldChange, setLocationAddress],
  );

  const onFormFieldChange = useCallback(
    (fieldName: string, value: string) => {
      handleFieldChange(fieldName, value);

      if (locateField && fieldName === locateField.fieldName) {
        setLocateYourItem(value);
      }
      if (buildingField && fieldName === buildingField.fieldName) {
        setLocationAddress(value);
      }
    },
    [buildingField, handleFieldChange, locateField, setLocateYourItem, setLocationAddress],
  );

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
              onChange={onFormFieldChange}
              stepFields={stepFields}
              formValues={dynamicFields}
            />
          );
        case 'Text':
          return (
            <FormTextInput key={field.id} field={field} value={value} onChange={onFormFieldChange} />
          );
        case 'Radio':
          return (
            <FormRadioGroup
              key={field.id}
              field={field}
              value={value}
              onChange={onFormFieldChange}
            />
          );
        case 'Checkbox':
          return (
            <FormCheckboxGroup
              key={field.id}
              field={field}
              value={value}
              onChange={onFormFieldChange}
              maxVisible={5}
            />
          );
        default:
          return null;
      }
    },
    [dynamicFields, getFieldValue, onFormFieldChange, stepFields],
  );

  const renderLocationMap = useCallback(
    () => (
      <LocationMapPicker
        locateYourItem={locateYourItem}
        address={locationAddress}
        latitude={locationLatitude}
        longitude={locationLongitude}
        onLocateYourItemChange={syncLocateYourItem}
        onAddressChange={syncBuildingStreet}
        onCoordinateChange={setLocationCoordinates}
        styles={styles}
        showAddressFields={!hasLocationFormFields}
        showTip={!hasLocationFormFields}
      />
    ),
    [
      hasLocationFormFields,
      locateYourItem,
      locationAddress,
      locationLatitude,
      locationLongitude,
      setLocationCoordinates,
      styles,
      syncBuildingStreet,
      syncLocateYourItem,
    ],
  );

  const renderStepContent = () => {
    if (isLoading || isError) {
      return null;
    }

    if (!hasLocationFormFields || mapInsertIndex < 0) {
      return (
        <>
          {stepFields.map(renderField)}
          {renderLocationMap()}
        </>
      );
    }

    return (
      <>
        {stepFields.map((field, index) => (
          <React.Fragment key={field.id}>
            {index === mapInsertIndex ? renderLocationMap() : null}
            {renderField(field)}
          </React.Fragment>
        ))}
      </>
    );
  };

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
        {renderStepContent()}
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
