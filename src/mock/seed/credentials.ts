import type { Organization, User } from '../../types/entities';

// DEMO ONLY — mock credentials for a prototype with no real backend. The `.test` TLD is
// reserved (RFC 2606) and can never resolve to a real mailbox; the shared password is
// published on the login screen on purpose. Nothing here is, or resembles, a real secret.
export const DEMO_PASSWORD = 'AtlasDemo!2026';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** e.g. "Omar Al Farsi" at "Al Barari Family Office" -> omar.alfarsi@albarari.test */
export function demoEmail(user: User, org: Organization): string {
  const [first, ...rest] = user.name.split(' ');
  const orgSlug = org.kind === 'PLATFORM' ? 'greenstone' : slug(org.name.split(' ').slice(0, 2).join(' '));
  return `${slug(first)}.${slug(rest.join(''))}@${orgSlug}.test`;
}

/** Greenstone staff authenticate through the company IdP (Entra ID) — never a password. */
export const isStaff = (user: Pick<User, 'role'>) => user.role === 'ADMIN' || user.role === 'COMPLIANCE';
