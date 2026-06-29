import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { notificationRepository } from '../../data/repository/NotificationRepositoryImpl';
import {
  NotificationItem,
  NotificationSection,
  NotificationTab,
} from '../../types/notification.types';
import { getNotificationDayLabel } from '../../utils/notificationTime';

const PAGE_SIZE = 20;

export const notificationQueryKey = (tab: NotificationTab) => ['notifications', tab] as const;

export const useNotifications = (tab: NotificationTab) => {
  const query = useInfiniteQuery({
    queryKey: notificationQueryKey(tab),
    queryFn: ({ pageParam }) =>
      notificationRepository.getPage({
        tab,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length + 1 : undefined),
    staleTime: 20_000,
    retry: 1,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data?.pages],
  );

  const buyingUnread = query.data?.pages[0]?.buyingUnread ?? 0;
  const sellingUnread = query.data?.pages[0]?.sellingUnread ?? 0;

  const followRequests = useMemo(
    () => items.filter(item => item.type === 'follow_request'),
    [items],
  );

  const sections = useMemo((): NotificationSection[] => {
    const map = new Map<string, NotificationItem[]>();
    items.forEach(item => {
      const label = getNotificationDayLabel(item.createdAt);
      const bucket = map.get(label) ?? [];
      bucket.push(item);
      map.set(label, bucket);
    });

    const order = ['Today', 'Yesterday'];
    const labels = [...map.keys()].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      return a.localeCompare(b);
    });

    return labels.map(title => ({ title, data: map.get(title) ?? [] }));
  }, [items]);

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    ...query,
    items,
    sections,
    followRequests,
    buyingUnread,
    sellingUnread,
    refresh,
  };
};

export const useNotificationActions = () => {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationRepository.markRead(notificationId),
    onSuccess: invalidateAll,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationRepository.markAllRead(),
    onSuccess: invalidateAll,
  });

  const acceptFollowMutation = useMutation({
    mutationFn: (followerId: string) => notificationRepository.acceptFollowRequest(followerId),
    onSuccess: invalidateAll,
  });

  const rejectFollowMutation = useMutation({
    mutationFn: (followerId: string) => notificationRepository.rejectFollowRequest(followerId),
    onSuccess: invalidateAll,
  });

  return {
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    acceptFollow: acceptFollowMutation.mutateAsync,
    rejectFollow: rejectFollowMutation.mutateAsync,
    acceptLoadingId: acceptFollowMutation.variables,
    rejectLoadingId: rejectFollowMutation.variables,
    isAccepting: acceptFollowMutation.isPending,
    isRejecting: rejectFollowMutation.isPending,
    removeLocally: useCallback(
      (notificationId: string) => {
        queryClient.setQueriesData<{ pages: { items: NotificationItem[] }[] }>(
          { queryKey: ['notifications'] },
          old => {
            if (!old?.pages) {
              return old;
            }
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                items: page.items.filter(item => item.id !== notificationId),
              })),
            };
          },
        );
      },
      [queryClient],
    ),
    markReadLocally: useCallback(
      (notificationId: string) => {
        queryClient.setQueriesData<{ pages: { items: NotificationItem[] }[] }>(
          { queryKey: ['notifications'] },
          old => {
            if (!old?.pages) {
              return old;
            }
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                items: page.items.map(item =>
                  item.id === notificationId ? { ...item, isRead: true } : item,
                ),
              })),
            };
          },
        );
      },
      [queryClient],
    ),
  };
};
