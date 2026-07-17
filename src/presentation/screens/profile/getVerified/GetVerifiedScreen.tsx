import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Asset } from 'react-native-image-picker';
import { RootStackParamList } from '../../../navigation/types';
import { useDocumentImagePicker } from '../../../hooks/useDocumentImagePicker';
import { EmiratesIdUploadCard } from './components/EmiratesIdUploadCard';
import { useIdentityVerification } from './hooks/useIdentityVerification';
import { GV_COLORS, gvStyles } from './getVerifiedStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'GetVerified'>;

export const GetVerifiedScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { pickDocumentImage } = useDocumentImagePicker();
  const { submit, submitting } = useIdentityVerification();

  const [frontImage, setFrontImage] = useState<Asset | null>(null);
  const [backImage, setBackImage] = useState<Asset | null>(null);

  const pickForSide = useCallback(
    async (side: 'front' | 'back') => {
      if (submitting) {
        return;
      }
      const asset = await pickDocumentImage();
      if (!asset) {
        return;
      }
      if (side === 'front') {
        setFrontImage(asset);
        return;
      }
      setBackImage(asset);
    },
    [pickDocumentImage, submitting],
  );

  const openHeaderMenu = useCallback(() => {
    const showHelp = () => {
      Alert.alert(
        'Verification help',
        'Upload clear photos of both sides of your Emirates ID. Make sure all details are visible and not cropped.',
      );
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Verification help', 'Cancel'], cancelButtonIndex: 1 },
        index => {
          if (index === 0) {
            showHelp();
          }
        },
      );
      return;
    }

    Alert.alert('Options', undefined, [
      { text: 'Verification help', onPress: showHelp },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const onSubmit = useCallback(async () => {
    const success = await submit(frontImage, backImage);
    if (success) {
      navigation.goBack();
    }
  }, [backImage, frontImage, navigation, submit]);

  const canSubmit = Boolean(frontImage?.uri && backImage?.uri);

  return (
    <SafeAreaView style={gvStyles.screen} edges={['top']}>
      <View style={gvStyles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={gvStyles.headerBtn}
          accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} color={GV_COLORS.text} />
        </Pressable>
        <Text style={gvStyles.headerTitle}>Get Verified</Text>
        <Pressable
          onPress={openHeaderMenu}
          style={gvStyles.headerBtn}
          accessibilityLabel="More options">
          <Icon name="dots-vertical" size={24} color={GV_COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={gvStyles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={gvStyles.sectionTitle}>Upload your Emirates Id</Text>

        <EmiratesIdUploadCard
          label="Front copy"
          imageUri={frontImage?.uri}
          onUpload={() => pickForSide('front')}
          onDelete={() => setFrontImage(null)}
          onRetake={() => pickForSide('front')}
          disabled={submitting}
        />

        <EmiratesIdUploadCard
          label="Back Copy"
          imageUri={backImage?.uri}
          onUpload={() => pickForSide('back')}
          onDelete={() => setBackImage(null)}
          onRetake={() => pickForSide('back')}
          disabled={submitting}
        />
      </ScrollView>

      <View style={[gvStyles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={[gvStyles.submitBtn, submitting || !canSubmit ? gvStyles.submitBtnDisabled : null]}
          onPress={onSubmit}
          disabled={submitting || !canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit verification">
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={gvStyles.submitText}>Submit</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
