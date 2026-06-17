import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { formStyles } from './formStyles';

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export const FormProgressBar = memo<Props>(({ currentStep, totalSteps = 2 }) => {
  const progress = Math.min(1, Math.max(0, currentStep / totalSteps));

  return (
    <View>
      {/*<Text style={formStyles.progressLabel}>
        Step {currentStep} of {totalSteps}
      </Text>*/}
      <View style={formStyles.progressTrack}>
        <View style={[formStyles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
});

FormProgressBar.displayName = 'FormProgressBar';
