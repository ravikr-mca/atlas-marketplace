// A small, honestly-fake API layer standing in for the Laravel API described in the
// proposal. Deliberately plain async functions rather than MSW — the point of this
// prototype is to demonstrate frontend architecture, not a mocked network layer. See
// DESIGN.md / proposal for the "what I'd add first" note on this trade-off.
import {
  currentUser,
  dataRoomDocuments,
  fundVehicles,
  indications,
  organizations,
} from './data';
import type { FundVehicle, IndicationOfInterest, IndicationStatus, Organization } from '../types/entities';

const LATENCY_MS = 350;
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

// In-memory store standing in for the DB — mutated by submitIndication below so the
// "% subscribed" and allocation flows are genuinely stateful across a session.
let fundVehicleStore = [...fundVehicles];
let indicationStore = [...indications];
const seenIdempotencyKeys = new Set(indicationStore.map((i) => i.idempotencyKey));

export async function fetchFundVehicles(): Promise<FundVehicle[]> {
  return delay(fundVehicleStore);
}

export async function fetchFundVehicle(id: string): Promise<FundVehicle | undefined> {
  return delay(fundVehicleStore.find((f) => f.id === id));
}

export async function fetchOrganization(id: string): Promise<Organization | undefined> {
  return delay(organizations.find((o) => o.id === id));
}

export async function fetchOrganizations(): Promise<Organization[]> {
  return delay(organizations);
}

export async function fetchIndicationsForFundVehicle(fundVehicleId: string): Promise<IndicationOfInterest[]> {
  return delay(indicationStore.filter((i) => i.fundVehicleId === fundVehicleId));
}

export async function fetchIndicationsForOrg(orgId: string): Promise<IndicationOfInterest[]> {
  return delay(indicationStore.filter((i) => i.lpOrganizationId === orgId));
}

export async function fetchIndicationsForGpOrg(gpOrganizationId: string): Promise<IndicationOfInterest[]> {
  const ownFundIds = new Set(fundVehicleStore.filter((f) => f.gpOrganizationId === gpOrganizationId).map((f) => f.id));
  return delay(indicationStore.filter((i) => ownFundIds.has(i.fundVehicleId)));
}

// Admin/Compliance oversight — every indication across every fund, for audit and
// dispute resolution. Real RBAC would gate this endpoint to ADMIN/COMPLIANCE roles
// server-side; the frontend gate is in DashboardPage's viewAs switch.
export async function fetchAllIndications(): Promise<IndicationOfInterest[]> {
  return delay(indicationStore);
}

export async function fetchDataRoomDocuments(fundVehicleId: string) {
  return delay(dataRoomDocuments.filter((d) => d.fundVehicleId === fundVehicleId));
}

export interface SubmitIndicationInput {
  idempotencyKey: string;
  fundVehicleId: string;
  lpOrganizationId: string;
  requestedAmountUsd: number;
  notes?: string;
}

/**
 * Server-authoritative submission: re-checks the fund's live committed total at write
 * time (not against whatever the client last rendered), and applies pro-rata scale-back
 * if this submission would push the fund past its hard cap. This is the concrete answer
 * to the brief's "concurrent bids and race conditions" requirement — two LPs racing to
 * submit near a cap both get a consistent, server-decided outcome rather than a
 * first-write-wins UI illusion.
 */
