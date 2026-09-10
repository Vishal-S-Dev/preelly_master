import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  AdPackage,
  AdPackageApiDto,
  AdPackagesResponse,
} from '../../types/package.types';
import { httpClient } from './httpClient';

const mapPackage = (dto: AdPackageApiDto): AdPackage => ({
  id: dto.id,
  packageName: dto.packageName?.trim() || 'Package',
  displayOrder: dto.displayOrder ?? 999,
  packageAmount: Number(dto.packageAmount ?? 0),
  isVatApplicable: Boolean(dto.isVatApplicable),
  vatAmount: Number(dto.vatAmount ?? 0),
  vatValue: Number(dto.vatValue ?? 0),
  totalAmount: Number(dto.totalAmount ?? dto.packageAmount ?? 0),
  validityDays: Number(dto.validityDays ?? 0),
  isRecommended: Boolean(dto.isRecommended ?? dto.isRecomended),
  packageFeatures: Array.isArray(dto.packageFeatures)
    ? dto.packageFeatures.filter(Boolean)
    : [],
  status: dto.status !== false,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  createdBy: dto.createdBy,
  updatedBy: dto.updatedBy,
});

export const PackageApi = {
  /** Backend scopes packages by the product's category + price when `productId` is given
   * (matches web's `SelectPackagePage`); omitting it returns the full, unscoped package list. */
  async getActivePackages(productId?: string): Promise<AdPackage[]> {
    const { data } = await httpClient.get<AdPackagesResponse | AdPackageApiDto[]>(
      API_ENDPOINTS.PACKAGES,
      productId ? { params: { productId } } : undefined,
    );

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return list
      .map(mapPackage)
      .filter(item => item.status)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
};
