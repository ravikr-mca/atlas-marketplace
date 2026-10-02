import { db, delay, wire } from '../db';
import { ApiError } from '../errors';
import { authorize, isOversight, type Ctx } from './context';
import type { Organization } from '../../types/entities';

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
