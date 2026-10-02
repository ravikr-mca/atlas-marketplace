// The mock "database": mutable collections seeded from ./seed, plus the pieces a real
// backend would own — a clock, latency, the audit log and notification fan-out. Persisted
// to sessionStorage so a refresh keeps the demo state (and "Reset demo data" clears it).
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
import type {
  AuditEntityType,
  AuditLogEntry,
  ConsentRecord,
  DataRoomDocument,
  FundVehicle,
  IndicationOfInterest,
  Message,
  MessageThread,
  Notification,
  NotificationKind,
  Organization,
  TrackRecordEntry,
  User,
} from '../types/entities';

export interface Session {
  userId: string;
  expiresAt: number;
}
export interface LoginAttempts {
  failures: number;
  lockedUntil?: number;
}

export interface Db {
  organizations: Organization[];
  users: User[];
  funds: FundVehicle[];
  indications: IndicationOfInterest[];
  documents: DataRoomDocument[];
  threads: MessageThread[];
  messages: Message[];
  notifications: Notification[];
  trackRecords: TrackRecordEntry[];
  audit: AuditLogEntry[];
  consents: ConsentRecord[];
  sessions: Record<string, Session>;
  attempts: Record<string, LoginAttempts>; // keyed by e-mail
  seq: number;
}

const STORAGE_KEY = 'atlas-mock-db-v1';
const storage = (): Storage | undefined => {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  } catch {
    return undefined; // blocked storage — the demo still works, it just won't survive a refresh
  }
};

const freshDb = (): Db => ({
  organizations: structuredClone(organizations),
  users: structuredClone(users),
  funds: structuredClone(fundVehicles),
  indications: structuredClone(indications),
  documents: structuredClone(dataRoomDocuments),
  threads: structuredClone(messageThreads),
  messages: structuredClone(messages),
  notifications: structuredClone(notifications),
  trackRecords: structuredClone(trackRecords),
  audit: structuredClone(auditLog),
  consents: structuredClone(consents),
  sessions: {},
  attempts: {},
  seq: 1000,
});

function hydrate(): Db {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    /* corrupt snapshot — fall through to the seed */
  }
  return freshDb();
}

export const db: Db = hydrate();

/** Call after any mutation so the demo state survives a refresh. */
export function persist() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota or blocked storage — non-fatal */
  }
}

export function resetDb() {
  Object.assign(db, freshDb());
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ── clock & latency ─────────────────────────────────────────────────────────────────
let offsetMs = 0;
export const clock = {
  now: () => Date.now() + offsetMs,
  date: () => new Date(Date.now() + offsetMs),
  iso: () => new Date(Date.now() + offsetMs).toISOString(),
  /** Move time forward — used by tests and the "expire my session" demo control. */
  advance: (ms: number) => {
    offsetMs += ms;
  },
};

const LATENCY_MS = import.meta.env?.MODE === 'test' ? 0 : 350;
export const delay = <T>(value: T) =>
  LATENCY_MS === 0 ? Promise.resolve(value) : new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

/** Responses cross a (simulated) network boundary: callers get copies, never live DB rows. */
export const wire = <T>(value: T): T => structuredClone(value);

export const nextId = (prefix: string) => `${prefix}-${++db.seq}`;

// ── audit & notifications ───────────────────────────────────────────────────────────
export function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'at'>) {
  db.audit.push({ ...entry, id: nextId('aud'), at: clock.iso() });
}

export const auditFor = (entityType: AuditEntityType, entityId: string) =>
  db.audit.filter((a) => a.entityType === entityType && a.entityId === entityId);

export function notifyUser(userId: string, kind: NotificationKind, body: string, link?: string) {
  db.notifications.push({ id: nextId('ntf'), userId, kind, body, link, createdAt: clock.iso(), read: false });
}

export function notifyOrg(organizationId: string, kind: NotificationKind, body: string, link?: string) {
  for (const u of db.users.filter((x) => x.organizationId === organizationId)) notifyUser(u.id, kind, body, link);
}
