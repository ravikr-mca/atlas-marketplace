// Mock authentication server. Stands in for Laravel Sanctum + Entra ID. DEMO ONLY.
//  - external users (GP/LP): e-mail + password, lockout after 5 failures for 15 min
//  - Greenstone staff (ADMIN/COMPLIANCE): SSO only — a password attempt is refused
//  - sessions expire after 30 idle minutes (sliding); every auth event is audited
import { ApiError } from './errors';
import { clock, appendAudit, db, delay, nextId, persist } from './db';
import { DEMO_PASSWORD, demoEmail, isStaff } from './seed/credentials';
import type { User } from '../types/entities';

export const SESSION_TTL_MS = 30 * 60_000;
export const MAX_FAILURES = 5;
export const LOCKOUT_MS = 15 * 60_000;

let accessToken: string | null = null;
/** The client calls this with the token it holds; every API call then authenticates with it. */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const orgOf = (user: User) => db.organizations.find((o) => o.id === user.organizationId)!;
const emailOf = (user: User) => demoEmail(user, orgOf(user));

export interface AuthResult {
  token: string;
  user: User;
}

function openSession(user: User, method: 'PASSWORD' | 'SSO'): AuthResult {
  const token = `tok_${nextId('s')}_${Math.random().toString(36).slice(2, 10)}`;
  db.sessions[token] = { userId: user.id, expiresAt: clock.now() + SESSION_TTL_MS };
  db.attempts[emailOf(user)] = { failures: 0 };
  appendAudit({ entityType: 'AUTH', entityId: user.id, actorUserId: user.id, action: 'LOGIN', reason: method });
  persist();
  return { token, user };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  await delay(null);
  const email = input.email.trim().toLowerCase();
  const user = db.users.find((u) => emailOf(u) === email);

  // Same message for "no such user" and "wrong password" — don't reveal which e-mails exist.
  const invalid = () => new ApiError('INVALID_CREDENTIALS', 'The e-mail or password is incorrect.');
  if (!user) throw invalid();

  const attempts = (db.attempts[email] ??= { failures: 0 });
  if (attempts.lockedUntil && attempts.lockedUntil > clock.now()) {
    const mins = Math.ceil((attempts.lockedUntil - clock.now()) / 60_000);
    throw new ApiError('ACCOUNT_LOCKED', `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
  }
  if (isStaff(user)) {
    throw new ApiError('SSO_REQUIRED', 'Greenstone staff sign in with company single sign-on (Entra ID), not a password.');
  }
  if (input.password !== DEMO_PASSWORD) {
    attempts.failures += 1;
    appendAudit({ entityType: 'AUTH', entityId: user.id, actorUserId: user.id, action: 'LOGIN_FAILED' });
    if (attempts.failures >= MAX_FAILURES) {
      attempts.lockedUntil = clock.now() + LOCKOUT_MS;
      attempts.failures = 0;
      appendAudit({ entityType: 'AUTH', entityId: user.id, actorUserId: user.id, action: 'ACCOUNT_LOCKED' });
    }
    persist();
    throw invalid();
  }
  return openSession(user, 'PASSWORD');
}

/** Mock Entra ID account chooser — only staff identities exist in the directory. */
export async function ssoLogin(userId: string): Promise<AuthResult> {
  await delay(null);
  const user = db.users.find((u) => u.id === userId);
  if (!user || !isStaff(user)) throw new ApiError('FORBIDDEN', 'That account isn’t in the Greenstone directory.');
  return openSession(user, 'SSO');
}

/**
 * One-click demo persona. Goes through the same session creation as a real sign-in
 * (staff via SSO, everyone else as if the right password had been typed).
 */
export async function demoLogin(userId: string): Promise<AuthResult> {
  await delay(null);
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new ApiError('NOT_FOUND', 'Unknown demo persona.');
  return openSession(user, isStaff(user) ? 'SSO' : 'PASSWORD');
}

export async function logout(): Promise<void> {
  const session = accessToken ? db.sessions[accessToken] : undefined;
  if (session) {
    appendAudit({ entityType: 'AUTH', entityId: session.userId, actorUserId: session.userId, action: 'LOGOUT' });
    delete db.sessions[accessToken!];
    persist();
  }
  accessToken = null;
}

/** Resolve the current session, sliding its expiry. Throws 401 when absent or idle-expired. */
export function requireSession(): User {
  const session = accessToken ? db.sessions[accessToken] : undefined;
  if (!accessToken || !session) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
  if (session.expiresAt <= clock.now()) {
    delete db.sessions[accessToken];
    persist();
    throw new ApiError('SESSION_EXPIRED', 'Your session timed out. Please sign in again.');
  }
  session.expiresAt = clock.now() + SESSION_TTL_MS;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Please sign in to continue.');
  return user;
}

export async function fetchMe() {
  await delay(null);
  const user = requireSession();
  return { user, organization: orgOf(user) };
}

export interface DemoPersona {
  userId: string;
  name: string;
  title?: string;
  role: User['role'];
  organizationName: string;
  accreditation: string;
  email: string;
  sso: boolean;
  /** What this persona is there to demonstrate. */
  blurb: string;
}

const BLURB: Record<string, string> = {
  'user-lp-1': 'Verified family office — the full investing journey.',
  'user-lp-6': 'Accreditation pending — can browse, but every transacting action explains why it’s blocked.',
  'user-lp-8': 'Not yet accredited — the empty-state and the path to getting verified.',
  'user-gp-1': 'Verified fund manager — pipeline, allocations, listings.',
  'user-gp-6': 'Manager awaiting verification — can draft, cannot publish.',
  'user-admin-1': 'Greenstone operations — approves organizations.',
  'user-compliance-1': 'Greenstone compliance — read-only oversight and audit trail.',
};

/** Personas offered as one-click cards on the login page (demo mode only). */
export function listDemoPersonas(): DemoPersona[] {
  return Object.keys(BLURB).flatMap((id) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return [];
    const org = orgOf(user);
    return [{
      userId: user.id, name: user.name, title: user.title, role: user.role, organizationName: org.name,
      accreditation: org.accreditation, email: emailOf(user), sso: isStaff(user), blurb: BLURB[id],
    }];
  });
}

export const staffAccounts = () => db.users.filter(isStaff).map((u) => ({ userId: u.id, name: u.name, email: emailOf(u), title: u.title }));
