import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useProfileStyles } from '../../hooks/useProfileStyles';

interface Props {
  lines: string[];
}

export const ProfileBio = memo<Props>(({ lines }) => {
  const { styles } = useProfileStyles();

  return (
    <View>
      {lines.map(line => (
        <Text key={line} style={styles.bio}>
          {line}
        </Text>
      ))}
    </View>
  );
});

ProfileBio.displayName = 'ProfileBio';
