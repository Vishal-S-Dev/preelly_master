import React, { memo, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useCreatePostStyles } from '../../hooks/useCreatePostStyles';
import { useStableSafeAreaInsets } from '../../hooks/useStableSafeAreaInsets';

interface Props {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const CreatePostStepShell = memo<Props>(
  ({ header, footer, children, contentContainerStyle }) => {
    const styles = useCreatePostStyles();
    const insets = useStableSafeAreaInsets();

    return (
      <View style={styles.screen}>
        {header}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: 8,
                paddingBottom: Math.max(insets.bottom, 24),
              },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={Platform.OS === 'android'}
          >
            {children}
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </View>
    );
  },
);

CreatePostStepShell.displayName = 'CreatePostStepShell';
