import React, { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { AppInput } from '../../components/createPost/AppInput';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { SummaryCard } from '../../components/createPost/SummaryCard';
import { cpStyles } from '../../components/createPost/createPostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostSummaryStep'>;

export const SummaryStepScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const store = useCreatePostStore();
  const { dynamicFields, price, phone, exteriorColor, interiorColor, warranty, fuelType } = store;

  const onNext = useCallback(() => {
    navigation.navigate('CreatePostPreviewStep');
  }, [navigation]);

  return (
    <SafeAreaView style={cpStyles.screen} edges={['top']}>
      <CreatePostHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[cpStyles.content, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={cpStyles.title}>You're almost done!</Text>
        <Text style={cpStyles.subtitle}>Add detailed information to complete your listing.</Text>

        <SummaryCard
          rows={[
            { label: 'Make & Model', value: dynamicFields.makeModel },
            { label: 'Trim', value: dynamicFields.trim },
            { label: 'Regional Specs', value: dynamicFields.regionalSpecs },
            { label: 'Year', value: dynamicFields.year },
            { label: 'Kilometres', value: dynamicFields.kilometers },
            { label: 'Body Type', value: dynamicFields.bodyType },
            { label: 'Price', value: price ? `AED ${price}` : undefined },
            { label: 'Phone Number', value: phone },
          ]}
          onEdit={() => navigation.navigate('CreatePostFormStep')}
        />

        <View style={{ marginTop: 20 }}>
          <AppInput label="Price" value={price} onChangeText={store.setPrice} required placeholder="AED 100,000" />
          <AppInput label="Phone Number" value={phone} onChangeText={store.setPhone} required placeholder="+971..." />
          <AppInput label="Exterior Color" value={exteriorColor || dynamicFields.exteriorColor || ''} onChangeText={store.setExteriorColor} required />
          <AppInput label="Interior Color" value={interiorColor || dynamicFields.interiorColor || ''} onChangeText={store.setInteriorColor} required />
          <Text style={cpStyles.inputLabel}>Warranty*</Text>
          <View style={cpStyles.chipRow}>
            {['Yes', 'No', 'Does not apply'].map(option => (
              <Pressable
                key={option}
                style={[cpStyles.chip, (warranty || dynamicFields.warranty) === option && cpStyles.chipActive]}
                onPress={() => store.setWarranty(option)}>
                <Text style={(warranty || dynamicFields.warranty) === option ? cpStyles.chipTextActive : cpStyles.chipText}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[cpStyles.inputLabel, { marginTop: 12 }]}>Fuel Type*</Text>
          <View style={cpStyles.chipRow}>
            {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(option => (
              <Pressable
                key={option}
                style={[cpStyles.chip, (fuelType || dynamicFields.fuelType) === option && cpStyles.chipActive]}
                onPress={() => store.setFuelType(option)}>
                <Text style={(fuelType || dynamicFields.fuelType) === option ? cpStyles.chipTextActive : cpStyles.chipText}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom }}>
        <CreatePostFooter step={4} onNext={onNext} disabled={!price.trim() || !phone.trim()} />
      </View>
    </SafeAreaView>
  );
};
