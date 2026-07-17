import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { AdPackageCard } from '../../components/createPost/AdPackageCard';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { useAdPackages } from '../../hooks/useAdPackages';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { PLACE_AD_COLORS, placeAdStyles } from './placeAnAdStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostPlaceAnAd'>;

export const PlaceAnAdScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useStableSafeAreaInsets();
  const productId = route.params?.productId;
  const listing = route.params?.listing;
  const {
    packages,
    loading,
    error,
    selectedId,
    selectedPackage,
    setSelectedId,
    reload,
  } = useAdPackages();

  const closeFlow = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const onSkip = useCallback(() => {
    closeFlow();
  }, [closeFlow]);

  const onConfirm = useCallback(() => {
    if (!selectedPackage) {
      Alert.alert('Select a package', 'Please choose a package to continue.');
      return;
    }

    navigation.navigate('CreatePostBuyPackage', {
      productId,
      adPackage: selectedPackage,
      listing: listing ?? {
        title: 'Your listing',
        categoryName: 'Listing',
        priceLabel: 'AED 0',
        priceValue: 0,
        productId,
      },
    });
  }, [listing, navigation, productId, selectedPackage]);

  return (
    <View style={placeAdStyles.screen}>
      <CreatePostHeader
        title="Place an Ad"
        backgroundColor={PLACE_AD_COLORS.background}
        onBack={closeFlow}
        onHelp={() =>
          Alert.alert(
            'Packages',
            'Choose a package to promote your listing. You can skip and keep the free visibility for now.',
          )
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={placeAdStyles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={placeAdStyles.subtitle}>Select a package that works for you</Text>

        {loading ? (
          <View style={placeAdStyles.centerWrap}>
            <View style={placeAdStyles.skeletonCard} />
            <View style={placeAdStyles.skeletonCard} />
            <View style={placeAdStyles.skeletonCard} />
            <ActivityIndicator color={PLACE_AD_COLORS.confirmBg} style={{ marginTop: 8 }} />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={placeAdStyles.centerWrap}>
            <Text style={placeAdStyles.errorText}>{error}</Text>
            <Pressable onPress={reload} hitSlop={8}>
              <Text style={placeAdStyles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error
          ? packages.map(item => (
              <AdPackageCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
              />
            ))
          : null}
      </ScrollView>

      <View style={[placeAdStyles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          onPress={onSkip}
          style={placeAdStyles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip package selection"
        >
          <Text style={placeAdStyles.skipText}>Skip</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={!selectedPackage || loading}
          style={[
            placeAdStyles.confirmBtn,
            (!selectedPackage || loading) && placeAdStyles.confirmBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Confirm package"
        >
          <Text style={placeAdStyles.confirmText}>Confirm</Text>
        </Pressable>
      </View>
    </View>
  );
};
