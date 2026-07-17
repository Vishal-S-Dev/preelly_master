import { AdPackage } from '../types/package.types';
import { StorageFacility } from '../types/checkout.types';

/** Fixed pickup/storage base fee shown in Place an Ad checkout (design). */
export const STORAGE_FACILITY_FIX_COST = 89.99;

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const formatAed = (value: number, digits = 2): string =>
  `AED ${roundMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

export interface CheckoutTotalsInput {
  adPackage: AdPackage;
  storageEnabled: boolean;
  selectedFacility: StorageFacility | null;
  fixCost?: number;
}

export interface CheckoutTotals {
  packageAmount: number;
  storageFixCost: number;
  storagePlanCost: number;
  storageTotal: number;
  includeStorageInSummary: boolean;
  vatRatePercent: number;
  vatAmount: number;
  subtotal: number;
  total: number;
}

/**
 * Checkout math aligned with reference:
 * - Storage summary rows appear only when a week plan is selected
 * - Storage line = Fix Cost + selected week amount
 * - Subtotal = packageAmount + storageTotal (when included)
 * - VAT = subtotal × package VAT % (when VAT applicable)
 * - Total = subtotal + VAT
 */
export const computeCheckoutTotals = ({
  adPackage,
  storageEnabled,
  selectedFacility,
  fixCost = STORAGE_FACILITY_FIX_COST,
}: CheckoutTotalsInput): CheckoutTotals => {
  const packageAmount = roundMoney(adPackage.packageAmount);
  const vatRatePercent = adPackage.isVatApplicable
    ? Number(adPackage.vatAmount || 5)
    : 0;

  const includeStorageInSummary = Boolean(
    storageEnabled && selectedFacility,
  );
  const storagePlanCost = includeStorageInSummary
    ? roundMoney(selectedFacility!.facilityAmount)
    : 0;
  const storageFixCost = includeStorageInSummary ? roundMoney(fixCost) : 0;
  const storageTotal = includeStorageInSummary
    ? roundMoney(storageFixCost + storagePlanCost)
    : 0;

  const subtotal = roundMoney(packageAmount + storageTotal);
  const vatAmount = adPackage.isVatApplicable
    ? roundMoney(subtotal * (vatRatePercent / 100))
    : 0;
  const total = roundMoney(subtotal + vatAmount);

  return {
    packageAmount,
    storageFixCost,
    storagePlanCost,
    storageTotal,
    includeStorageInSummary,
    vatRatePercent,
    vatAmount,
    subtotal,
    total,
  };
};
