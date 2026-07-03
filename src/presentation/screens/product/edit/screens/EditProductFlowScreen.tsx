import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/types';
import { EditProductNavigator } from '../../../../navigation/EditProductNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProductFlow'>;

export const EditProductFlowScreen: React.FC<Props> = ({ route }) => {
  const { productId, initialRoute, detailSeed } = route.params;
  return (
    <EditProductNavigator
      productId={productId}
      initialRoute={initialRoute}
      detailSeed={detailSeed}
    />
  );
};
