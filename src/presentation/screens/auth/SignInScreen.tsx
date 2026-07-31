import React, { useEffect } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoginScreen } from './LoginScreen';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
}

/** @deprecated Unified auth lives on LoginScreen. Redirects for legacy routes. */
export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    navigation.replace('Login');
  }, [navigation]);

  return <LoginScreen navigation={navigation as NativeStackNavigationProp<RootStackParamList, 'Login'>} />;
};
