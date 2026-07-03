import NetInfo from '@react-native-community/netinfo';

export interface ReverseGeocodeResult {
  formattedAddress: string;
  locateLabel: string;
  buildingStreet: string;
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

const buildLocateLabel = (address: Record<string, string | undefined>): string => {
  const parts = [
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.city,
    address.town,
    address.village,
    address.state,
    address.country,
  ]
    .map(part => part?.trim())
    .filter(Boolean);

  return [...new Set(parts)].slice(0, 3).join(', ');
};

const buildBuildingStreet = (address: Record<string, string | undefined>): string => {
  const road = address.road ?? address.pedestrian ?? address.residential ?? '';
  const houseNumber = address.house_number ?? '';
  const street = [houseNumber, road].filter(Boolean).join(' ').trim();
  if (street) {
    return street;
  }
  return address.building ?? address.amenity ?? '';
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const network = await NetInfo.fetch();
  if (!network.isConnected) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url =
      `${NOMINATIM_REVERSE_URL}?format=jsonv2` +
      `&lat=${encodeURIComponent(String(latitude))}` +
      `&lon=${encodeURIComponent(String(longitude))}` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'Preelly/1.0 (listing-location)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    const address = payload.address ?? {};
    const locateLabel = buildLocateLabel(address);
    const buildingStreet = buildBuildingStreet(address);
    const formattedAddress =
      payload.display_name?.trim() ||
      [buildingStreet, locateLabel].filter(Boolean).join(', ');

    if (!formattedAddress) {
      return null;
    }

    return {
      formattedAddress,
      locateLabel: locateLabel || formattedAddress,
      buildingStreet: buildingStreet || formattedAddress,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
