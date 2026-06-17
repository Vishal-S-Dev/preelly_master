import NetInfo from '@react-native-community/netinfo';
import React, { useEffect } from 'react';
import { useAppDispatch } from '../../presentation/hooks/useRedux';
import { setNetworkStatus } from '../../presentation/redux/slices/appSlice';

export const NetworkManager: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setNetworkStatus(Boolean(state.isConnected)));
    });
    return unsubscribe;
  }, [dispatch]);

  return null;
};
