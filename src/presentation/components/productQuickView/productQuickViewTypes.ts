import { Product, QuickViewField } from '../../../domain/models/Product';

export interface ProductQuickViewData {
  product: Product;
  images: string[];
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  year: string;
  mileage: string;
  specsLabel: string;
  availability: string;
  seenByName: string;
  seenByOthers: number;
  postedOnLabel: string;
  locationTitle: string;
  locationAddress: string;
  quickViewData: QuickViewField[];
}
