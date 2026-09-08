export type ListingStatusTone = 'available' | 'sold' | 'reserved' | 'neutral';

export interface ListingStatusBadge {
  label: string;
  tone: ListingStatusTone;
}

export const LISTING_STATUS_TONE_STYLES: Record<
  ListingStatusTone,
  { backgroundColor: string; color: string }
> = {
  available: { backgroundColor: '#28C723', color: '#FFFFFF' },
  sold: { backgroundColor: '#64748B', color: '#FFFFFF' },
  reserved: { backgroundColor: '#F59E0B', color: '#FFFFFF' },
  neutral: { backgroundColor: '#F1F5F9', color: '#475569' },
};

/** Mirrors the web app's `getAvailabilityStatus` precedence (sold > paused > active >
 * any other status) so a listing shows the same badge on mobile and web. */
export const resolveListingStatusBadge = (item: {
  isSold?: boolean;
  status?: string;
}): ListingStatusBadge | null => {
  if (item.isSold || item.status === 'sold') {
    return { label: 'Sold', tone: 'sold' };
  }
  if (item.status === 'paused') {
    return { label: 'Reserved', tone: 'reserved' };
  }
  if (item.status === 'active') {
    return { label: 'Available', tone: 'available' };
  }
  if (item.status) {
    return { label: item.status.charAt(0).toUpperCase() + item.status.slice(1), tone: 'neutral' };
  }
  return null;
};
