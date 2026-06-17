import { ProductRepository } from '../repository/ProductRepository';

export class LikeProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  execute(productId: string) {
    return this.repo.likeProduct(productId);
  }
}

export class SaveProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  execute(productId: string) {
    return this.repo.saveProduct(productId);
  }
}
