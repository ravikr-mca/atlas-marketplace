import type { Accreditation, UserRole } from '../types/entities';

/**
 * The single source of truth for who can do what.
 *
 * The same module is used in two places on purpose:
 *   1. the UI (`useSession().can/decide`) to disable an action *and explain why*, and
 *   2. the mock API (`authorize()` in src/mock/api/context.ts) to refuse the request.
 * In production the API check is the real one (Laravel policies/gates); the UI check is
 * only a courtesy — which is exactly why both read the same table, and why the
 * Roles & permissions page is generated from it rather than written by hand.
 *
 * Three independent reasons a request can be refused, each with its own message:
 *   ROLE          the role never has this permission
 *   ACCREDITATION the role has it, but the organization isn't VERIFIED yet
 *   OWNERSHIP     the role has it, but not for this resource (another org's fund/indication)
 */

export const PERMISSION_CATEGORIES = ['Discovery', 'Investing', 'Listing', 'Communication', 'Trust & oversight'] as const;
export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export const PERMISSION_INFO = {
  'fund:browse': { label: 'Browse listings', category: 'Discovery', description: 'Search, filter and open published fund listings.' },
  'dataroom:view': { label: 'Open a fund’s data room', category: 'Discovery', description: 'Read the PPM, track record and legal documents. Investors must be accredited and accept the fund’s NDA first.' },
  'org:view:profile': { label: 'View manager & platform profiles', category: 'Discovery', description: 'Track record, assets under management and verification status.' },
  'org:view:investor': { label: 'View investor profiles', category: 'Discovery', description: 'Restricted: managers only see investors who have submitted an indication on one of their funds.' },
  'ioi:submit': { label: 'Submit an indication of interest', category: 'Investing', description: 'Request a commitment amount in an open fund. Accredited investors only.' },
  'ioi:withdraw:own': { label: 'Withdraw your own indication', category: 'Investing', description: 'Withdraw before the allocation is accepted.' },
  'ioi:accept:own': { label: 'Accept an allocation', category: 'Investing', description: 'Accept the allocated amount and move to subscription documents.' },
  'ioi:view:own': { label: 'See your own indications', category: 'Investing', description: 'Status, allocation and history of every indication you submitted.' },
  'fund:create': { label: 'Create a listing draft', category: 'Listing', description: 'Start a new fund listing. Allowed before accreditation — drafts are private.' },
  'fund:edit:own': { label: 'Edit your own listing', category: 'Listing', description: 'Change terms and documents, subject to locks once investors have indicated.' },
  'fund:publish:own': { label: 'Publish your listing', category: 'Listing', description: 'Make a draft visible to investors. Needs a verified manager, a PPM and a track-record document.' },
  'fund:close:own': { label: 'Close or withdraw your listing', category: 'Listing', description: 'Run the final close, or withdraw the listing and release all indications.' },
  'ioi:review:own-fund': { label: 'Review indications on your funds', category: 'Listing', description: 'Decline (with a reason), override an allocation, and advance subscription steps.' },
  'ioi:view:own-fund': { label: 'See indications on your funds', category: 'Listing', description: 'The investor pipeline for funds you manage — never another manager’s.' },
  'message:send': { label: 'Message the other side of a deal', category: 'Communication', description: 'Diligence questions between an accredited investor and the fund’s manager.' },
  'message:read:own': { label: 'Read your own threads', category: 'Communication', description: 'Threads where your organization is a participant.' },
  'notification:read:own': { label: 'Receive notifications', category: 'Communication', description: 'Allocation decisions, messages, deadlines and accreditation updates.' },
  'message:read:all': { label: 'Read every thread (oversight)', category: 'Trust & oversight', description: 'Read-only supervisory access for Compliance.' },
  'ioi:view:all': { label: 'See every indication (oversight)', category: 'Trust & oversight', description: 'Read-only view across all funds and investors.' },
  'org:verify': { label: 'Approve or reject accreditation', category: 'Trust & oversight', description: 'The human review that establishes trust before any organization can transact.' },
  'audit:view:own': { label: 'See the audit trail of your own deals', category: 'Trust & oversight', description: 'Who did what, and when, on indications you are party to.' },
  'audit:view:all': { label: 'See the full audit trail', category: 'Trust & oversight', description: 'Every state change across the platform.' },
  'audit:export': { label: 'Export the audit trail', category: 'Trust & oversight', description: 'Download the audit trail as CSV for review.' },
} as const satisfies Record<string, { label: string; category: PermissionCategory; description: string }>;

