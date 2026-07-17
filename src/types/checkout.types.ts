export interface CheckoutListingSnapshot {
  productId?: string;
  title: string;
  categoryName: string;
  imageUrl?: string;
  year?: string;
  mileage?: string;
  priceLabel: string;
  priceValue: number;
}

export interface StorageFacility {
  id: string;
  facilityWeek: string;
  facilityAmount: number;
  imageIcon?: string;
  displayOrder: number;
  status: boolean;
}

export interface StorageFacilityApiDto {
  id: string;
  facilityWeek?: string;
  facilityAmount?: number;
  imageIcon?: string | null;
  displayOrder?: number;
  status?: boolean;
}

export interface StorageFacilitiesResponse {
  success?: boolean;
  message?: string;
  data?: StorageFacilityApiDto[];
}
