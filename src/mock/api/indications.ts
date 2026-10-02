import { fundAcceptsIndications } from '../../domain/fundRules';
import {
  ACTIONS_REQUIRING_REASON,
  RELEASES_CAPACITY,
  nextTransition,
  type IndicationAction,
} from '../../domain/stateMachine';
import type { Permission } from '../../auth/permissions';
import { appendAudit, clock, db, delay, wire, nextId, notifyOrg, persist } from '../db';
import { ApiError } from '../errors';
import { authorize } from './context';
import type { IndicationOfInterest, IndicationStatus } from '../../types/entities';

export type { IndicationAction };

const own = (orgId: string) => db.indications.filter((i) => i.lpOrganizationId === orgId);
const fundOf = (id: string) => db.funds.find((f) => f.id === id);

export async function fetchIndicationsForFundVehicle(fundVehicleId: string): Promise<IndicationOfInterest[]> {
  await delay(null);
  const fund = fundOf(fundVehicleId);
  const { user, org } = authorize();
  const all = db.indications.filter((i) => i.fundVehicleId === fundVehicleId);
  if (user.role === 'ADMIN' || user.role === 'COMPLIANCE') {
    authorize('ioi:view:all');
    return wire(all);
  }
  if (user.role === 'GP') {
    authorize('ioi:view:own-fund', { ownerOrganizationId: fund?.gpOrganizationId });
    return wire(all);
  }
  return wire(all.filter((i) => i.lpOrganizationId === org.id)); // an investor only ever sees its own
}

export async function fetchIndicationsForOrg(orgId: string): Promise<IndicationOfInterest[]> {
  await delay(null);
  const { user } = authorize();
  if (user.role === 'ADMIN' || user.role === 'COMPLIANCE') authorize('ioi:view:all');
  else authorize('ioi:view:own', { ownerOrganizationId: orgId });
  return wire(own(orgId));
}

export async function fetchIndicationsForGpOrg(gpOrganizationId: string): Promise<IndicationOfInterest[]> {
  await delay(null);
  const { user } = authorize();
  if (user.role === 'ADMIN' || user.role === 'COMPLIANCE') authorize('ioi:view:all');
  else authorize('ioi:view:own-fund', { ownerOrganizationId: gpOrganizationId });
  const ownFundIds = new Set(db.funds.filter((f) => f.gpOrganizationId === gpOrganizationId).map((f) => f.id));
  return wire(db.indications.filter((i) => ownFundIds.has(i.fundVehicleId)));
}

// Admin/Compliance oversight across every fund, for audit and dispute resolution.
export async function fetchAllIndications(): Promise<IndicationOfInterest[]> {
  await delay(null);
  authorize('ioi:view:all');
  return wire(db.indications);
}

export interface SubmitIndicationInput {
  idempotencyKey: string;
  fundVehicleId: string;
  requestedAmountUsd: number;
  notes?: string;
}

/**
 * Server-authoritative submission: re-checks the fund's live committed total at write
 * time (not against whatever the client last rendered), and scales back to the remaining
 * capacity if the request would push the fund past its hard cap. The investor's
 * organization comes from the session, never from the request body. This is the concrete
 * answer to the brief's "concurrent bids and race conditions" requirement.
 */