export type Permission = keyof typeof PERMISSION_INFO;
export const PERMISSIONS = Object.keys(PERMISSION_INFO) as Permission[];

export const ROLE_LABEL: Record<UserRole, string> = {
  LP: 'Investor (LP)',
  GP: 'Fund manager (GP)',
  ADMIN: 'Greenstone admin',
  COMPLIANCE: 'Greenstone compliance',
};

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  LP: [
    'fund:browse', 'dataroom:view', 'org:view:profile', 'ioi:submit', 'ioi:withdraw:own', 'ioi:accept:own',
    'ioi:view:own', 'message:send', 'message:read:own', 'audit:view:own', 'notification:read:own',
  ],
  GP: [
    'fund:browse', 'dataroom:view', 'org:view:profile', 'org:view:investor', 'fund:create', 'fund:edit:own',
    'fund:publish:own', 'fund:close:own', 'ioi:review:own-fund', 'ioi:view:own-fund', 'message:send',
    'message:read:own', 'audit:view:own', 'notification:read:own',
  ],
  ADMIN: [
    'fund:browse', 'dataroom:view', 'org:view:profile', 'org:view:investor', 'ioi:view:all', 'org:verify',
    'audit:view:all', 'audit:export', 'notification:read:own',
  ],
  COMPLIANCE: [
    'fund:browse', 'dataroom:view', 'org:view:profile', 'org:view:investor', 'ioi:view:all', 'message:read:all',
    'audit:view:all', 'audit:export', 'notification:read:own',
  ],
};

/** Permissions a role holds only while its organization is VERIFIED. */
export const REQUIRES_VERIFIED: Partial<Record<UserRole, readonly Permission[]>> = {
  LP: ['dataroom:view', 'ioi:submit', 'message:send'],
  GP: ['fund:publish:own', 'message:send'],
};

/** Permissions that only apply to resources owned by the actor's organization. */
const OWNED: ReadonlySet<Permission> = new Set<Permission>([
  'ioi:withdraw:own', 'ioi:accept:own', 'ioi:view:own', 'fund:edit:own', 'fund:publish:own', 'fund:close:own',
  'ioi:review:own-fund', 'ioi:view:own-fund',
]);

export interface Actor {
  userId: string;
  role: UserRole;
  organizationId: string;
  accreditation: Accreditation;
}

export interface Resource {
  /** The organization that owns the resource (the investor for an indication, the manager for a fund). */
  ownerOrganizationId?: string;
}

export type DenyCode = 'ROLE' | 'ACCREDITATION' | 'OWNERSHIP';
export type Decision = { allowed: true } | { allowed: false; code: DenyCode; reason: string };

const ACCREDITATION_REASON: Record<Accreditation, string> = {
  VERIFIED: '',
  PENDING: 'Your organization’s accreditation is under review by Greenstone. This unlocks as soon as it is approved.',
  UNVERIFIED: 'Your organization hasn’t been accredited yet. Submit your accreditation documents to Greenstone to unlock this.',
};

export function decide(actor: Actor, permission: Permission, resource?: Resource): Decision {
  const info = PERMISSION_INFO[permission];

  if (!ROLE_PERMISSIONS[actor.role].includes(permission)) {
    return { allowed: false, code: 'ROLE', reason: `${ROLE_LABEL[actor.role]} accounts can’t: ${info.label.toLowerCase()}.` };
  }
  if (actor.accreditation !== 'VERIFIED' && REQUIRES_VERIFIED[actor.role]?.includes(permission)) {
    return { allowed: false, code: 'ACCREDITATION', reason: ACCREDITATION_REASON[actor.accreditation] };
  }
  if (OWNED.has(permission) && resource?.ownerOrganizationId !== actor.organizationId) {
    return { allowed: false, code: 'OWNERSHIP', reason: 'This belongs to a different organization, so you can’t act on it.' };
  }
  return { allowed: true };
}

export const can = (actor: Actor, permission: Permission, resource?: Resource) => decide(actor, permission, resource).allowed;
