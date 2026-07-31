import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormField } from '../../../types/dynamicForm.types';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { useCreatePostStore } from '../../../store/createPostStore';
import {
  findBuildingStreetField,
  findLocateYourItemField,
  getLocationMapInsertIndex,
} from '../../../utils/locationFormFields';
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

  const locateField = useMemo(() => findLocateYourItemField(stepFields), [stepFields]);
  const buildingField = useMemo(() => findBuildingStreetField(stepFields), [stepFields]);
  const mapInsertIndex = useMemo(() => getLocationMapInsertIndex(stepFields), [stepFields]);
  const hasLocationFormFields = Boolean(locateField || buildingField);

  const onNext = useCallback(() => {
    navigation.navigate('CreatePostPreviewStep');
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
      const value = dynamicFields[field.fieldName];
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
            <FormTextInput
              key={field.id}
              field={field}
              value={value}
              onChange={onFormFieldChange}
            />
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
    [dynamicFields, onFormFieldChange, stepFields],
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
      {renderStepContent()}
    </CreatePostStepShell>
  );
};
