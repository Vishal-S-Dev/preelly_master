import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async setString(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
