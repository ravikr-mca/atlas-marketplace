import type {
  AuditLogEntry,
  ConsentRecord,
  FundVehicle,
  IndicationOfInterest,
  IndicationStatus,
  Organization,
  User,
} from '../../types/entities';

// The seed audit history is *derived* from the seeded records rather than hand-written,
// so it can never contradict them: every indication's trail ends in its current status,
// and every verified organization has an accreditation entry. Live mutations append to
// the same log via the mock API (see api.ts / auth.ts).

// The path an indication takes to reach each status, from SUBMITTED onward.
const PATH_TO: Partial<Record<IndicationStatus, IndicationStatus[]>> = {
  UNDER_REVIEW: ['UNDER_REVIEW'],
  ALLOCATED_FULL: ['UNDER_REVIEW', 'ALLOCATED_FULL'],
  ALLOCATED_PARTIAL: ['UNDER_REVIEW', 'ALLOCATED_PARTIAL'],
  DECLINED: ['UNDER_REVIEW', 'DECLINED'],
  WITHDRAWN: ['UNDER_REVIEW', 'WITHDRAWN'],
  SUBSCRIPTION_SENT: ['UNDER_REVIEW', 'ALLOCATED_FULL', 'SUBSCRIPTION_SENT'],
  KYC_VERIFIED: ['UNDER_REVIEW', 'ALLOCATED_FULL', 'SUBSCRIPTION_SENT', 'KYC_VERIFIED'],
  SIGNED: ['UNDER_REVIEW', 'ALLOCATED_FULL', 'SUBSCRIPTION_SENT', 'KYC_VERIFIED', 'SIGNED'],
  FUNDED: ['UNDER_REVIEW', 'ALLOCATED_FULL', 'SUBSCRIPTION_SENT', 'KYC_VERIFIED', 'SIGNED', 'FUNDED'],
};

type Actor = 'LP' | 'GP' | 'SYSTEM';
const STEP: Partial<Record<IndicationStatus, { action: string; actor: Actor }>> = {
  UNDER_REVIEW: { action: 'REVIEW_STARTED', actor: 'SYSTEM' },
  ALLOCATED_FULL: { action: 'ALLOCATED', actor: 'SYSTEM' },
  ALLOCATED_PARTIAL: { action: 'ALLOCATED', actor: 'SYSTEM' },
  DECLINED: { action: 'DECLINED', actor: 'GP' },
  WITHDRAWN: { action: 'WITHDRAWN', actor: 'LP' },
  SUBSCRIPTION_SENT: { action: 'ALLOCATION_ACCEPTED', actor: 'LP' },
  KYC_VERIFIED: { action: 'KYC_VERIFIED', actor: 'GP' },
  SIGNED: { action: 'SIGNED', actor: 'GP' },
  FUNDED: { action: 'FUNDED', actor: 'GP' },
};

interface Inputs {
  indications: IndicationOfInterest[];
  organizations: Organization[];
  users: User[];
  funds: Pick<FundVehicle, 'id' | 'gpOrganizationId' | 'status' | 'publishedAt' | 'closeDate'>[];
}

const firstUserOf = (users: User[], orgId: string) => users.find((u) => u.organizationId === orgId)?.id;

