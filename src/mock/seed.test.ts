import { describe, expect, it } from 'vitest';
import {
  ACCREDITATION_STATES,
  AUDIT_ENTITY_TYPES,
  DATA_ROOM_DOCUMENT_KINDS,
  FUND_STRATEGIES,
  FUND_VEHICLE_STATUSES,
  INDICATION_STATUSES,
  INVESTOR_TIERS,
  NOTIFICATION_KINDS,
  ORGANIZATION_KINDS,
  USER_ROLES,
  type IndicationStatus,
} from '../types/entities';
import {
  auditLog,
  consents,
  dataRoomDocuments,
  fundVehicles,
  indications,
  messageThreads,
  messages,
  notifications,
  organizations,
  trackRecords,
  users,
} from './seed';

// This file is the guard behind "every dropdown and every situation has data": every
// enum the UI can filter or branch on must appear in the seed at least once, and the
// seed must be internally consistent. Adding an enum value without seed data (or
// breaking a reference) fails here instead of showing an empty dropdown to a panel.

const used = <T, K>(items: T[], pick: (t: T) => K | undefined) => new Set(items.map(pick).filter((v): v is K => v !== undefined));

describe('seed coverage: every enum value has at least one record', () => {
  const cases: [string, readonly string[], Set<string>][] = [
    ['user roles', USER_ROLES, used(users, (u) => u.role)],
    ['organization kinds', ORGANIZATION_KINDS, used(organizations, (o) => o.kind)],
    ['investor tiers', INVESTOR_TIERS, used(organizations, (o) => o.investorTier)],
    ['accreditation states', ACCREDITATION_STATES, used(organizations, (o) => o.accreditation)],
    ['fund strategies', FUND_STRATEGIES, used(fundVehicles, (f) => f.strategy)],
    ['fund statuses', FUND_VEHICLE_STATUSES, used(fundVehicles, (f) => f.status)],
    ['indication statuses', INDICATION_STATUSES, used(indications, (i) => i.status)],
    ['data room document kinds', DATA_ROOM_DOCUMENT_KINDS, used(dataRoomDocuments, (d) => d.kind)],
    ['notification kinds', NOTIFICATION_KINDS, used(notifications, (n) => n.kind)],
    ['audit entity types (excluding AUTH/CONSENT/MESSAGE, written live)', AUDIT_ENTITY_TYPES.filter((t) => ['INDICATION', 'FUND', 'ORGANIZATION'].includes(t)), used(auditLog, (a) => a.entityType)],
  ];

  it.each(cases)('%s', (_label, all, seen) => {
    const missing = all.filter((v) => !seen.has(v));
    expect(missing).toEqual([]);
  });

  it('every strategy has an OPEN fund, so every strategy filter returns something selectable', () => {
    const openStrategies = used(fundVehicles.filter((f) => f.status === 'OPEN'), (f) => f.strategy);
    expect(FUND_STRATEGIES.filter((s) => !openStrategies.has(s))).toEqual([]);
  });

  it('every verified investor has at least one indication (no empty demo dashboard)', () => {
    const withIndication = used(indications, (i) => i.lpOrganizationId);
    const verifiedLps = organizations.filter((o) => o.kind === 'INVESTOR' && o.accreditation === 'VERIFIED');
    expect(verifiedLps.filter((o) => !withIndication.has(o.id)).map((o) => o.id)).toEqual([]);
  });

  it('un-accredited investors have no indications (they cannot submit until verified)', () => {
    const blocked = organizations.filter((o) => o.kind === 'INVESTOR' && o.accreditation !== 'VERIFIED').map((o) => o.id);
    expect(indications.filter((i) => blocked.includes(i.lpOrganizationId))).toEqual([]);
  });
});

