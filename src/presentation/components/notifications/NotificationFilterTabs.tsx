import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NotificationTab } from '../../../types/notification.types';
import { useNotificationStyles } from '../../hooks/useNotificationStyles';

interface TabConfig {
  key: NotificationTab;
  label: string;
  badge?: number;
}

interface Props {
  activeTab: NotificationTab;
  buyingUnread: number;
  sellingUnread: number;
  allUnread?: number;
  onChange: (tab: NotificationTab) => void;
}

export const NotificationFilterTabs = memo<Props>(
  ({ activeTab, buyingUnread, sellingUnread, allUnread = 0, onChange }) => {
    const { styles } = useNotificationStyles();

    const tabs: TabConfig[] = [
      { key: 'all', label: 'All', badge: allUnread },
      { key: 'buying', label: 'Buying', badge: buyingUnread },
      { key: 'selling', label: 'Selling', badge: sellingUnread },
    ];

    return (
      <View style={styles.tabsRow} accessibilityRole="tablist">
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${tab.label} notifications`}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              {tab.badge && tab.badge > 0 ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  },
);

NotificationFilterTabs.displayName = 'NotificationFilterTabs';