export function buildSeedAudit({ indications, organizations, users, funds }: Inputs): AuditLogEntry[] {
  const log: AuditLogEntry[] = [];
  const fundById = new Map(funds.map((f) => [f.id, f]));
  const admin = users.find((u) => u.role === 'ADMIN')?.id;

  for (const org of organizations) {
    if (org.accreditation === 'VERIFIED' && org.verifiedAt) {
      log.push({
        id: `aud-org-${org.id}`,
        entityType: 'ORGANIZATION',
        entityId: org.id,
        actorUserId: org.verifiedByUserId ?? admin,
        action: 'ACCREDITATION_VERIFIED',
        fromStatus: 'PENDING',
        toStatus: 'VERIFIED',
        at: org.verifiedAt,
      });
    }
  }

  for (const fund of funds) {
    const gpUser = firstUserOf(users, fund.gpOrganizationId);
    if (fund.publishedAt) {
      log.push({
        id: `aud-fund-${fund.id}-pub`,
        entityType: 'FUND',
        entityId: fund.id,
        actorUserId: gpUser,
        action: 'PUBLISHED',
        fromStatus: 'DRAFT',
        toStatus: 'OPEN',
        at: `${fund.publishedAt}T09:00:00Z`,
      });
    }
    if (fund.status === 'CLOSED') {
      log.push({
        id: `aud-fund-${fund.id}-closed`,
        entityType: 'FUND',
        entityId: fund.id,
        actorUserId: gpUser,
        action: 'CLOSED',
        fromStatus: 'ALLOCATING',
        toStatus: 'CLOSED',
        at: `${fund.closeDate}T17:00:00Z`,
      });
    }
    if (fund.status === 'WITHDRAWN') {
      log.push({
        id: `aud-fund-${fund.id}-withdrawn`,
        entityType: 'FUND',
        entityId: fund.id,
        actorUserId: gpUser,
        action: 'WITHDRAWN',
        fromStatus: 'OPEN',
        toStatus: 'WITHDRAWN',
        reason: 'Target company financing round was restructured; all indications released.',
        at: '2026-09-12T08:00:00Z',
      });
    }
  }

  for (const ind of indications) {
    const lpUser = firstUserOf(users, ind.lpOrganizationId);
    const gpUser = firstUserOf(users, fundById.get(ind.fundVehicleId)?.gpOrganizationId ?? '');

    if (ind.status === 'DRAFT') {
      log.push({
        id: `aud-${ind.id}-0`,
        entityType: 'INDICATION',
        entityId: ind.id,
        actorUserId: lpUser,
        action: 'DRAFT_SAVED',
        toStatus: 'DRAFT',
        at: ind.submittedAt,
      });
      continue;
    }

    log.push({
      id: `aud-${ind.id}-0`,
      entityType: 'INDICATION',
      entityId: ind.id,
      actorUserId: lpUser,
      action: 'SUBMITTED',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      at: ind.submittedAt,
    });

    const path = PATH_TO[ind.status] ?? [];
    const start = Date.parse(ind.submittedAt);
    const end = Date.parse(ind.updatedAt);
    path.forEach((status, i) => {
      const step = STEP[status]!;
      const isLast = i === path.length - 1;
      // Spread intermediate steps between submission and last update; at least 1s apart.
      const t = Math.max(start + (i + 1) * 1000, start + ((end - start) * (i + 1)) / path.length);
      log.push({
        id: `aud-${ind.id}-${i + 1}`,
        entityType: 'INDICATION',
        entityId: ind.id,
        actorUserId: step.actor === 'LP' ? lpUser : step.actor === 'GP' ? gpUser : undefined,
        action: step.action,
        fromStatus: i === 0 ? 'SUBMITTED' : path[i - 1],
        toStatus: status,
        reason: isLast && (status === 'DECLINED' || status === 'WITHDRAWN') ? ind.notes : undefined,
        at: new Date(t).toISOString(),
      });
    });
  }

  return log.sort((a, b) => a.at.localeCompare(b.at));
}

// Consents implied by the seeded activity: anyone who has an indication on a fund must
// have accepted that fund's NDA to see its data room, and acknowledged the investor
// risk statement when submitting. TERMS is deliberately *not* seeded for anyone, so the
// first-sign-in gate is visible for every demo persona.
export function buildSeedConsents({ indications, users }: Pick<Inputs, 'indications' | 'users'>): ConsentRecord[] {
  const out: ConsentRecord[] = [];
  const seenNda = new Set<string>();
  for (const ind of indications) {
    if (ind.status === 'DRAFT') continue;
    const userId = firstUserOf(users, ind.lpOrganizationId);
    if (!userId) continue;
    const ndaKey = `${userId}:${ind.fundVehicleId}`;
    if (!seenNda.has(ndaKey)) {
      seenNda.add(ndaKey);
      out.push({
        id: `con-nda-${userId}-${ind.fundVehicleId}`,
        userId,
        kind: 'NDA',
        fundVehicleId: ind.fundVehicleId,
        version: '2026.1',
        acceptedAt: ind.submittedAt,
      });
    }
    out.push({
      id: `con-risk-${ind.id}`,
      userId,
      kind: 'RISK_ACK',
      indicationId: ind.id,
      version: '2026.1',
      acceptedAt: ind.submittedAt,
    });
  }
  return out;
}
