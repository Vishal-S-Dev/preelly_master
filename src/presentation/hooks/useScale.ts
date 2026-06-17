import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const baseWidth = 390;
const baseHeight = 844;

export const useScale = () => ({
  scale: (size: number) => (width / baseWidth) * size,
  verticalScale: (size: number) => (height / baseHeight) * size,
});
