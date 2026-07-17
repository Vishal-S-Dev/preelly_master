import { API_ENDPOINTS } from '../../constants/appConstants';
import {
  StorageFacilitiesResponse,
  StorageFacility,
  StorageFacilityApiDto,
} from '../../types/checkout.types';
import { ProductApi } from './ProductApi';
import { httpClient } from './httpClient';

const mapFacility = (dto: StorageFacilityApiDto): StorageFacility => ({
  id: dto.id,
  facilityWeek: dto.facilityWeek?.trim() || 'Plan',
  facilityAmount: Number(dto.facilityAmount ?? 0),
  imageIcon: dto.imageIcon ? ProductApi.withBase(dto.imageIcon) : undefined,
  displayOrder: dto.displayOrder ?? 999,
  status: dto.status !== false,
});

export const StorageFacilityApi = {
  async getActiveFacilities(): Promise<StorageFacility[]> {
    const { data } = await httpClient.get<
      StorageFacilitiesResponse | StorageFacilityApiDto[]
    >(API_ENDPOINTS.STORAGE_FACILITIES);

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return list
      .map(mapFacility)
      .filter(item => item.status)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
};
