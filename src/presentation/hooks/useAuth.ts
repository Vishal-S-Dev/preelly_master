import { useMemo } from 'react';
import { loginUser, logoutUser } from '../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  return useMemo(
    () => ({
      ...auth,
      login: (email: string, password: string) =>
        dispatch(loginUser({ email, password })),
      logout: () => dispatch(logoutUser()),
    }),
    [auth, dispatch],
  );
};
