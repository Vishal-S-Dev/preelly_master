import React, { memo, useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';
import { FormProgressBar } from '../../../presentation/components/forms/FormProgressBar.tsx';

interface StepProps {
  step: number;
  total?: number;
}

export const StepIndicator = memo<StepProps>(({ step, total = 5 }) => {
  const styles = useCreatePostStyles();
  return (
    <Text style={styles.progressText}>
      {step} of {total}
    </Text>
  );
});

StepIndicator.displayName = 'StepIndicator';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  onHelp?: () => void;
  backgroundColor?: string;
  /** Category landing: back + help only; title lives in scroll content. */
  showTitleInHeader?: boolean;
}

export const CreatePostHeader = memo<HeaderProps>(
  ({ title, onBack, onHelp, backgroundColor, showTitleInHeader = true }) => {
    const theme = useAppTheme();
    const styles = useCreatePostStyles();
    const insets = useStableSafeAreaInsets();
    const bg = backgroundColor ?? theme.background;

    const handleHelp = useCallback(() => {
      if (onHelp) {
        onHelp();
        return;
      }
      Alert.alert('Help', 'Choose a category that best matches your item.');
    }, [onHelp]);

    const displayTitle = showTitleInHeader && title;

    return (
      <View style={{ backgroundColor: bg, paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.headerBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="chevron-left" size={28} color={theme.text} />
          </Pressable>

          {displayTitle ? (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.headerTitleSpacer} />
          )}

          <Pressable
            onPress={handleHelp}
            style={styles.headerHelpBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Help">
            <Icon name="help-circle-outline" size={26} color={theme.text} />
          </Pressable>
        </View>
      </View>
    );
  },
);

CreatePostHeader.displayName = 'CreatePostHeader';

interface FooterProps {
  step: number;
  total?: number;
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
  backgroundColor?: string;
}

export const CreatePostFooter = memo<FooterProps>(
  ({ step, total = 5, onNext, nextLabel = 'Next', disabled, backgroundColor }) => {
    const theme = useAppTheme();
    const styles = useCreatePostStyles();
    const insets = useStableSafeAreaInsets();
    const bg = backgroundColor ?? theme.background;

    return (
      <View
        style={{
          backgroundColor: bg,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <FormProgressBar currentStep={step} totalSteps={5} />
        <View style={styles.footer}>
          <StepIndicator step={step} total={total} />
          <Pressable
            onPress={onNext}
            disabled={disabled}
            style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
          >
            <Text style={styles.primaryBtnText}>{nextLabel}</Text>
            <Icon name="chevron-right" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  },
);

CreatePostFooter.displayName = 'CreatePostFooter';
