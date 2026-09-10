import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCENT = '#2563EB';
const ACCENT_BG = '#EFF6FF';
const SUCCESS = '#16A34A';
const SUCCESS_BG = '#DCFCE7';
const DANGER = '#DC2626';
const DANGER_BG = '#FEF2F2';
const TEXT = '#111827';
const SUBTEXT = '#6B7280';
const TRACK = '#E5E7EB';
const BORDER = '#D1D5DB';

/**
 * Only stages the app can actually observe are represented here. The upload gives us real
 * byte-level progress; everything after that (frame extraction, transcript generation) happens
 * server-side behind a single opaque request/response, so it's shown as one honest "processing"
 * stage rather than faking a step-by-step breakdown the backend never reports.
 */
export type VideoProcessingPhase = 'preparing' | 'uploading' | 'processing' | 'success' | 'error';

interface Props {
  phase: VideoProcessingPhase;
  /** 0-100, only meaningful while phase === 'uploading'. */
  progress: number;
  /** True once the processing phase has been running longer than typical. */
  isTakingLonger?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onRetry: () => void;
}

const COPY: Record<'preparing' | 'uploading' | 'processing' | 'success', { title: string; message: string }> = {
  preparing: {
    title: 'Preparing your video',
    message: 'Getting your video ready to upload…',
  },
  uploading: {
    title: 'Uploading your video',
    message: 'Securely uploading your video…',
  },
  processing: {
    title: 'Analyzing your video',
    message: "We're extracting key frames and generating your transcript. This may take a moment.",
  },
  success: {
    title: 'Video ready',
    message: 'Your video has been processed successfully.',
  },
};

const LONGER_PROCESSING_MESSAGE = 'Still working on your video. This may take a little longer.';
const ERROR_TITLE = 'Something went wrong';
const DEFAULT_ERROR_MESSAGE = "We couldn't finish processing your video. Please try again.";

const PHASE_ICON: Record<'preparing' | 'uploading' | 'processing', string> = {
  preparing: 'timer-sand',
  uploading: 'cloud-upload-outline',
  processing: 'image-multiple-outline',
};

export const VideoProcessingSheet = forwardRef<BottomSheetModal, Props>(
  ({ phase, progress, isTakingLonger, errorMessage, onCancel, onRetry }, ref) => {
    const insets = useSafeAreaInsets();
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

    const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
    useEffect(() => {
      let mounted = true;
      AccessibilityInfo.isReduceMotionEnabled?.()
        .then(enabled => {
          if (mounted) setReduceMotionEnabled(enabled);
        })
        .catch(() => undefined);
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setReduceMotionEnabled,
      );
      return () => {
        mounted = false;
        subscription.remove();
      };
    }, []);

    const title = phase === 'error' ? ERROR_TITLE : COPY[phase].title;
    const message =
      phase === 'error'
        ? errorMessage || DEFAULT_ERROR_MESSAGE
        : phase === 'processing' && isTakingLonger
        ? LONGER_PROCESSING_MESSAGE
        : COPY[phase].message;

    // Announce stage changes for VoiceOver/TalkBack users who aren't watching the animation.
    const lastAnnouncedRef = useRef('');
    useEffect(() => {
      const announcement = `${title}. ${message}`;
      if (lastAnnouncedRef.current !== announcement) {
        lastAnnouncedRef.current = announcement;
        AccessibilityInfo.announceForAccessibility?.(announcement);
      }
    }, [title, message]);

    // A fixed pixel height (rather than a "%" snap point) keeps this sheet the same physical
    // size across phones/tablets — content here doesn't scroll, so it must always fully fit the
    // tallest phase (the error state, with two stacked buttons).
    const snapPoints = useMemo(() => [430 + Math.max(insets.bottom, 20)], [insets.bottom]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          // The upload/analysis is in flight — dismissing the sheet without an explicit
          // Cancel would leave the user unsure whether it's still running in the background.
          pressBehavior="none"
        />
      ),
      [],
    );

    const iconNode = useMemo(() => {
      if (phase === 'success') {
        return (
          <View style={[styles.iconCircle, { backgroundColor: SUCCESS_BG }]}>
            <Icon name="check-circle" size={56} color={SUCCESS} />
          </View>
        );
      }
      if (phase === 'error') {
        return (
          <View style={[styles.iconCircle, { backgroundColor: DANGER_BG }]}>
            <Icon name="alert-circle" size={56} color={DANGER} />
          </View>
        );
      }
      if (reduceMotionEnabled) {
        return (
          <View style={[styles.iconCircle, { backgroundColor: ACCENT_BG }]}>
            <Icon name={PHASE_ICON[phase]} size={48} color={ACCENT} />
            <ActivityIndicator
              size="small"
              color={ACCENT}
              style={styles.staticSpinnerOverlay}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        );
      }
      return (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <LottieView
            source={require('../../../../assets/lottie/ai.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      );
    }, [phase, reduceMotionEnabled]);

    const checklistNode =
      phase === 'processing' ? (
        <View style={styles.checklist} accessibilityElementsHidden={false}>
          <View style={styles.checklistRow}>
            <Icon name="check-circle" size={18} color={SUCCESS} />
            <Text style={styles.checklistTextDone}>Video uploaded</Text>
          </View>
          <View style={styles.checklistRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.checklistTextCurrent}>Processing your video</Text>
          </View>
        </View>
      ) : null;

    const showCancel = phase !== 'success';

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
        backdropComponent={renderBackdrop}
        accessibilityViewIsModal
      >
        <View
          style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <Text
            style={styles.title}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.6}
          >
            {title}
          </Text>
          <Text style={styles.message} maxFontSizeMultiplier={1.6}>
            {message}
          </Text>

          <View style={styles.iconWrap}>{iconNode}</View>

          {phase === 'uploading' ? (
            <View style={styles.uploadStatus}>
              <View
                style={styles.progressTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
                accessibilityLabel={`Uploading, ${clampedProgress} percent complete`}
              >
                <View style={[styles.progressFill, { width: `${clampedProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>Uploading {clampedProgress}%</Text>
              <View style={styles.secureNote}>
                <Icon name="shield-lock-outline" size={14} color={SUBTEXT} />
                <Text style={styles.secureNoteText}>
                  Your video is encrypted and kept secure.
                </Text>
              </View>
            </View>
          ) : null}

          {checklistNode}

          <View style={styles.buttonGroup}>
            {phase === 'error' ? (
              <Pressable
                onPress={onRetry}
                style={({ pressed }) => [styles.retryBtn, pressed ? styles.retryBtnPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Try again processing video"
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            ) : null}

            {showCancel ? (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [styles.cancelBtn, pressed ? styles.cancelBtnPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Cancel video processing"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

VideoProcessingSheet.displayName = 'VideoProcessingSheet';

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: SUBTEXT,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  lottie: {
    width: 120,
    height: 120,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticSpinnerOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  uploadStatus: {
    width: '100%',
    marginTop: 18,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: TRACK,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
    textAlign: 'center',
    marginTop: 8,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  secureNoteText: {
    fontSize: 12,
    fontWeight: '500',
    color: SUBTEXT,
  },
  checklist: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistTextDone: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  checklistTextCurrent: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 22,
    gap: 10,
  },
  retryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnPressed: {
    backgroundColor: '#1D4ED8',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
  cancelBtnPressed: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
});
