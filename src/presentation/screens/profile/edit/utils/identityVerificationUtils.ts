export type IdentityVerificationCardStatus = 'none' | 'pending' | 'rejected' | 'approved';

const PENDING_STATUSES = new Set(['pending', 'in_review', 'submitted', 'under_review']);
const REJECTED_STATUSES = new Set(['rejected', 'declined', 'failed']);
const APPROVED_STATUSES = new Set(['approved', 'verified', 'accepted']);

export const resolveIdentityVerificationStatus = (input: {
  status?: string | null;
  identityVerifiedAt?: string | null;
}): IdentityVerificationCardStatus => {
  if (input.identityVerifiedAt) {
    return 'approved';
  }

  const normalized = input.status?.trim().toLowerCase();
  if (!normalized || normalized === 'none' || normalized === 'not_submitted') {
    return 'none';
  }
  if (PENDING_STATUSES.has(normalized)) {
    return 'pending';
  }
  if (REJECTED_STATUSES.has(normalized)) {
    return 'rejected';
  }
  if (APPROVED_STATUSES.has(normalized)) {
    return 'approved';
  }

  return 'none';
};

export const isProfileIdentityVerified = (input: {
  identityVerificationStatus?: string | null;
  identityVerifiedAt?: string | null;
  isVerified?: boolean;
}): boolean => {
  const hasIdentityFields =
    input.identityVerificationStatus != null || input.identityVerifiedAt != null;

  if (hasIdentityFields) {
    return (
      resolveIdentityVerificationStatus({
        status: input.identityVerificationStatus,
        identityVerifiedAt: input.identityVerifiedAt,
      }) === 'approved'
    );
  }

  return Boolean(input.isVerified);
};

export const shouldShowIdentityVerificationCard = (
  status: IdentityVerificationCardStatus,
): boolean => status !== 'approved';

export const isIdentityVerificationActionable = (
  status: IdentityVerificationCardStatus,
): boolean => status === 'none';

export const isIdentityVerificationCardClickable = (
  status: IdentityVerificationCardStatus,
): boolean => status === 'none';

export const getIdentityVerificationCardCopy = (
  status: IdentityVerificationCardStatus,
): { title: string; subtitle?: string; message?: string } => {
  switch (status) {
    case 'pending':
      return {
        title: 'Verification Pending',
        subtitle: 'Status: Under review',
        message:
          'We have received your Emirates ID documents. Our team is reviewing them and will update your profile once approved.',
      };
    case 'rejected':
      return {
        title: 'Verification Not Approved',
        subtitle: 'Status: Rejected',
        message: 'Your previous submission could not be approved. Please contact support for assistance.',
      };
    case 'none':
    default:
      return {
        title: 'Get Verified',
        subtitle: 'Verify your identity with Emirates ID',
      };
  }
};
