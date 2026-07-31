import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { USER_REPORT_REASONS, UserReportReason } from '../../../services/userSafety.service';

interface Props {
  userName: string;
  submitting?: boolean;
  onSubmit: (payload: { reason: UserReportReason; details: string }) => void;
}

export const ReportUserBottomSheet = forwardRef<BottomSheetModal, Props>(
  ({ userName, submitting = false, onSubmit }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['72%'], []);
    const [reason, setReason] = useState<UserReportReason | null>(null);
    const [details, setDetails] = useState('');

    const closeSheet = useCallback(() => {
      if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current?.dismiss();
      }
    }, [ref]);

    const reset = useCallback(() => {
      setReason(null);
      setDetails('');
    }, []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior={submitting ? 'none' : 'close'}
        />
      ),
      [submitting],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={!submitting}
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.sheetBg}
        backdropComponent={renderBackdrop}
        onDismiss={reset}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <View style={styles.flagWrap}>
              <Icon name="flag-outline" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Report {userName || 'user'}</Text>
              <Text style={styles.subtitle}>
                Your report is confidential and reviewed by our team.
              </Text>
            </View>
            <Pressable onPress={closeSheet} disabled={submitting} hitSlop={8}>
              <Icon name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <View style={styles.reasons}>
            {USER_REPORT_REASONS.map(item => {
              const selected = reason === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                  onPress={() => setReason(item)}
                  disabled={submitting}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add more details (optional)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            style={styles.detailsInput}
            editable={!submitting}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={closeSheet}
              disabled={submitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, (!reason || submitting) && styles.submitBtnDisabled]}
              disabled={!reason || submitting}
              onPress={() => {
                if (!reason) {
                  return;
                }
                onSubmit({ reason, details: details.trim() });
              }}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Submit report</Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

ReportUserBottomSheet.displayName = 'ReportUserBottomSheet';

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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  flagWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  reasons: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  reasonRowSelected: {
    borderColor: '#0000FF',
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0000FF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0000FF',
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  reasonTextSelected: {
    color: '#0000FF',
  },
  detailsInput: {
    marginTop: 14,
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  submitBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
