import { FeedRepository } from '../repository/FeedRepository';

export class GetFeedUseCase {
  constructor(private readonly repo: FeedRepository) {}
  execute(page: number, limit: number) {
    return this.repo.getFeed(page, limit);
  }
}
