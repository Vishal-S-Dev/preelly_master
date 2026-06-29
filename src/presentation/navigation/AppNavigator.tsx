import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { LoginWithPasswordScreen } from '../screens/auth/LoginWithPasswordScreen';
import { VerifyOtpScreen } from '../screens/auth/VerifyOtpScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import {
  BookmarkScreen,
  CreateScreen,
  ProfileScreen,
} from '../screens/main/PlaceholderScreens';
import { ChatNavigator } from './ChatNavigator';
import { ChatThreadScreen } from '../screens/chat/ChatThreadScreen';
import { ProductDetailScreen } from '../screens/product/ProductDetailScreen';
import { EditProductScreen } from '../screens/product/EditProductScreen';
import { CreatePostNavigator } from './CreatePostNavigator';
import { ProfileEditScreen } from '../screens/profile/edit/ProfileEditScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { RootStackParamList } from './types';
import { useAppSelector } from '../hooks/useRedux';
import { useAppTheme } from '../hooks/useAppTheme';
import { Image, Platform } from 'react-native';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';
import { SignInScreen } from '../screens/auth/SignInScreen.tsx';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen.tsx';
import { UserFeedScreen } from '../screens/profile/UserFeedScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { SearchResultScreen } from '../screens/search/SearchResultScreen.tsx';
import { CategoryFilterScreen } from '../screens/search/CategoryFilterScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { FollowRequestsScreen } from '../screens/notifications/FollowRequestsScreen';
import { MySettingsScreen } from '../screens/settings/MySettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: 'home-variant',
  Bookmark: 'bookmark-outline',
  Create: 'plus-circle-outline',
  Chat: 'message-text-outline',
  Profile: 'account-circle-outline',
};

const getTabIcon =
  (routeName: string) =>
  ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Icon
      name={focused ? TAB_ICONS[routeName].replace('-outline', '') : TAB_ICONS[routeName]}
      color={color}
      size={size}
    />
  );

const MainTabs: React.FC = () => {
  const theme = useAppTheme();
  const authUser = useAppSelector(state => state.auth.user);
  const profileAvatarUri = authUser?.avatar
    ? getDisplayAvatarUri(authUser.avatar, authUser.name)
    : null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subText,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: 'transparent',
          height: Platform.OS === 'ios' ? 74 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Profile' && profileAvatarUri) {
            return (
              <Image
                key={profileAvatarUri}
                source={{ uri: profileAvatarUri }}
                style={{
                  width: size + 4,
                  height: size + 4,
                  borderRadius: (size + 4) / 2,
                  borderWidth: focused ? 2 : 1,
                  borderColor: focused ? theme.primary : theme.subText,
                }}
              />
            );
          }
          return getTabIcon(route.name)({ color, size, focused });
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookmark" component={BookmarkScreen} />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreatePost');
          },
        })}
      />
      <Tab.Screen name="Chat" component={ChatNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isGuest } = useAppSelector(state => state.auth);
  const { hasCompletedOnboarding } = useAppSelector(state => state.app);
  const theme = useAppTheme();
  const requiresProfileCompletion =
    isAuthenticated && !isGuest && user?.isProfileComplete === false;

  const stackInitialRoute = !hasCompletedOnboarding
    ? 'Onboarding'
    : isAuthenticated
      ? requiresProfileCompletion
        ? 'ProfileEdit'
        : 'MainTabs'
      : 'Login';

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.card,
          notification: theme.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator
        key={stackInitialRoute}
        initialRouteName={stackInitialRoute}
        screenOptions={{ headerShown: false }}
      >
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ChatThread"
              component={ChatThreadScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="CreatePost"
              component={CreatePostNavigator}
              options={{
                animation: 'slide_from_right',
                presentation: 'fullScreenModal',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              initialParams={{ requireCompletion: requiresProfileCompletion }}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="OtherProfile"
              component={UserProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="SearchFilter"
              component={SearchResultScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="CategoryFilter"
              component={CategoryFilterScreen}
              options={{
                animation: 'slide_from_right',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="UserFeed"
              component={UserFeedScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="FollowRequests"
              component={FollowRequestsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="MySettings"
              component={MySettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen
              name="LoginWithPassword"
              component={LoginWithPasswordScreen}
            />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
