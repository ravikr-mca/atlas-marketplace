import type { IndicationOfInterest, IndicationStatus } from '../../types/entities';

// Coverage targets (enforced by seed.test.ts): all 11 statuses appear; every verified
// investor has at least one indication so their dashboard is never empty; pending and
// unverified investors have none (the empty-state demo, and the reason is explainable:
// they can't submit until Greenstone verifies them).
//
// Compact builder: [id, fund, lpOrg, requested, status, allocated, submittedAt, updatedAt, notes?]
// ind-1..ind-3 keep their original values (ind-3 gains the allocated amount it was
// always implied to have — a SIGNED indication without one was a seed inconsistency).
type Spec = [string, string, string, number, IndicationStatus, number | undefined, string, string?, string?];

const M = 1_000_000;

const SPECS: Spec[] = [
  ['ind-1', 'fv-1', 'org-lp-1', 15 * M, 'UNDER_REVIEW', undefined, '2026-09-20T09:00:00Z'],
  [
    'ind-2', 'fv-2', 'org-lp-2', 30 * M, 'ALLOCATED_PARTIAL', 22 * M, '2026-09-05T09:00:00Z', '2026-09-18T11:00:00Z',
    'Scaled back pro-rata — the book closed oversubscribed against the hard cap.',
  ],
  ['ind-3', 'fv-3', 'org-lp-3', 8 * M, 'SIGNED', 8 * M, '2026-09-10T09:00:00Z', '2026-09-24T09:00:00Z'],
  ['ind-4', 'fv-1', 'org-lp-4', 5 * M, 'ALLOCATED_FULL', 5 * M, '2026-09-22T10:00:00Z'],
  ['ind-5', 'fv-1', 'org-lp-5', 10 * M, 'SUBMITTED', undefined, '2026-10-01T14:20:00Z'],
  [
    'ind-6', 'fv-1', 'org-lp-2', 20 * M, 'DRAFT', undefined, '2026-09-30T16:00:00Z', undefined,
    'Saved as a draft — awaiting investment-committee approval before submitting.',
  ],
  [
    'ind-7', 'fv-2', 'org-lp-3', 100 * M, 'ALLOCATED_PARTIAL', 75 * M, '2026-09-04T08:00:00Z', '2026-09-17T12:00:00Z',
    'Scaled back pro-rata — the book covered the cap roughly 1.4x.',
  ],
  [
    'ind-8', 'fv-2', 'org-lp-1', 25 * M, 'UNDER_REVIEW', 0, '2026-09-25T09:30:00Z', undefined,
    'Waitlisted: the book is oversubscribed, so this indication currently receives no allocation.',
  ],
  [
    'ind-9', 'fv-2', 'org-lp-4', 10 * M, 'WITHDRAWN', undefined, '2026-09-06T09:00:00Z', '2026-09-19T15:00:00Z',
    'Withdrawn by the investor: the indicative allocation fell below their mandate minimum.',
  ],
  ['ind-10', 'fv-3', 'org-lp-5', 3 * M, 'ALLOCATED_FULL', 3 * M, '2026-09-26T07:00:00Z'],
  ['ind-11', 'fv-3', 'org-lp-4', 2 * M, 'SUBSCRIPTION_SENT', 2 * M, '2026-09-15T09:00:00Z', '2026-09-27T09:00:00Z'],
  ['ind-12', 'fv-4', 'org-lp-1', 20 * M, 'KYC_VERIFIED', 20 * M, '2026-09-02T09:00:00Z', '2026-09-29T09:00:00Z'],
  ['ind-13', 'fv-4', 'org-lp-3', 60 * M, 'UNDER_REVIEW', undefined, '2026-09-28T11:00:00Z'],
  [
    'ind-14', 'fv-4', 'org-lp-5', 10 * M, 'DECLINED', undefined, '2026-09-12T09:00:00Z', '2026-09-14T10:00:00Z',
    'Declined by the manager: allocation at this close is reserved for existing Fund I investors.',
  ],
  [
    'ind-15', 'fv-5', 'org-lp-3', 150 * M, 'ALLOCATED_PARTIAL', 120 * M, '2026-08-20T09:00:00Z', '2026-09-30T09:00:00Z',
    'Scaled back pro-rata ahead of the final close.',
  ],
  ['ind-16', 'fv-5', 'org-lp-2', 40 * M, 'ALLOCATED_FULL', 40 * M, '2026-08-22T09:00:00Z', '2026-09-30T09:05:00Z'],
  ['ind-17', 'fv-5', 'org-lp-1', 25 * M, 'SUBSCRIPTION_SENT', 25 * M, '2026-08-25T09:00:00Z', '2026-09-30T09:10:00Z'],
  ['ind-18', 'fv-5', 'org-lp-4', 5 * M, 'UNDER_REVIEW', undefined, '2026-09-29T08:00:00Z'],
  ['ind-19', 'fv-6', 'org-lp-2', 15 * M, 'UNDER_REVIEW', undefined, '2026-09-27T10:00:00Z'],
  ['ind-20', 'fv-6', 'org-lp-5', 5 * M, 'ALLOCATED_FULL', 5 * M, '2026-09-29T10:00:00Z'],
  ['ind-21', 'fv-7', 'org-lp-1', 30 * M, 'FUNDED', 30 * M, '2026-03-10T09:00:00Z', '2026-08-28T09:00:00Z'],
  ['ind-22', 'fv-7', 'org-lp-2', 50 * M, 'FUNDED', 50 * M, '2026-03-12T09:00:00Z', '2026-08-28T09:10:00Z'],
  ['ind-23', 'fv-7', 'org-lp-3', 100 * M, 'FUNDED', 100 * M, '2026-03-15T09:00:00Z', '2026-08-28T09:20:00Z'],
  [
    'ind-24', 'fv-8', 'org-lp-5', 8 * M, 'DECLINED', undefined, '2026-07-20T09:00:00Z', '2026-09-12T09:00:00Z',
    'Listing withdrawn by the manager (financing round restructured). Indication released.',
  ],
  ['ind-25', 'fv-10', 'org-lp-4', 4 * M, 'ALLOCATED_FULL', 4 * M, '2026-08-10T09:00:00Z'],
  ['ind-26', 'fv-10', 'org-lp-2', 12 * M, 'UNDER_REVIEW', undefined, '2026-09-10T09:00:00Z'],
  ['ind-27', 'fv-11', 'org-lp-1', 15 * M, 'SUBMITTED', undefined, '2026-10-02T06:30:00Z'],
  ['ind-28', 'fv-12', 'org-lp-3', 80 * M, 'ALLOCATED_FULL', 80 * M, '2026-09-18T09:00:00Z'],
];

export const indications: IndicationOfInterest[] = SPECS.map(
  ([id, fundVehicleId, lpOrganizationId, requestedAmountUsd, status, allocatedAmountUsd, submittedAt, updatedAt, notes], i) => ({
    id,
    idempotencyKey: `seed-${i + 1}`,
    fundVehicleId,
    lpOrganizationId,
    requestedAmountUsd,
    allocatedAmountUsd,
    status,
    submittedAt,
    updatedAt: updatedAt ?? submittedAt,
    notes,
  }),
);
