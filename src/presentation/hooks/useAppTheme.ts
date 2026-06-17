import { darkTheme, lightTheme } from '../theme/colors';
import { useAppSelector } from './useRedux';

export const useAppTheme = () => {
  const mode = useAppSelector(state => state.theme.mode);
  return mode === 'dark' ? darkTheme : lightTheme;
};
