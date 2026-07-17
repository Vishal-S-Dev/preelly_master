export interface AdPackageCreator {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface AdPackage {
  id: string;
  packageName: string;
  displayOrder: number;
  packageAmount: number;
  isVatApplicable: boolean;
  vatAmount: number;
  vatValue: number;
  totalAmount: number;
  validityDays: number;
  isRecommended: boolean;
  packageFeatures: string[];
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: AdPackageCreator;
  updatedBy?: AdPackageCreator;
}

export interface AdPackagesResponse {
  success?: boolean;
  message?: string;
  data?: AdPackageApiDto[];
  meta?: unknown;
}

/** Raw API shape (note: backend typo `isRecomended`). */
export interface AdPackageApiDto {
  id: string;
  packageName?: string;
  displayOrder?: number;
  packageAmount?: number;
  isVatApplicable?: boolean;
  vatAmount?: number;
  vatValue?: number;
  totalAmount?: number;
  validityDays?: number;
  isRecomended?: boolean;
  isRecommended?: boolean;
  packageFeatures?: string[];
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: AdPackageCreator;
  updatedBy?: AdPackageCreator;
}
