import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  visible: boolean;
  mode: 'create' | 'rename';
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

/** Create-or-rename board sheet — the one custom sheet this feature needs (everything else reuses
 * the existing `Alert.alert` action-menu pattern from MyArchivesScreen). */
export const GroupFormSheet: React.FC<Props> = ({ visible, mode, initialName, onSubmit, onClose }) => {
  const theme = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState(initialName ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapPoints = React.useMemo(() => ['40%'], []);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setError(null);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [initialName, visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} pressBehavior="close" />
    ),
    [],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your board a name');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      sheetRef.current?.dismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [name, onSubmit]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
      onDismiss={onClose}
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {mode === 'create' ? 'Create new board' : 'Rename board'}
        </Text>
        <TextInput
          value={name}
          onChangeText={text => {
            setName(text);
            if (error) {
              setError(null);
            }
          }}
          placeholder="e.g. Beautiful flowers"
          placeholderTextColor={theme.subText}
          maxLength={60}
          autoFocus
          style={[
            styles.input,
            { color: theme.text, borderColor: error ? theme.danger : theme.subText + '44' },
          ]}
          accessibilityLabel="Board name"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}

        <Pressable
          style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={mode === 'create' ? 'Create board' : 'Save board name'}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{mode === 'create' ? 'Create Board' : 'Save'}</Text>
          )}
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -6,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
