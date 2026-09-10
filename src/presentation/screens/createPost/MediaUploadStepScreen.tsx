import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UploadIcon from '../../../../assets/icons/icn_upload.svg';
import CameraIcon from '../../../../assets/icn_camera.svg';
import { useCreatePostStore } from '../../../store/createPostStore';
import { CreatePostStackParamList } from '../../../types/createPost.types';
import { CreatePostFooter, CreatePostHeader } from '../../components/createPost/StepIndicator';
import { MediaPickerCard } from '../../components/createPost/MediaPickerCard';
import { MediaUploadTips } from '../../components/createPost/MediaUploadTips';
import { VideoPreview } from '../../components/createPost/VideoPreview';
import { VideoTrimEditor } from '../../components/createPost/VideoTrimEditor';
import {
  VideoProcessingPhase,
  VideoProcessingSheet,
} from '../../components/createPost/VideoProcessingSheet';
import { useMediaPicker } from '../../hooks/useMediaPicker';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useCreatePostTranscription } from '../../hooks/useCreatePostTranscription';
import { cpStyles } from '../../components/createPost/createPostStyles';

type Props = NativeStackScreenProps<CreatePostStackParamList, 'CreatePostMediaStep'>;

export const MediaUploadStepScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useCreatePostStyles();
  const { categoryId, categoryName, setVideo, reset } = useCreatePostStore();
  const { video, isProcessingVideo, pickVideoFromGallery, captureVideo } = useMediaPicker();
  const [matchedCardHeight, setMatchedCardHeight] = useState<number | null>(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  // Analyzing the video (upload + AI extraction) now happens right here on "Next" — the
  // dedicated ProcessingStepScreen is skipped entirely; this bottom sheet shows the same
  // work with real upload-percentage feedback instead.
  const transcriptionMutation = useCreatePostTranscription();
  const processingSheetRef = useRef<BottomSheetModal>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  // Bumped on every start/cancel so a late callback from a superseded request (e.g. Cancel
  // pressed right as the response was landing, or a stale retry) can recognize it's stale and
  // no-op instead of resetting state or navigating a second time.
  const requestIdRef = useRef(0);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [processingPhase, setProcessingPhase] = useState<VideoProcessingPhase>('preparing');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTakingLonger, setIsTakingLonger] = useState(false);

  const clearProcessingTimer = useCallback(() => {
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearProcessingTimer();
      uploadAbortRef.current?.abort();
    };
  }, [clearProcessingTimer]);

  // A saved draft worth offering to clear — video and category are the two pieces of state
  // that make a resumed draft feel "in progress" vs. a blank first visit to this screen.
  const hasSavedDraft = Boolean(video) && Boolean(categoryId || categoryName);

  const onClearDraft = useCallback(() => {
    Alert.alert(
      'Clear draft?',
      'This permanently removes your saved video, category, and any progress on this listing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Draft',
          style: 'destructive',
          onPress: () => {
            reset();
            navigation.reset({
              index: 0,
              routes: [{ name: 'CreatePostCategory' }],
            });
          },
        },
      ],
    );
  }, [navigation, reset]);

  // How long the (opaque, single-request) processing phase runs before the sheet stops implying
  // a fixed short wait and admits it may take a while longer — a real elapsed-time signal, not a
  // fabricated progress value.
  const PROCESSING_LONGER_THRESHOLD_MS = 12000;

  const startProcessing = useCallback(() => {
    if (!video) {
      Alert.alert(
        'Video required',
        'Please upload or capture a video (max 2 mins).',
      );
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    clearProcessingTimer();
    setIsTakingLonger(false);
    // Compression runs before the network request even starts — reflect that honestly instead
    // of showing "uploading" at 0% while nothing has been sent yet.
    setProcessingPhase('preparing');
    setUploadProgress(0);
    processingSheetRef.current?.present();

    let lastReportedPct = -1;

    transcriptionMutation.mutate(
      {
        signal: controller.signal,
        onUploadProgress: event => {
          if (requestId !== requestIdRef.current) return;
          const total = event.total ?? 0;
          const pct = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
          if (pct === lastReportedPct) return; // skip redundant re-renders for duplicate events
          lastReportedPct = pct;
          setProcessingPhase(prev => (prev === 'preparing' ? 'uploading' : prev));
          setUploadProgress(pct);
          // Multipart upload finishes well before the server has extracted anything — switch
          // the sheet over to the (indeterminate) processing stage once bytes are fully sent.
          if (pct >= 100) {
            setProcessingPhase('processing');
            clearProcessingTimer();
            processingTimerRef.current = setTimeout(() => {
              if (requestId === requestIdRef.current) {
                setIsTakingLonger(true);
              }
            }, PROCESSING_LONGER_THRESHOLD_MS);
          }
        },
      },
      {
        onSuccess: () => {
          if (requestId !== requestIdRef.current) return;
          uploadAbortRef.current = null;
          clearProcessingTimer();
          setProcessingPhase('success');
          setUploadProgress(100);
          // Brief pause so the success state is actually visible before we navigate away.
          setTimeout(() => {
            if (requestId !== requestIdRef.current) return;
            processingSheetRef.current?.dismiss();
            navigation.replace('CreatePostDetailsStep');
          }, 700);
        },
        onError: error => {
          if (requestId !== requestIdRef.current) return;
          uploadAbortRef.current = null;
          clearProcessingTimer();
          const wasCancelled =
            axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError');
          if (wasCancelled) {
            return;
          }
          // Keep the sheet open with an in-place error + Try Again, per the safe-error-message
          // rule — never surface the raw network/API error text to the user.
          setProcessingPhase('error');
        },
      },
    );
  }, [clearProcessingTimer, navigation, transcriptionMutation, video]);

  const onNext = startProcessing;
  const onRetryProcessing = startProcessing;

  const onCancelProcessing = useCallback(() => {
    requestIdRef.current += 1; // invalidate any in-flight mutation callbacks
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    clearProcessingTimer();
    processingSheetRef.current?.dismiss();
    setProcessingPhase('preparing');
    setUploadProgress(0);
    setIsTakingLonger(false);
  }, [clearProcessingTimer]);

  const onUploadCardLayout = useCallback((height: number) => {
    if (height <= 0) {
      return;
    }
    setMatchedCardHeight(prev =>
      prev == null || Math.abs(prev - height) > 1 ? height : prev,
    );
  }, []);

  const equalCardStyle =
    matchedCardHeight != null
      ? { height: matchedCardHeight, minHeight: matchedCardHeight }
      : undefined;

  return (
    <View style={styles.screen}>
      <CreatePostHeader
        title={categoryName}
        backgroundColor={styles.screen.backgroundColor}
        onBack={() => navigation.goBack()}
      />
      {hasSavedDraft ? (
        <View style={localStyles.draftBanner}>
          <Text style={localStyles.draftBannerText} numberOfLines={1}>
            You have a saved draft
          </Text>
          <Pressable
            style={localStyles.clearDraftBtn}
            onPress={onClearDraft}
            accessibilityRole="button"
            accessibilityLabel="Clear draft"
            accessibilityHint="Removes your saved video, category, and listing progress"
          >
            <Icon name="trash-can-outline" size={14} color="#DC2626" />
            <Text style={localStyles.clearDraftText}>Clear Draft</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!video ? (
          <>
            <MediaPickerCard
              title="Upload Video"
              subtitle="Max video duration 2 mins"
              iconElement={<UploadIcon width={54} height={38} />}
              onPress={isProcessingVideo ? () => undefined : pickVideoFromGallery}
              style={equalCardStyle}
              onLayout={e => {
                if (matchedCardHeight == null) {
                  onUploadCardLayout(e.nativeEvent.layout.height);
                }
              }}
            >
              <MediaUploadTips />
            </MediaPickerCard>

            <Text style={cpStyles.orText}>Or</Text>

            <MediaPickerCard
              title="Capture Video"
              subtitle="Max video duration 2 mins"
              iconElement={<CameraIcon width={48} height={43} />}
              onPress={isProcessingVideo ? () => undefined : captureVideo}
              style={equalCardStyle}
            />
          </>
        ) : isEditingVideo ? (
          <VideoTrimEditor
            video={video}
            onCancel={() => setIsEditingVideo(false)}
            onSave={trimmed => {
              setVideo(trimmed);
              setIsEditingVideo(false);
            }}
          />
        ) : (
          <>
            <VideoPreview
              video={video}
              onDelete={() => setVideo(null)}
              onReplace={pickVideoFromGallery}
            />
            <Pressable
              style={[styles.secondaryBtn, localStyles.editVideoBtn]}
              onPress={() => setIsEditingVideo(true)}
            >
              <Icon name="content-cut" size={15} color="#21357C" />
              <Text style={[styles.secondaryBtnText, localStyles.editVideoBtnText]}>Edit video</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      {isProcessingVideo ? (
        <View style={localStyles.processingOverlay} pointerEvents="auto">
          <View style={localStyles.processingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={localStyles.processingText}>Loading video…</Text>
          </View>
        </View>
      ) : null}
      {!isEditingVideo ? (
        <CreatePostFooter
          backgroundColor={styles.screen.backgroundColor}
          step={1}
          total={5}
          onNext={onNext}
          disabled={!video || transcriptionMutation.isPending}
        />
      ) : null}
      <VideoProcessingSheet
        ref={processingSheetRef}
        phase={processingPhase}
        progress={uploadProgress}
        isTakingLonger={isTakingLonger}
        onCancel={onCancelProcessing}
        onRetry={onRetryProcessing}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  draftBannerText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#7F1D1D',
  },
  clearDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  clearDraftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  editVideoBtn: {
    flex: 0,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  editVideoBtnText: {
    fontSize: 13,
  },
});
