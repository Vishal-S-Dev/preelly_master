import NetInfo from '@react-native-community/netinfo';
import Config from 'react-native-config';

export interface PlaceSelection {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locateLabel: string;
  buildingStreet: string;
}

export interface PlaceSuggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
  source: 'google' | 'nominatim';
  placeId?: string;
  latitude?: number;
  longitude?: number;
  /** Pre-resolved address fields when search already returned structured data. */
  selection?: PlaceSelection;
}

const GOOGLE_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

const readGoogleMapsApiKey = (): string | null => {
  const fromConfig = Config.GOOGLE_MAPS_API_KEY;
  if (typeof fromConfig === 'string' && fromConfig.trim()) {
    return fromConfig.trim();
  }
  return null;
};

const buildLocateLabelFromComponents = (
  components: Array<{ long_name: string; short_name: string; types: string[] }>,
): string => {
  const find = (...types: string[]) =>
    components.find(item => types.some(type => item.types.includes(type)))?.long_name?.trim();

  const parts = [
    find('sublocality', 'sublocality_level_1', 'neighborhood'),
    find('locality'),
    find('administrative_area_level_2'),
    find('administrative_area_level_1'),
    find('country'),
  ].filter(Boolean) as string[];

  return [...new Set(parts)].slice(0, 3).join(', ');
};

const buildStreetFromComponents = (
  components: Array<{ long_name: string; short_name: string; types: string[] }>,
): string => {
  const find = (...types: string[]) =>
    components.find(item => types.some(type => item.types.includes(type)))?.long_name?.trim() ?? '';

  const street = [find('street_number'), find('route')].filter(Boolean).join(' ').trim();
  if (street) {
    return street;
  }
  return find('premise') || find('establishment') || find('point_of_interest');
};