export async function submitIndication(input: SubmitIndicationInput): Promise<IndicationOfInterest> {
  await delay(null);
  const { user, org } = authorize('ioi:submit');

  const existing = db.indications.find((i) => i.idempotencyKey === input.idempotencyKey);
  if (existing) return wire(existing); // idempotent retry — no duplicate created

  const fund = fundOf(input.fundVehicleId);
  if (!fund || fund.status === 'DRAFT') throw new ApiError('NOT_FOUND', 'Fund not found.');

  const open = fundAcceptsIndications(fund, clock.date());
  if (!open.ok) throw new ApiError('FUND_NOT_OPEN', open.message);

  if (!Number.isFinite(input.requestedAmountUsd) || input.requestedAmountUsd < fund.minimumCommitmentUsd) {
    throw new ApiError('VALIDATION', `The minimum commitment for this fund is $${fund.minimumCommitmentUsd.toLocaleString('en-US')}.`);
  }
  const dup = own(org.id).find((i) => i.fundVehicleId === fund.id && i.status !== 'DECLINED' && i.status !== 'WITHDRAWN');
  if (dup) throw new ApiError('DUPLICATE_ACTIVE', 'Your organization already has an active indication in this fund. Withdraw it before submitting another.');

  const now = clock.iso();
  const remaining = Math.max(0, fund.hardCapUsd - fund.committedUsd);
  const allocatedAmountUsd = Math.min(input.requestedAmountUsd, remaining);
  const status: IndicationStatus =
    allocatedAmountUsd === input.requestedAmountUsd ? 'ALLOCATED_FULL' : allocatedAmountUsd > 0 ? 'ALLOCATED_PARTIAL' : 'UNDER_REVIEW';

  const indication: IndicationOfInterest = {
    id: nextId('ind'),
    idempotencyKey: input.idempotencyKey,
    fundVehicleId: fund.id,
    lpOrganizationId: org.id,
    requestedAmountUsd: input.requestedAmountUsd,
    allocatedAmountUsd,
    status,
    submittedAt: now,
    updatedAt: now,
    notes: input.notes,
  };
  db.indications.push(indication);
  fund.committedUsd += allocatedAmountUsd;
  if (fund.committedUsd >= fund.hardCapUsd) fund.status = 'OVERSUBSCRIBED';

  appendAudit({ entityType: 'INDICATION', entityId: indication.id, actorUserId: user.id, action: 'SUBMITTED', toStatus: 'SUBMITTED' });
  appendAudit({ entityType: 'INDICATION', entityId: indication.id, action: allocatedAmountUsd > 0 ? 'ALLOCATED' : 'REVIEW_STARTED', fromStatus: 'SUBMITTED', toStatus: status });
  notifyOrg(fund.gpOrganizationId, 'SUBSCRIPTION_PROGRESS', `${org.name} indicated $${(input.requestedAmountUsd / 1e6).toFixed(1)}M in ${fund.name}.`, '/dashboard');
  persist();
  return wire(indication);
}

// Which permission authorizes each action, and whose resource it must be.
const ACTION_PERMISSION: Record<IndicationAction, Permission> = {
  SUBMIT: 'ioi:submit',
  WITHDRAW: 'ioi:withdraw:own',
  ACCEPT_ALLOCATION: 'ioi:accept:own',
  START_REVIEW: 'ioi:review:own-fund',
  DECLINE: 'ioi:review:own-fund',
  ADVANCE: 'ioi:review:own-fund',
};

export async function transitionIndication(id: string, action: IndicationAction, notes?: string): Promise<IndicationOfInterest> {
  await delay(null);
  const current = db.indications.find((i) => i.id === id);
  if (!current) throw new ApiError('NOT_FOUND', 'Indication not found.');
  const fund = fundOf(current.fundVehicleId)!;

  const permission = ACTION_PERMISSION[action];
  const ownerOrganizationId = permission === 'ioi:review:own-fund' ? fund.gpOrganizationId : current.lpOrganizationId;
  const { user } = authorize(permission, { ownerOrganizationId });

  const edge = nextTransition(current.status, action);
  if (!edge) throw new ApiError('ILLEGAL_TRANSITION', `Illegal transition: cannot ${action} an indication in status ${current.status}`);
  if (ACTIONS_REQUIRING_REASON.includes(action) && !notes?.trim()) {
    throw new ApiError('VALIDATION', 'A reason is required — it is shown to the investor.');
  }

  const now = clock.iso();
  const previous = current.status;
  current.status = edge.to;
  current.updatedAt = now;
  if (notes) current.notes = notes;

  // Declining or withdrawing an allocated indication frees its share of the hard cap back
  // to the fund — an oversubscribed fund can reopen if enough investors walk.
  if (RELEASES_CAPACITY.includes(action) && current.allocatedAmountUsd) {
    fund.committedUsd -= current.allocatedAmountUsd;
    if (fund.status === 'OVERSUBSCRIBED' && fund.committedUsd < fund.hardCapUsd) fund.status = 'OPEN';
  }

  appendAudit({ entityType: 'INDICATION', entityId: id, actorUserId: user.id, action: action === 'ADVANCE' ? edge.to : action, fromStatus: previous, toStatus: edge.to, reason: notes });
  // Tell the other side of the deal.
  const org = db.organizations.find((o) => o.id === current.lpOrganizationId)!;
  if (edge.actor === 'GP') {
    notifyOrg(current.lpOrganizationId, 'ALLOCATION', `${fund.name}: your indication is now ${edge.to.replace(/_/g, ' ').toLowerCase()}.`, '/dashboard');
  } else {
    notifyOrg(fund.gpOrganizationId, 'SUBSCRIPTION_PROGRESS', `${org.name}: indication in ${fund.name} is now ${edge.to.replace(/_/g, ' ').toLowerCase()}.`, '/dashboard');
  }
  persist();
  return wire(current);
}
