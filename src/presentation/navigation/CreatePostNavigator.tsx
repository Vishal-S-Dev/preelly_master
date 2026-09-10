import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAppSelector } from '../hooks/useRedux';
import { CreatePostStackParamList } from '../../types/createPost.types';
import { CategorySelectionScreen } from '../screens/createPost/CategorySelectionScreen';
import { SubcategorySelectionScreen } from '../screens/createPost/SubcategorySelectionScreen';
import { MediaUploadStepScreen } from '../screens/createPost/MediaUploadStepScreen';
import { ProcessingStepScreen } from '../screens/createPost/ProcessingStepScreen';
import { AutoDetailsStepScreen } from '../screens/createPost/AutoDetailsStepScreen';
import { AdvancedDetailsFormScreen } from '../screens/createPost/AdvancedDetailsFormScreen';
import { DynamicFormStepScreen } from '../screens/createPost/DynamicFormStepScreen';
import { PreviewStepScreen } from '../screens/createPost/PreviewStepScreen';
import { PlaceAnAdScreen } from '../screens/createPost/PlaceAnAdScreen';
import { BuyPackageScreen } from '../screens/createPost/BuyPackageScreen';

const Stack = createNativeStackNavigator<CreatePostStackParamList>();

export const CreatePostNavigator: React.FC = () => {
  const theme = useAppTheme();
  const themeMode = useAppSelector(state => state.theme.mode);

  return (
    <SafeAreaProvider>
      {/* CreatePostNavigator is presented as a native-stack `fullScreenModal`, which mounts in
          its own view hierarchy separate from the app root — the root-level
          BottomSheetModalProvider's portal can't stack above it, so any BottomSheetModal used
          inside this stack (e.g. VideoProcessingSheet) needs its own local provider here. */}
      <BottomSheetModalProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.background },
            statusBarStyle: themeMode === 'dark' ? 'light' : 'dark',
          }}>
          <Stack.Screen name="CreatePostCategory" component={CategorySelectionScreen} />
          <Stack.Screen name="CreatePostSubcategory" component={SubcategorySelectionScreen} />
          <Stack.Screen name="CreatePostMediaStep" component={MediaUploadStepScreen} />
          <Stack.Screen name="CreatePostProcessing" component={ProcessingStepScreen} />
          <Stack.Screen name="CreatePostDetailsStep" component={AutoDetailsStepScreen} />
          <Stack.Screen name="CreatePostFormStep" component={DynamicFormStepScreen} />
          <Stack.Screen name="CreatePostAdvancedFormStep" component={AdvancedDetailsFormScreen} />
          <Stack.Screen name="CreatePostPreviewStep" component={PreviewStepScreen} />
          <Stack.Screen name="CreatePostPlaceAnAd" component={PlaceAnAdScreen} />
          <Stack.Screen name="CreatePostBuyPackage" component={BuyPackageScreen} />
        </Stack.Navigator>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  );
};
