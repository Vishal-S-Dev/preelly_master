import { FeedRepository } from '../repository/FeedRepository';

export class GetFeedUseCase {
  constructor(private readonly repository: FeedRepository) {}

  execute(page: number, limit: number) {
    return this.repository.getFeed(page, limit);
  }
}