export async function submitIndication(input: SubmitIndicationInput): Promise<IndicationOfInterest> {
  await delay(null);

  const existing = indicationStore.find((i) => i.idempotencyKey === input.idempotencyKey);
  if (existing) return existing; // idempotent retry — no duplicate created

  const fund = fundVehicleStore.find((f) => f.id === input.fundVehicleId);
  if (!fund) throw new Error('Fund vehicle not found');

  const now = new Date().toISOString();
  const remainingCapacity = fund.hardCapUsd - fund.committedUsd;
  const allocatedAmountUsd = Math.max(0, Math.min(input.requestedAmountUsd, remainingCapacity));
  const isPartial = allocatedAmountUsd < input.requestedAmountUsd;
  const isFull = allocatedAmountUsd === input.requestedAmountUsd && allocatedAmountUsd > 0;

  const indication: IndicationOfInterest = {
    id: `ind-${Date.now()}`,
    idempotencyKey: input.idempotencyKey,
    fundVehicleId: input.fundVehicleId,
    lpOrganizationId: input.lpOrganizationId,
    requestedAmountUsd: input.requestedAmountUsd,
    allocatedAmountUsd,
    status: isFull ? 'ALLOCATED_FULL' : isPartial && allocatedAmountUsd > 0 ? 'ALLOCATED_PARTIAL' : 'UNDER_REVIEW',
    submittedAt: now,
    updatedAt: now,
    notes: input.notes,
  };

  seenIdempotencyKeys.add(input.idempotencyKey);
  indicationStore = [...indicationStore, indication];
  fundVehicleStore = fundVehicleStore.map((f) =>
    f.id === fund.id
      ? {
          ...f,
          committedUsd: f.committedUsd + allocatedAmountUsd,
          status: f.committedUsd + allocatedAmountUsd >= f.hardCapUsd ? 'OVERSUBSCRIBED' : f.status,
        }
      : f,
  );

  return indication;
}

export async function fetchCurrentUser() {
  return delay(currentUser);
}

// The legal edges of the state diagram (proposal/diagrams/state-diagram.md), enforced
// here so the UI can only ever request a transition the documented lifecycle allows —
// an "illegal transition" is a bug in the caller, not a state the data can reach.
export type IndicationAction = 'DECLINE' | 'WITHDRAW' | 'ACCEPT_ALLOCATION' | 'ADVANCE';
type Action = IndicationAction;
const transitions: Partial<Record<IndicationStatus, Partial<Record<Action, IndicationStatus>>>> = {
  UNDER_REVIEW: { DECLINE: 'DECLINED', WITHDRAW: 'WITHDRAWN' },
  ALLOCATED_FULL: { ACCEPT_ALLOCATION: 'SUBSCRIPTION_SENT' },
  ALLOCATED_PARTIAL: { ACCEPT_ALLOCATION: 'SUBSCRIPTION_SENT', WITHDRAW: 'WITHDRAWN' },
  SUBSCRIPTION_SENT: { ADVANCE: 'KYC_VERIFIED' },
  KYC_VERIFIED: { ADVANCE: 'SIGNED' },
  SIGNED: { ADVANCE: 'FUNDED' },
};

const RELEASES_CAPACITY: Action[] = ['DECLINE', 'WITHDRAW'];

export async function transitionIndication(
  id: string,
  action: Action,
  notes?: string,
): Promise<IndicationOfInterest> {
  await delay(null);

  const current = indicationStore.find((i) => i.id === id);
  if (!current) throw new Error('Indication not found');

  const nextStatus = transitions[current.status]?.[action];
  if (!nextStatus) {
    throw new Error(`Illegal transition: cannot ${action} an indication in status ${current.status}`);
  }

  const now = new Date().toISOString();
  const updated: IndicationOfInterest = { ...current, status: nextStatus, updatedAt: now, notes: notes ?? current.notes };
  indicationStore = indicationStore.map((i) => (i.id === id ? updated : i));

  // Declining or withdrawing an allocated indication frees its share of the hard cap
  // back to the fund — an oversubscribed fund can un-oversubscribe if enough LPs walk.
  if (RELEASES_CAPACITY.includes(action) && current.allocatedAmountUsd) {
    fundVehicleStore = fundVehicleStore.map((f) =>
      f.id === current.fundVehicleId
        ? {
            ...f,
            committedUsd: f.committedUsd - current.allocatedAmountUsd!,
            status: f.status === 'OVERSUBSCRIBED' && f.committedUsd - current.allocatedAmountUsd! < f.hardCapUsd
              ? 'OPEN'
              : f.status,
          }
        : f,
    );
  }

  return updated;
}
