import React, { useCallback, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';

const CAPSULE_BG = '#FFFFFF';
const INACTIVE_ICON_COLOR = '#8E8E93';
const COLLAPSED_ICON_COLOR = '#1F2937';
/** Breathing room below the safe-area inset — kept small so the bar sits low, close to the
 * screen edge, clear of the product-info overlay (title/price/captions) sitting above it. */
const MIN_BOTTOM_MARGIN = 2;
/** Left inset for the bar — it anchors and expands from here rather than screen-center, so it
 * doesn't grow into centered on-video content (seller captions, price badge, etc). */
const SIDE_MARGIN = 10;
// Damping is set above critical (2*sqrt(stiffness*mass) ≈ 27 here) so the capsule resize settles
// directly into place instead of overshooting/bouncing past its target width.
const CAPSULE_TRANSITION = LinearTransition.springify().damping(30).stiffness(180).mass(1);

/**
 * Floating overlay replacement for the default `@react-navigation/bottom-tabs` bar: a collapsed
 * circular trigger (showing the active tab's icon) that expands into a labeled capsule row on
 * tap. Reuses the library's own tab-press contract — `navigation.emit('tabPress', ...)` then
 * `navigation.dispatch(CommonActions.navigate(route))` unless a route's own `listeners` call
 * `preventDefault()` — so every existing per-tab behavior (Bookmark/Create redirects, Profile's
 * saved-tab param, etc.) keeps working unmodified. See `AppNavigator`'s `MainTabs.Tab.Screen`
 * listeners for what those per-route intercepts do.
 */
export const ExpandableCapsuleTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev;
      AccessibilityInfo.announceForAccessibility(
        next ? 'Navigation expanded' : 'Navigation collapsed',
      );
      return next;
    });
  }, []);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        expanded ? styles.wrapExpanded : styles.wrapCollapsed,
        { paddingBottom: insets.bottom + MIN_BOTTOM_MARGIN },
      ]}
    >
      <Animated.View layout={CAPSULE_TRANSITION} style={styles.shadowWrap}>
        <View style={styles.capsule}>
          {expanded ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              style={styles.expandedRow}
              accessibilityRole="tablist"
            >
              {state.routes.map((route, index) => {
                const focused = index === state.index;
                const { options } = descriptors[route.key];
                const label =
                  typeof options.tabBarLabel === 'string'
                    ? options.tabBarLabel
                    : (options.title ?? route.name);

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.dispatch({
                      ...CommonActions.navigate(route),
                      target: state.key,
                    });
                  }
                  setExpanded(false);
                };

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    style={[
                      styles.item,
                      focused && { backgroundColor: theme.pillBg },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: focused }}
                    accessibilityLabel={`${label} tab`}
                  >
                    {options.tabBarIcon?.({
                      focused,
                      color: focused ? theme.primary : INACTIVE_ICON_COLOR,
                      size: 22,
                    })}
                    <Text
                      style={[styles.itemLabel, focused && { color: theme.primary }]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
            >
              <Pressable
                onPress={toggleExpanded}
                style={styles.collapsedTrigger}
                accessibilityRole="button"
                accessibilityLabel="Expand navigation"
                accessibilityHint="Opens the full navigation menu"
              >
                <Icon name="menu" size={24} color={COLLAPSED_ICON_COLOR} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
    bottom: 0,
  },
  // Collapsed: shrink to the circle's own size, hugging the left edge.
  wrapCollapsed: {
    alignItems: 'flex-start',
  },
  // Expanded: stretch to fill the full left-to-right width (equal margins both sides) — the
  // stretch cascades down through shadowWrap → capsule → expandedRow, none of which override
  // `alignItems` (default 'stretch'), so no extra prop is needed on those.
  wrapExpanded: {
    alignItems: 'stretch',
  },
  // Shadow/elevation lives on this outer, non-clipping wrapper — iOS shadows render outside a
  // view's bounds, so they'd be invisible on a sibling with `overflow: 'hidden'` (which `capsule`
  // needs, to clip the Pressable ripple/highlight to the rounded shape).
  shadowWrap: {
    borderRadius: 32,
    backgroundColor: CAPSULE_BG,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 14 },
    }),
  },
  capsule: {
    backgroundColor: CAPSULE_BG,
    borderRadius: 32,
    overflow: 'hidden',
  },
  collapsedTrigger: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 66,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    gap: 2,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: INACTIVE_ICON_COLOR,
    marginTop: 2,
  },
});
