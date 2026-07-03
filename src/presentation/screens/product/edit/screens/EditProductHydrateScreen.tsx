import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EditProductStackParamList } from '../../../../../types/editProduct.types';
import { PD_COLORS } from '../../../../components/productDetail/productDetailStyles';
import { useHydrateEditProduct } from '../hooks/useHydrateEditProduct';

type Props = NativeStackScreenProps<EditProductStackParamList, 'EditProductHydrate'>;

export const EditProductHydrateScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, initialRoute, detailSeed } = route.params;
  const { hydrate, loading, error } = useHydrateEditProduct();

  useEffect(() => {
    let active = true;
    const run = async () => {
      const ok = await hydrate(productId, detailSeed);
      if (!active) {
        return;
      }
      if (!ok) {
        return;
      }
      const target = initialRoute ?? 'EditProductCategory';
      navigation.replace(target);
    };
    run();
    return () => {
      active = false;
    };
  }, [detailSeed, hydrate, initialRoute, navigation, productId]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: PD_COLORS.muted, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
        <Pressable onPress={() => navigation.getParent()?.goBack()}>
          <Text style={{ color: PD_COLORS.primary, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={PD_COLORS.primary} />
      {loading ? <Text style={{ marginTop: 12, color: PD_COLORS.muted }}>Loading listing...</Text> : null}
    </View>
  );
};
