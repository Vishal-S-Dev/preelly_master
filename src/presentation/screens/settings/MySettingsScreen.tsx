import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DashboardCard, DashboardCardSkeleton } from '../../components/settings/DashboardCard';
import { SettingsMenuItem } from '../../components/settings/SettingsMenuItem';
import { SettingsProfileSection } from '../../components/settings/SettingsProfileSection';
import { useMySettingsData } from '../../hooks/useMySettingsData';
import { useSettingsStyles } from '../../hooks/useSettingsStyles';
import { useAppDispatch } from '../../hooks/useRedux';
import { logoutUser } from '../../redux/slices/authSlice';
import { RootStackParamList } from '../../navigation/types';
import { getBuildVersionLabel } from '../../../utils/appVersion';

type Props = NativeStackScreenProps<RootStackParamList, 'MySettings'>;

const DASHBOARD_ITEMS = [
  { key: 'ads', icon: 'file-document-plus-outline', title: 'My Ads' },
  { key: 'searches', icon: 'text-search', title: 'My Search' },
  { key: 'bookings', icon: 'calendar-check-outline', title: 'My Bookings' },
  { key: 'cart', icon: 'cart-arrow-down', title: 'My Cart' },
  { key: 'drafts', icon: 'file-document-edit-outline', title: 'My Drafts' },
  { key: 'archives', icon: 'archive-arrow-down-outline', title: 'My Archives' },
] as const;

export const MySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { styles, colors } = useSettingsStyles();
  const dispatch = useAppDispatch();
  const { profile, counts, loading } = useMySettingsData();

  const versionLabel = useMemo(() => getBuildVersionLabel(), []);

  const showComingSoon = useCallback((feature: string) => {
    Alert.alert(feature, 'This section will be available in a future update.');
  }, []);

  const onDashboardPress = useCallback(
    (key: (typeof DASHBOARD_ITEMS)[number]['key']) => {
      switch (key) {
        case 'ads':
          navigation.navigate('MainTabs');
          break;
        case 'searches':
          navigation.navigate('Search');
          break;
        case 'bookings':
          showComingSoon('My Bookings');
          break;
        case 'cart':
          navigation.navigate('MainTabs');
          break;
        case 'drafts':
          navigation.navigate('CreatePost');
          break;
        case 'archives':
          showComingSoon('My Archives');
          break;
        default:
          break;
      }
    },
    [navigation, showComingSoon],
  );

  const onGetVerified = useCallback(() => {
    Alert.alert(
      'Get Verified',
      'Verification helps buyers trust your listings. This flow will be available in a future update.',
    );
  }, []);

  const onLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void dispatch(logoutUser());
        },
      },
    ]);
  }, [dispatch]);

  const dashboardGrid = useMemo(
    () =>
      loading ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <DashboardCardSkeleton key={`sk_${index}`} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {DASHBOARD_ITEMS.map(item => (
            <DashboardCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              count={counts[item.key]}
              onPress={() => onDashboardPress(item.key)}
            />
          ))}
        </View>
      ),
    [counts, loading, onDashboardPress, styles.grid],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <SettingsProfileSection
          profile={profile}
          loading={loading}
          onAvatarPress={() => navigation.navigate('ProfileEdit')}
          onGetVerified={onGetVerified}
        />

        {dashboardGrid}

        <View style={styles.menuSection}>
          <SettingsMenuItem
            icon="account-circle-outline"
            label="Profile"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <SettingsMenuItem
            icon="home-outline"
            label="My Address"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <SettingsMenuItem
            icon="bank-outline"
            label="My Bank Details"
            onPress={() => showComingSoon('My Bank Details')}
          />
          <SettingsMenuItem
            icon="cancel"
            label="Blocked Users"
            onPress={() => showComingSoon('Blocked Users')}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.menuSection}>
          <SettingsMenuItem
            icon="lifebuoy"
            label="Support"
            onPress={() => showComingSoon('Support')}
          />
          <SettingsMenuItem icon="help-circle-outline" label="FAQ" onPress={() => showComingSoon('FAQ')} />
          <SettingsMenuItem
            icon="phone-outline"
            label="Contact Us"
            onPress={() => showComingSoon('Contact Us')}
          />
        </View>

        <SettingsMenuItem
          icon="logout"
          label="Log out"
          destructive
          showChevron={false}
          onPress={onLogout}
        />

        <Text style={styles.versionText}>{versionLabel}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};
