import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AuthLinkEmailScreen } from '../screens/auth/AuthLinkEmailScreen';
import { AuthLinkPhoneScreen } from '../screens/auth/AuthLinkPhoneScreen';
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
import { ProductImageGalleryScreen } from '../screens/product/ProductImageGalleryScreen';
import { ProductImageViewerScreen } from '../screens/product/ProductImageViewerScreen';
import { EditProductScreen } from '../screens/product/EditProductScreen';
import { EditProductFlowScreen } from '../screens/product/edit/screens/EditProductFlowScreen';
import { CreatePostNavigator } from './CreatePostNavigator';
import { ProfileEditScreen } from '../screens/profile/edit/ProfileEditScreen';
import { GetVerifiedScreen } from '../screens/profile/getVerified/GetVerifiedScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { navigationRef } from './navigationRef';
import { MainTabParamList, RootStackParamList } from './types';
import { useAppSelector } from '../hooks/useRedux';
import { useAppTheme } from '../hooks/useAppTheme';
import { Image, Platform } from 'react-native';
import { getDisplayAvatarUri } from '../../utils/mediaUrl';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen.tsx';
import { UserFeedScreen } from '../screens/profile/UserFeedScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { SearchResultScreen } from '../screens/search/SearchResultScreen.tsx';
import { CategoryFilterScreen } from '../screens/search/CategoryFilterScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { FollowRequestsScreen } from '../screens/notifications/FollowRequestsScreen';
import { MySettingsScreen } from '../screens/settings/MySettingsScreen';
import { MyArchivesScreen } from '../screens/archives/MyArchivesScreen';
import { MyDraftsScreen } from '../screens/drafts/MyDraftsScreen';
import { MySearchesScreen } from '../screens/searches/MySearchesScreen';
import { BlockedUsersScreen } from '../screens/blocked/BlockedUsersScreen';
import { InfoPageScreen } from '../screens/info/InfoPageScreen';
import { FAQScreen } from '../screens/faq/FAQScreen';
import { PrivacySecurityScreen } from '../screens/privacySecurity/PrivacySecurityScreen';
import { SetNewEmailScreen } from '../screens/privacySecurity/SetNewEmailScreen';
import { SetNewMobileScreen } from '../screens/privacySecurity/SetNewMobileScreen';
import { ChangeContactOtpScreen } from '../screens/privacySecurity/ChangeContactOtpScreen';
import { CartCheckoutScreen } from '../screens/cart/CartCheckoutScreen';
import { PaymentWebViewScreen } from '../screens/payment/PaymentWebViewScreen';
import { PaymentSuccessScreen } from '../screens/payment/PaymentSuccessScreen';
import { PaymentFailedScreen } from '../screens/payment/PaymentFailedScreen';
import { PaymentPendingScreen } from '../screens/payment/PaymentPendingScreen';
import { PaymentCancelledScreen } from '../screens/payment/PaymentCancelledScreen';
import { PaymentHistoryScreen } from '../screens/payment/PaymentHistoryScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
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
  const { isAuthenticated, user, isGuest, authJourney } = useAppSelector(state => state.auth);
  const { hasCompletedOnboarding } = useAppSelector(state => state.app);
  const theme = useAppTheme();
  const requiresProfileCompletion =
    isAuthenticated && !isGuest && user?.isProfileComplete === false;

  /** Stay on auth stack until OTP journey completes (link email/phone). */
  const showAuthStack = !isAuthenticated || authJourney !== null;

  const stackInitialRoute = showAuthStack
    ? 'Login'
    : requiresProfileCompletion
      ? 'ProfileEdit'
      : 'MainTabs';

  const navigatorKey = showAuthStack ? 'auth-flow' : 'main-app';

  return (
    <NavigationContainer
      ref={navigationRef}
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
        key={navigatorKey}
        initialRouteName={stackInitialRoute}
        screenOptions={{ headerShown: false }}
      >
        {showAuthStack ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <Stack.Screen name="AuthLinkEmail" component={AuthLinkEmailScreen} />
            <Stack.Screen name="AuthLinkPhone" component={AuthLinkPhoneScreen} />
            <Stack.Screen
              name="LoginWithPassword"
              component={LoginWithPasswordScreen}
            />
            {!hasCompletedOnboarding ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : null}
          </>
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
              name="ProductImageGallery"
              component={ProductImageGalleryScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ProductImageViewer"
              component={ProductImageViewerScreen}
              options={{ animation: 'fade', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProductFlow"
              component={EditProductFlowScreen}
              options={{
                animation: 'slide_from_right',
                presentation: 'fullScreenModal',
                gestureEnabled: true,
              }}
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
              name="GetVerified"
              component={GetVerifiedScreen}
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
            <Stack.Screen
              name="MyArchives"
              component={MyArchivesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="MyDrafts"
              component={MyDraftsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="MySearches"
              component={MySearchesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="BlockedUsers"
              component={BlockedUsersScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Support"
              component={InfoPageScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ContactUs"
              component={InfoPageScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="FAQ"
              component={FAQScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="PrivacySecurity"
              component={PrivacySecurityScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SetNewEmail"
              component={SetNewEmailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SetNewMobile"
              component={SetNewMobileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="ChangeContactOtp"
              component={ChangeContactOtpScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="CartCheckout"
              component={CartCheckoutScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="PaymentWebView"
              component={PaymentWebViewScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="PaymentSuccess"
              component={PaymentSuccessScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="PaymentFailed"
              component={PaymentFailedScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="PaymentPending"
              component={PaymentPendingScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="PaymentCancelled"
              component={PaymentCancelledScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="PaymentHistory"
              component={PaymentHistoryScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
