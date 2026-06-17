import React, { memo, useMemo } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FormField } from '../../../types/dynamicForm.types';
import { getOptionValue, getSortedFilterOptions } from '../../../utils/dynamicFormUtils';
import { formStyles } from './formStyles';

interface Props {
  visible: boolean;
  field: FormField | null;
  stepFields?: FormField[];
  formValues?: Record<string, string>;
  onSelect: (fieldName: string, value: string) => void;
  onClose: () => void;
}

export const FormSelectFullScreenModal = memo<Props>(
  ({ visible, field, stepFields = [], formValues = {}, onSelect, onClose }) => {
  const theme = useAppTheme();
  const options = useMemo(
    () => (field ? getSortedFilterOptions(field, stepFields, formValues) : []),
    [field, stepFields, formValues],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn}>
            <Icon name="chevron-left" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {field?.fieldTitle ?? 'Select'}
          </Text>
          <View style={styles.headerBtn} />
        </View>
        <FlatList
          data={options}
          keyExtractor={item => item.value}
          renderItem={({ item }) => (
            <Pressable
              style={formStyles.sheetItem}
              onPress={() => {
                if (!field) return;
                onSelect(field.fieldName, getOptionValue(item));
                onClose();
              }}>
              <Text style={[formStyles.sheetItemText, { color: theme.text }]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
  },
);

FormSelectFullScreenModal.displayName = 'FormSelectFullScreenModal';

const styles = StyleSheet.create({
  screen: { flex: 1 , marginTop : Platform.OS === 'ios' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
});
