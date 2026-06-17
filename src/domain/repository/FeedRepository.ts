import { FeedPage } from '../models/FeedItem';

export interface FeedRepository {
  getFeed(page: number, limit: number): Promise<FeedPage>;
}
