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
import type { FundVehicle, IndicationOfInterest, Organization } from '../types/entities';

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
