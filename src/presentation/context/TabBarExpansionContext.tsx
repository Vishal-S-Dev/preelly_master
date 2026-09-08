import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface TabBarExpansionValue {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  /** Collapses the bar if it's currently expanded; a no-op otherwise. Safe to call on every
   * scroll frame — screens don't need to track whether the bar is open. */
  collapse: () => void;
}

const noop = () => undefined;

const TabBarExpansionContext = createContext<TabBarExpansionValue>({
  expanded: false,
  setExpanded: noop,
  collapse: noop,
});

/** Lifts `ExpandableCapsuleTabBar`'s expand/collapse state out of the bar itself so sibling
 * screens (the vertically-scrolling reel feeds) can force it closed once the user starts
 * scrolling video, matching how Instagram/TikTok collapse their nav chrome on scroll. */
export const TabBarExpansionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [expanded, setExpanded] = useState(false);

  const collapse = useCallback(() => {
    setExpanded(prev => (prev ? false : prev));
  }, []);

  const value = useMemo(
    () => ({ expanded, setExpanded, collapse }),
    [expanded, collapse],
  );

  return (
    <TabBarExpansionContext.Provider value={value}>{children}</TabBarExpansionContext.Provider>
  );
};

export const useTabBarExpansion = (): TabBarExpansionValue => useContext(TabBarExpansionContext);
