import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';
import { FAQ_ITEMS } from '../../../constants/infoPages';
import { getInfoPageStyles } from '../info/infoPageStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'FAQ'>;

export const FAQScreen: React.FC<Props> = ({ navigation }) => {
  const { styles, colors } = useSettingsStyles();
  const theme = useAppTheme();
  const infoStyles = useMemo(() => getInfoPageStyles(theme), [theme]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(prev => (prev === index ? null : index));
  };

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
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={infoStyles.scrollContent}>
        <Text style={infoStyles.description}>
          Answers to common questions about buying and selling on Preelly.
        </Text>

        <View style={infoStyles.card}>
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <View
                key={item.question}
                style={[infoStyles.faqItem, index === 0 ? infoStyles.faqItemFirst : null]}>
                <Pressable
                  style={infoStyles.faqRow}
                  onPress={() => toggle(index)}
                  accessibilityRole="button"
                  accessibilityLabel={item.question}
                  accessibilityState={{ expanded: isOpen }}>
                  <Text style={infoStyles.faqQuestion}>{item.question}</Text>
                  <Icon
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
                {isOpen ? <Text style={infoStyles.faqAnswer}>{item.answer}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
