export type RenoSubscriptionFixedOverrideInput = {
  isRenoSubscription: boolean;
  installmentMethod?: string | null;
  upfrontAmount?: number | null;
  installmentAmount?: number | null;
  tenure?: number | null;
  bonusValue?: number | null;
};

/**
 * For Reno Subscription (installment plan) with Fixed installment method,
 * the "original nett / contract sum" should be represented as:
 *   upfront + (fixedInstallmentAmount * tenure) - bonus
 *
 * Returns null when criteria isn't met or required values are missing.
 */
export function getRenoSubscriptionFixedOverrideNettAmount(
  input: RenoSubscriptionFixedOverrideInput,
): number | null {
  if (!input.isRenoSubscription) return null;
  if (input.installmentMethod !== "fixed") return null;

  const tenure = Number(input.tenure ?? 0);
  const installmentAmount = Number(input.installmentAmount ?? 0);
  const upfrontAmount = Number(input.upfrontAmount ?? 0);
  const bonusValue = Number(input.bonusValue ?? 0);

  if (!Number.isFinite(tenure) || tenure <= 0) return null;
  if (!Number.isFinite(installmentAmount) || installmentAmount <= 0) return null;
  if (!Number.isFinite(upfrontAmount) || upfrontAmount < 0) return null;
  if (!Number.isFinite(bonusValue) || bonusValue < 0) return null;

  const total = upfrontAmount + installmentAmount * tenure - bonusValue;
  return Number.isFinite(total) ? Math.max(0, total) : null;
}


