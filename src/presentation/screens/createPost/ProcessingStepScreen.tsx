import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { CreatePostHeader } from '../../components/createPost/StepIndicator';
import { UploadProgress } from '../../components/createPost/UploadProgress';
import { useCreatePostTranscription } from '../../hooks/useCreatePostTranscription';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostProcessing'>;

export const ProcessingStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const mutation = useCreatePostTranscription();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let mounted = true;
    const timers: ReturnType<typeof setInterval>[] = [];
    const animate = (setter: (v: number) => void, cap: number) => {
      timers.push(setInterval(() => setter(prev => (prev >= cap ? prev : prev + 4)), 180));
    };
    animate(setUploadProgress, 90);
    animate(setTranscriptionProgress, 85);
    animate(setExtractionProgress, 90);
    mutation.mutate(undefined, {
      onSuccess: () => {
        if (!mounted) return;
        setUploadProgress(100);
        setTranscriptionProgress(100);
        setExtractionProgress(100);
        navigation.replace('CreatePostDetailsStep');
      },
      onError: error => {
        Alert.alert('Processing failed', error instanceof Error ? error.message : 'Try again', [
          { text: 'Back', onPress: () => navigation.goBack() },
        ]);
      },
    });
    return () => {
      mounted = false;
      timers.forEach(clearInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.screen}>
      <CreatePostHeader backgroundColor={styles.screen.backgroundColor} onBack={() => navigation.goBack()} />
      <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
        <UploadProgress
          uploadProgress={uploadProgress}
          transcriptionProgress={transcriptionProgress}
          extractionProgress={extractionProgress} />
      </View>
    </View>
  );
};
