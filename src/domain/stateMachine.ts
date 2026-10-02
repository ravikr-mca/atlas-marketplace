import type { IndicationStatus } from '../types/entities';

/**
 * The legal edges of the indication lifecycle (proposal/diagrams/state-diagram.md).
 * One table, used by the mock API to enforce, by the UI to decide which buttons to
 * offer, and by statusInfo to explain "what happens next" — so none of them can drift.
 */

export type IndicationAction =
  | 'SUBMIT' // investor sends a saved draft
  | 'START_REVIEW' // manager picks up a freshly submitted indication
  | 'DECLINE' // manager declines (a reason is required and shown to the investor)
  | 'WITHDRAW' // investor withdraws
  | 'ACCEPT_ALLOCATION' // investor accepts the allocated amount
  | 'ADVANCE'; // manager moves the subscription forward: KYC -> signature -> funded

export type ActingParty = 'LP' | 'GP';

export interface Transition {
  to: IndicationStatus;
  actor: ActingParty;
}

export const INDICATION_TRANSITIONS: Record<IndicationStatus, Partial<Record<IndicationAction, Transition>>> = {
  DRAFT: { SUBMIT: { to: 'SUBMITTED', actor: 'LP' }, WITHDRAW: { to: 'WITHDRAWN', actor: 'LP' } },
  SUBMITTED: { START_REVIEW: { to: 'UNDER_REVIEW', actor: 'GP' }, WITHDRAW: { to: 'WITHDRAWN', actor: 'LP' } },
  UNDER_REVIEW: { DECLINE: { to: 'DECLINED', actor: 'GP' }, WITHDRAW: { to: 'WITHDRAWN', actor: 'LP' } },
  ALLOCATED_FULL: { ACCEPT_ALLOCATION: { to: 'SUBSCRIPTION_SENT', actor: 'LP' } },
  ALLOCATED_PARTIAL: {
    ACCEPT_ALLOCATION: { to: 'SUBSCRIPTION_SENT', actor: 'LP' },
    WITHDRAW: { to: 'WITHDRAWN', actor: 'LP' },
  },
  SUBSCRIPTION_SENT: { ADVANCE: { to: 'KYC_VERIFIED', actor: 'GP' } },
  KYC_VERIFIED: { ADVANCE: { to: 'SIGNED', actor: 'GP' } },
  SIGNED: { ADVANCE: { to: 'FUNDED', actor: 'GP' } },
  DECLINED: {},
  WITHDRAWN: {},
  FUNDED: {},
};

export const nextTransition = (status: IndicationStatus, action: IndicationAction) =>
  INDICATION_TRANSITIONS[status][action];

export const availableActions = (status: IndicationStatus) =>
  (Object.entries(INDICATION_TRANSITIONS[status]) as [IndicationAction, Transition][]).map(([action, t]) => ({
    action,
    ...t,
  }));

export const isTerminal = (status: IndicationStatus) => availableActions(status).length === 0;

/** Statuses in which an indication holds part of the fund's capacity. */
export const HOLDS_CAPACITY: readonly IndicationStatus[] = [
  'ALLOCATED_FULL',
  'ALLOCATED_PARTIAL',
  'SUBSCRIPTION_SENT',
  'KYC_VERIFIED',
  'SIGNED',
  'FUNDED',
];

/** Leaving the capacity-holding states for one of these hands the allocation back to the fund. */
export const RELEASES_CAPACITY: readonly IndicationAction[] = ['DECLINE', 'WITHDRAW'];

export const ACTIONS_REQUIRING_REASON: readonly IndicationAction[] = ['DECLINE'];
