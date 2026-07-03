import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EditProductDetailSeed, EditProductStackParamList } from '../../types/editProduct.types';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAppSelector } from '../hooks/useRedux';
import { EditProductHydrateScreen } from '../screens/product/edit/screens/EditProductHydrateScreen';
import { EditCategorySelectionScreen } from '../screens/product/edit/screens/EditCategorySelectionScreen';
import { EditSubcategorySelectionScreen } from '../screens/product/edit/screens/EditSubcategorySelectionScreen';
import { EditMediaUploadStepScreen } from '../screens/product/edit/screens/EditMediaUploadStepScreen';
import { EditDetailsStepScreen } from '../screens/product/edit/screens/EditDetailsStepScreen';
import { EditDynamicFormStepScreen } from '../screens/product/edit/screens/EditDynamicFormStepScreen';
import { EditAdvancedDetailsFormScreen } from '../screens/product/edit/screens/EditAdvancedDetailsFormScreen';
import { EditPreviewStepScreen } from '../screens/product/edit/screens/EditPreviewStepScreen';

const Stack = createNativeStackNavigator<EditProductStackParamList>();

type EditProductNavigatorProps = {
  productId: string;
  initialRoute?: Exclude<keyof EditProductStackParamList, 'EditProductHydrate'>;
  detailSeed?: EditProductDetailSeed;
};

export const EditProductNavigator: React.FC<EditProductNavigatorProps> = ({
  productId,
  initialRoute,
  detailSeed,
}) => {
  const theme = useAppTheme();
  const themeMode = useAppSelector(state => state.theme.mode);

  return (
    <SafeAreaProvider>
      <Stack.Navigator
        initialRouteName="EditProductHydrate"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.background },
          statusBarStyle: themeMode === 'dark' ? 'light' : 'dark',
        }}>
        <Stack.Screen
          name="EditProductHydrate"
          component={EditProductHydrateScreen}
          initialParams={{ productId, initialRoute, detailSeed }}
        />
        <Stack.Screen name="EditProductCategory" component={EditCategorySelectionScreen} />
        <Stack.Screen name="EditProductSubcategory" component={EditSubcategorySelectionScreen} />
        <Stack.Screen name="EditProductMediaStep" component={EditMediaUploadStepScreen} />
        <Stack.Screen name="EditProductDetailsStep" component={EditDetailsStepScreen} />
        <Stack.Screen name="EditProductFormStep" component={EditDynamicFormStepScreen} />
        <Stack.Screen name="EditProductAdvancedFormStep" component={EditAdvancedDetailsFormScreen} />
        <Stack.Screen name="EditProductPreviewStep" component={EditPreviewStepScreen} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
};
