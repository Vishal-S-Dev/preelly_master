import { FeedPage } from '../../domain/models/FeedItem';
import { FeedRepository } from '../../domain/repository/FeedRepository';
import { FeedApi } from '../api/feedApi';

export class FeedRepositoryImpl implements FeedRepository {
  async getFeed(page: number, limit: number): Promise<FeedPage> {
    const response = await FeedApi.getFeed(page, limit);
    return {
      page: response.reelsMeta?.page ?? page,
      hasMore: Boolean(response.reelsMeta?.hasMore),
      items: response.reels.map(item => ({
        id: item._id ?? item.id ?? '',
        title: item.title ?? 'Untitled',
        subtitle: item.description ?? '',
        price: `${item.currency ?? 'AED'} ${(item.price ?? 0).toLocaleString()}`,
        mediaUrl: item.video ?? item.images?.[0] ?? '',
        thumbnail: item.images?.[0] ?? '',
        mediaType: item.video ? 'video' : 'image',
        likes: item.likesCount ?? 0,
        comments: item.commentCount ?? 0,
        shares: 0,
        isAvailable: true,
        user: {
          name: item.seller?.name ?? 'Seller',
          avatar: item.seller?.avatar ?? '',
        },
        liked: Boolean(item.liked),
        isPaused: false,
      })),
    };
  }
}
