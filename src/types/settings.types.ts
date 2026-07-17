import type { IdentityVerificationCardStatus } from '../presentation/screens/profile/edit/utils/identityVerificationUtils';

export interface SettingsDashboardCounts {
  ads: number;
  searches: number;
  bookings: number;
  cart: number;
  drafts: number;
  archives: number;
}

export interface SettingsProfileSummary {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  verificationStatus: IdentityVerificationCardStatus;
  rejectionReason?: string | null;
}
