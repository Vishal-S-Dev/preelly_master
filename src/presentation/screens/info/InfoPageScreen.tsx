import React, { useCallback, useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';
import { INFO_PAGES } from '../../../constants/infoPages';
import { InfoPageAction } from '../../../types/infoPage.types';
import { getInfoPageStyles } from './infoPageStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Support' | 'ContactUs'>;

export const InfoPageScreen: React.FC<Props> = ({ navigation, route }) => {
  const { styles, colors } = useSettingsStyles();
  const theme = useAppTheme();
  const infoStyles = useMemo(() => getInfoPageStyles(theme), [theme]);
  const pageKey = route.name === 'Support' ? 'support' : 'contact';
  const page = INFO_PAGES[pageKey];

  const onAction = useCallback(
    (action: InfoPageAction) => {
      if (action.kind === 'mail') {
        Linking.openURL(`mailto:${action.value}`).catch(() => {
          Alert.alert('Unable to open email', `Please email us at ${action.value}.`);
        });
        return;
      }
      navigation.navigate('MainTabs', { screen: 'Chat' });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{page.title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={infoStyles.scrollContent}>
        <Text style={infoStyles.description}>{page.description}</Text>

        <View style={infoStyles.card}>
          <View style={infoStyles.iconBadge}>
            <Icon name={page.icon} size={24} color={colors.primary} />
          </View>

          {page.body.map(paragraph => (
            <Text key={paragraph} style={infoStyles.bodyText}>
              {paragraph}
            </Text>
          ))}

          <View style={infoStyles.actionsRow}>
            {page.actions.map(action => (
              <Pressable
                key={action.label}
                style={infoStyles.actionBtn}
                onPress={() => onAction(action)}
                accessibilityRole="button"
                accessibilityLabel={action.label}>
                <Icon name={action.icon} size={18} color={colors.primary} />
                <Text style={infoStyles.actionBtnText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
