import React, { useState } from 'react';
import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAppDispatch } from '../../hooks/useRedux';
import { setOnboardingCompleted } from '../../redux/slices/appSlice';
import { storage } from '../../../utils/storage';
import { STORAGE_KEYS } from '../../../constants/appConstants';

const DATA = [
  { id: '1', title: 'Watch short videos' },
  { id: '2', title: 'Share your moments' },
  { id: '3', title: 'Connect with creators' },
  { id: '4', title: 'Discover your interests' },
];

export const OnboardingScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const theme = useAppTheme();
  const dispatch = useAppDispatch();

  const complete = async () => {
    await storage.setString(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    dispatch(setOnboardingCompleted(true));
  };

  const renderItem: ListRenderItem<(typeof DATA)[number]> = ({ item }) => (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={DATA}
        horizontal
        pagingEnabled
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onMomentumScrollEnd={event => {
          const x = event.nativeEvent.contentOffset.x;
          const page = Math.round(x / event.nativeEvent.layoutMeasurement.width);
          setIndex(page);
        }}
      />
      <View style={styles.footer}>
        <AppButton title={index === DATA.length - 1 ? 'Get Started' : 'Skip'} onPress={complete} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { width: '100%', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 28, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 },
  footer: { position: 'absolute', bottom: 40, left: 16, right: 16 },
});
