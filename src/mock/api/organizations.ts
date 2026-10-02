import { appendAudit, clock, db, delay, notifyOrg, persist, wire } from '../db';
import { ApiError } from '../errors';
import { authorize, isOversight, type Ctx } from './context';
import type { Organization, TrackRecordEntry } from '../../types/entities';

// Managers and the platform are public profiles. An investor's profile is restricted to
// the investor itself, Greenstone staff, and managers who hold one of their indications.
function canSeeOrg({ user, org }: Ctx, target: Organization) {
  if (target.kind !== 'INVESTOR' || target.id === org.id || isOversight(user.role)) return true;
  if (user.role !== 'GP') return false;
  const ownFunds = new Set(db.funds.filter((f) => f.gpOrganizationId === org.id).map((f) => f.id));
  return db.indications.some((i) => i.lpOrganizationId === target.id && ownFunds.has(i.fundVehicleId));
}

export async function fetchOrganizations(): Promise<Organization[]> {
  await delay(null);
  const ctx = authorize('org:view:profile');
  return wire(db.organizations.filter((o) => canSeeOrg(ctx, o)));
}

export async function fetchOrganization(id: string): Promise<Organization | null> {
  await delay(null);
  const ctx = authorize('org:view:profile');
  const target = db.organizations.find((o) => o.id === id);
  if (!target) return null;
  if (!canSeeOrg(ctx, target)) {
    throw new ApiError('FORBIDDEN', 'Investor profiles are only visible to the investor, Greenstone, and managers they’ve indicated interest with.');
  }
  return wire(target);
}

export async function fetchTrackRecords(orgId: string): Promise<TrackRecordEntry[]> {
  await delay(null);
  authorize('org:view:profile');
  return wire(db.trackRecords.filter((t) => t.gpOrganizationId === orgId));
}

/** Every organization that has to be (or has been) through Greenstone's accreditation review. */
export async function fetchApprovalQueue(): Promise<Organization[]> {
  await delay(null);
  authorize('org:verify');
  return wire(db.organizations.filter((o) => o.kind !== 'PLATFORM' && o.accreditation !== 'VERIFIED'));
}

export type ReviewDecision = 'APPROVE' | 'REJECT';

/**
 * The human review that establishes trust. Approving flips the organization to VERIFIED —
 * its permissions change on its very next request, because every API call reads the live
 * accreditation. Rejecting needs a reason, which the organization is shown.
 */
export async function reviewOrganization(input: { organizationId: string; decision: ReviewDecision; reason?: string }): Promise<Organization> {
  await delay(null);
  const { user } = authorize('org:verify');
  const target = db.organizations.find((o) => o.id === input.organizationId);
  if (!target || target.kind === 'PLATFORM') throw new ApiError('NOT_FOUND', 'Organization not found.');
  if (target.accreditation !== 'PENDING') {
    throw new ApiError('ILLEGAL_TRANSITION', 'Only organizations with a pending application can be reviewed.');
  }
  const reason = input.reason?.trim();
  if (input.decision === 'REJECT' && !reason) throw new ApiError('VALIDATION', 'A reason is required — it is shown to the applicant.');

  const previous = target.accreditation;
  if (input.decision === 'APPROVE') {
    target.accreditation = 'VERIFIED';
    target.verifiedAt = clock.iso();
    target.verifiedByUserId = user.id;
    delete target.rejectionReason;
  } else {
    target.accreditation = 'UNVERIFIED';
    target.rejectionReason = reason;
  }
  appendAudit({
    entityType: 'ORGANIZATION', entityId: target.id, actorUserId: user.id,
    action: input.decision === 'APPROVE' ? 'ACCREDITATION_VERIFIED' : 'ACCREDITATION_REJECTED',
    fromStatus: previous, toStatus: target.accreditation, reason,
  });
  notifyOrg(
    target.id, 'ACCREDITATION',
    input.decision === 'APPROVE' ? 'Your organization is now accredited. You can submit indications, open data rooms and message managers.' : `Your accreditation application was not approved: ${reason}`,
    '/',
  );
  persist();
  return wire(target);
}