const buildLocateLabelFromNominatim = (address: Record<string, string | undefined>): string => {
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

const buildStreetFromNominatim = (address: Record<string, string | undefined>): string => {
  const road = address.road ?? address.pedestrian ?? address.residential ?? '';
  const houseNumber = address.house_number ?? '';
  const street = [houseNumber, road].filter(Boolean).join(' ').trim();
  if (street) {
    return street;
  }
  return address.building ?? address.amenity ?? address.name ?? '';
};

const searchGooglePlaces = async (
  query: string,
  signal: AbortSignal,
  apiKey: string,
): Promise<PlaceSuggestion[]> => {
  const url =
    `${GOOGLE_AUTOCOMPLETE_URL}?input=${encodeURIComponent(query)}` +
    `&language=en` +
    `&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Places search failed');
  }

  const payload = (await response.json()) as {
    status?: string;
    predictions?: Array<{
      place_id: string;
      description?: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  if (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS') {
    throw new Error(payload.status ?? 'Places search unavailable');
  }

  return (payload.predictions ?? []).slice(0, 6).map(prediction => ({
    id: `google:${prediction.place_id}`,
    placeId: prediction.place_id,
    primaryText:
      prediction.structured_formatting?.main_text?.trim() ||
      prediction.description?.split(',')[0]?.trim() ||
      'Selected place',
    secondaryText:
      prediction.structured_formatting?.secondary_text?.trim() ||
      prediction.description?.trim() ||
      '',
    source: 'google' as const,
  }));
};

const searchNominatimPlaces = async (
  query: string,
  signal: AbortSignal,
): Promise<PlaceSuggestion[]> => {
  const url =
    `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(query)}` +
    `&format=jsonv2` +
    `&addressdetails=1` +
    `&limit=6`;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'Preelly/1.0 (listing-location)',
    },
  });

  if (!response.ok) {
    throw new Error('Address search failed');
  }

  const payload = (await response.json()) as Array<{
    place_id?: number | string;
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
    address?: Record<string, string>;
  }>;

  const suggestions: PlaceSuggestion[] = [];

  for (const item of payload ?? []) {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const address = item.address ?? {};
    const displayName = item.display_name?.trim() ?? '';
    const primary =
      item.name?.trim() ||
      address.road?.trim() ||
      displayName.split(',')[0]?.trim() ||
      'Selected place';
    const locateLabel = buildLocateLabelFromNominatim(address) || displayName;
    const buildingStreet = buildStreetFromNominatim(address) || primary;

    suggestions.push({
      id: `nominatim:${String(item.place_id ?? `${latitude},${longitude}`)}`,
      primaryText: primary,
      secondaryText: displayName,
      latitude,
      longitude,
      source: 'nominatim',
      selection: {
        latitude,
        longitude,
        formattedAddress: displayName || primary,
        locateLabel,
        buildingStreet,
      },
    });
  }

  return suggestions;
};

export const searchPlaces = async (
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const network = await NetInfo.fetch();
  if (!network.isConnected) {
    throw new Error('No internet connection');
  }

  const controller = signal ? undefined : new AbortController();
  const activeSignal = signal ?? controller!.signal;
  const timeoutId = setTimeout(() => {
    if (!signal) {
      controller?.abort();
    }
  }, 12000);

  try {
    const apiKey = readGoogleMapsApiKey();
    if (apiKey) {
      try {
        return await searchGooglePlaces(trimmed, activeSignal, apiKey);
      } catch {
        // Fall through to Nominatim when Places API is disabled or restricted.
      }
    }

    return await searchNominatimPlaces(trimmed, activeSignal);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const resolvePlaceSelection = async (
  suggestion: PlaceSuggestion,
  signal?: AbortSignal,
): Promise<PlaceSelection | null> => {
  const network = await NetInfo.fetch();
  if (!network.isConnected) {
    throw new Error('No internet connection');
  }

  const controller = signal ? undefined : new AbortController();
  const activeSignal = signal ?? controller!.signal;
  const timeoutId = setTimeout(() => {
    if (!signal) {
      controller?.abort();
    }
  }, 12000);

  try {
    if (suggestion.source === 'google' && suggestion.placeId) {
      const apiKey = readGoogleMapsApiKey();
      if (!apiKey) {
        return null;
      }

      const url =
        `${GOOGLE_DETAILS_URL}?place_id=${encodeURIComponent(suggestion.placeId)}` +
        `&fields=geometry,formatted_address,address_components,name` +
        `&language=en` +
        `&key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        signal: activeSignal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Unable to resolve place');
      }

      const payload = (await response.json()) as {
        status?: string;
        result?: {
          formatted_address?: string;
          name?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
          address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        };
      };

      if (payload.status !== 'OK' || !payload.result?.geometry?.location) {
        throw new Error(payload.status ?? 'Unable to resolve place');
      }

      const latitude = Number(payload.result.geometry.location.lat);
      const longitude = Number(payload.result.geometry.location.lng);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const components = payload.result.address_components ?? [];
      const locateLabel = buildLocateLabelFromComponents(components);
      const buildingStreet = buildStreetFromComponents(components);
      const formattedAddress =
        payload.result.formatted_address?.trim() ||
        [payload.result.name, suggestion.secondaryText].filter(Boolean).join(', ');

      return {
        latitude,
        longitude,
        formattedAddress: formattedAddress || suggestion.primaryText,
        locateLabel: locateLabel || suggestion.secondaryText || formattedAddress || suggestion.primaryText,
        buildingStreet:
          buildingStreet ||
          suggestion.primaryText ||
          formattedAddress ||
          suggestion.secondaryText,
      };
    }

    if (suggestion.selection) {
      return suggestion.selection;
    }

    if (
      suggestion.source === 'nominatim' &&
      Number.isFinite(suggestion.latitude) &&
      Number.isFinite(suggestion.longitude)
    ) {
      const latitude = Number(suggestion.latitude);
      const longitude = Number(suggestion.longitude);
      const displayName = suggestion.secondaryText || suggestion.primaryText;

      return {
        latitude,
        longitude,
        formattedAddress: displayName,
        locateLabel: displayName,
        buildingStreet: suggestion.primaryText || displayName,
      };
    }

    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
