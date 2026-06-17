import { httpClient } from './httpClient';
import { FeedDataResponseDto, FeedReelDto } from '../dto/FeedDTO';

export type FeedType = 'trending' | 'following';

const mockReels = (start: number, limit: number): FeedReelDto[] => {
  const samples = [
    {
      title: 'Lexus ES-Series ES 350',
      subtitle: '2022 · 76,500 km · American Specs',
      price: 'AED 100,000',
      mediaType: 'image' as const,
      mediaUrl:
        'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'BMW 5 Series M Sport',
      subtitle: '2021 · 42,000 km · GCC Specs',
      price: 'AED 145,000',
      mediaType: 'video' as const,
      mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    {
      title: 'Mercedes C200 AMG',
      subtitle: '2023 · 18,000 km · Full Option',
      price: 'AED 189,000',
      mediaType: 'video' as const,
      mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    },
  ];

  return Array.from({ length: limit }, (_, idx) => {
    const seed = start + idx;
    const sample = samples[seed % samples.length];
    return {
      _id: `feed_${seed}`,
      title: sample.title,
      description: sample.subtitle,
      price: Number(sample.price.replace(/[^\d]/g, '')) || 0,
      currency: 'AED',
      video: sample.mediaType === 'video' ? sample.mediaUrl : null,
      images: [sample.mediaType === 'image' ? sample.mediaUrl : `https://picsum.photos/seed/preelly-${seed}/900/1600`],
      likesCount: 100 + seed * 9,
      commentCount: 20 + seed * 3,
      views: 1000 + seed * 17,
      liked: false,
      saved: false,
      location: 'Dubai, UAE',
      createdAt: new Date().toISOString(),
      seller: {
        name: `Dealer ${seed % 8}`,
        avatar: `https://i.pravatar.cc/200?img=${(seed % 60) + 1}`,
      },
    };
  });
};

export const FeedApi = {
  async getFeed(
    page: number,
    limit: number,
    feedType: FeedType = 'trending',
  ): Promise<FeedDataResponseDto> {
    try {
      const endpoint =
        feedType === 'following'
          ? '/api/feed/following'
          : '/api/feed/trending';
      const { data } = await httpClient.get<{
        feedType?: FeedType;
        posts?: FeedReelDto[];
        pageInfo?: { hasMore?: boolean };
      }>(endpoint, {
        params: { page, limit },
      });
      return {
        reels: data.posts ?? [],
        reelsMeta: {
          page,
          limit,
          hasMore: Boolean(data.pageInfo?.hasMore),
        },
      };
    } catch {
      await new Promise(resolve => setTimeout(resolve, 350));
      /*const start = (page - 1) * limit + 1;
      return {
        reels: mockReels(start, limit),
        reelsMeta: {
          page,
          limit,
          total: 200,
          hasMore: page < 8,
        },
        liked: [],
        saved: [],
        counts: { likes: 0, views: 0 },
        unreadCount: 0,
      };*/
    }
  },
};
