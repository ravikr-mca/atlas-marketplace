import { decide, type Actor, type Permission, type Resource } from '../../auth/permissions';
import { requireSession } from '../auth';
import { db } from '../db';
import { ApiError } from '../errors';
import type { Organization, User } from '../../types/entities';

export interface Ctx {
  user: User;
  org: Organization;
  actor: Actor;
}

/** Authenticate, then authorize. The server-side half of the single permissions table. */
export function authorize(permission?: Permission, resource?: Resource): Ctx {
  const user = requireSession();
  const org = db.organizations.find((o) => o.id === user.organizationId)!;
  const actor: Actor = { userId: user.id, role: user.role, organizationId: org.id, accreditation: org.accreditation };
  if (permission) {
    const d = decide(actor, permission, resource);
    if (!d.allowed) throw new ApiError(d.code === 'ACCREDITATION' ? 'NOT_ACCREDITED' : 'FORBIDDEN', d.reason);
  }
  return { user, org, actor };
}

export const isOversight = (role: User['role']) => role === 'ADMIN' || role === 'COMPLIANCE';