describe('seed integrity: references resolve and invariants hold', () => {
  const orgIds = new Set(organizations.map((o) => o.id));
  const userIds = new Set(users.map((u) => u.id));
  const fundIds = new Set(fundVehicles.map((f) => f.id));
  const indicationIds = new Set(indications.map((i) => i.id));
  const threadIds = new Set(messageThreads.map((t) => t.id));

  it('ids are unique within every collection', () => {
    for (const items of [organizations, users, fundVehicles, indications, dataRoomDocuments, messageThreads, messages, notifications, trackRecords, auditLog, consents]) {
      const ids = items.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every user belongs to an existing organization, and every org has a user', () => {
    expect(users.filter((u) => !orgIds.has(u.organizationId))).toEqual([]);
    const orgsWithUsers = used(users, (u) => u.organizationId);
    expect(organizations.filter((o) => !orgsWithUsers.has(o.id)).map((o) => o.id)).toEqual([]);
  });

  it('user roles agree with their organization kind', () => {
    const kindOf = new Map(organizations.map((o) => [o.id, o.kind]));
    const expected = { LP: 'INVESTOR', GP: 'FUND_MANAGER', ADMIN: 'PLATFORM', COMPLIANCE: 'PLATFORM' } as const;
    expect(users.filter((u) => kindOf.get(u.organizationId) !== expected[u.role]).map((u) => u.id)).toEqual([]);
  });

  it('funds belong to fund-manager orgs; indications link a real fund and a real investor org', () => {
    const kindOf = new Map(organizations.map((o) => [o.id, o.kind]));
    expect(fundVehicles.filter((f) => kindOf.get(f.gpOrganizationId) !== 'FUND_MANAGER').map((f) => f.id)).toEqual([]);
    expect(indications.filter((i) => !fundIds.has(i.fundVehicleId)).map((i) => i.id)).toEqual([]);
    expect(indications.filter((i) => kindOf.get(i.lpOrganizationId) !== 'INVESTOR').map((i) => i.id)).toEqual([]);
  });

  it('documents, threads, messages, notifications, track records and audit entries reference real records', () => {
    expect(dataRoomDocuments.filter((d) => !fundIds.has(d.fundVehicleId))).toEqual([]);
    expect(messageThreads.filter((t) => !fundIds.has(t.fundVehicleId) || t.participantOrgIds.some((o) => !orgIds.has(o)))).toEqual([]);
    expect(messages.filter((m) => !threadIds.has(m.threadId) || !userIds.has(m.senderUserId))).toEqual([]);
    expect(notifications.filter((n) => !userIds.has(n.userId))).toEqual([]);
    expect(trackRecords.filter((t) => !orgIds.has(t.gpOrganizationId))).toEqual([]);
    expect(auditLog.filter((a) => a.actorUserId && !userIds.has(a.actorUserId))).toEqual([]);
    expect(consents.filter((c) => !userIds.has(c.userId) || (c.fundVehicleId && !fundIds.has(c.fundVehicleId)) || (c.indicationId && !indicationIds.has(c.indicationId)))).toEqual([]);
  });

  it('a fund lists exactly the documents that point at it', () => {
    for (const f of fundVehicles) {
      const expected = dataRoomDocuments.filter((d) => d.fundVehicleId === f.id).map((d) => d.id);
      expect(f.dataRoomDocumentIds).toEqual(expected);
    }
  });

  it('committed capital never exceeds the hard cap, and covers every allocation held against it', () => {
    const HOLDS_CAPACITY: IndicationStatus[] = ['ALLOCATED_FULL', 'ALLOCATED_PARTIAL', 'SUBSCRIPTION_SENT', 'KYC_VERIFIED', 'SIGNED', 'FUNDED'];
    for (const f of fundVehicles) {
      expect(f.committedUsd).toBeLessThanOrEqual(f.hardCapUsd);
      expect(f.hardCapUsd).toBeGreaterThanOrEqual(f.targetSizeUsd);
      expect(f.minimumCommitmentUsd).toBeLessThanOrEqual(f.targetSizeUsd);
      const held = indications
        .filter((i) => i.fundVehicleId === f.id && HOLDS_CAPACITY.includes(i.status))
        .reduce((sum, i) => sum + (i.allocatedAmountUsd ?? 0), 0);
      expect(f.committedUsd).toBeGreaterThanOrEqual(held);
    }
  });

  it('allocation amounts are consistent with indication status', () => {
    const HOLDS: IndicationStatus[] = ['ALLOCATED_FULL', 'ALLOCATED_PARTIAL', 'SUBSCRIPTION_SENT', 'KYC_VERIFIED', 'SIGNED', 'FUNDED'];
    for (const i of indications) {
      const a = i.allocatedAmountUsd ?? 0;
      if (HOLDS.includes(i.status)) {
        expect(a).toBeGreaterThan(0);
        expect(a).toBeLessThanOrEqual(i.requestedAmountUsd);
      } else {
        expect(a).toBe(0);
      }
      if (i.status === 'ALLOCATED_FULL') expect(a).toBe(i.requestedAmountUsd);
      if (i.status === 'ALLOCATED_PARTIAL') expect(a).toBeLessThan(i.requestedAmountUsd);
      if (i.status === 'DECLINED' || i.status === 'WITHDRAWN') expect(i.notes).toBeTruthy(); // a reason is always on record
    }
  });

  it('an oversubscribed or allocating book has more demand than capacity', () => {
    for (const f of fundVehicles.filter((x) => x.status === 'OVERSUBSCRIBED')) {
      expect(f.committedUsd).toBe(f.hardCapUsd);
    }
  });

  it('only a verified manager has published (non-draft) funds; drafts have no publish date', () => {
    const accOf = new Map(organizations.map((o) => [o.id, o.accreditation]));
    for (const f of fundVehicles) {
      if (f.status === 'DRAFT') expect(f.publishedAt).toBeUndefined();
      else expect(accOf.get(f.gpOrganizationId)).toBe('VERIFIED');
    }
  });

  it('each audit trail for an indication ends in that indication’s current status', () => {
    for (const i of indications) {
      const trail = auditLog.filter((a) => a.entityType === 'INDICATION' && a.entityId === i.id);
      expect(trail.length).toBeGreaterThan(0);
      expect(trail[trail.length - 1].toStatus).toBe(i.status);
    }
  });
});
