import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { peStyles } from '../profileEditStyles';

interface Props {
  title: string;
  subtitle: string;
}

export const SectionHeader = memo<Props>(({ title, subtitle }) => (
  <View>
    <Text style={peStyles.sectionTitle}>{title}</Text>
    <Text style={peStyles.sectionSubtitle}>{subtitle}</Text>
  </View>
));

SectionHeader.displayName = 'SectionHeader';
