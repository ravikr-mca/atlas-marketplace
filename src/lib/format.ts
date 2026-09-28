export function formatUsdCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const strategyLabel: Record<string, string> = {
  PRIVATE_EQUITY_BUYOUT: 'Private Equity — Buyout',
  GROWTH_EQUITY: 'Growth Equity',
  VENTURE_CAPITAL: 'Venture Capital',
  PRIVATE_CREDIT: 'Private Credit',
  REAL_ASSETS: 'Real Assets',
  SECONDARIES: 'Secondaries',
};

export const fundStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open for Commitments',
  OVERSUBSCRIBED: 'Oversubscribed',
  ALLOCATING: 'Allocating',
  CLOSED: 'Closed',
  WITHDRAWN: 'Withdrawn',
};

export const indicationStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  ALLOCATED_FULL: 'Allocated (Full)',
  ALLOCATED_PARTIAL: 'Allocated (Partial)',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  SUBSCRIPTION_SENT: 'Subscription Docs Sent',
  KYC_VERIFIED: 'KYC Verified',
  SIGNED: 'Signed',
  FUNDED: 'Funded',
};
