import { describe, expect, it } from 'vitest';
import { PERMISSIONS, REQUIRES_VERIFIED, ROLE_PERMISSIONS, decide, type Actor } from './permissions';
import { USER_ROLES } from '../types/entities';

const actor = (role: Actor['role'], accreditation: Actor['accreditation'] = 'VERIFIED'): Actor => ({
  userId: 'u', role, organizationId: 'org-a', accreditation,
});

describe('permission matrix', () => {
  it('every permission is granted to at least one role, and every grant is a known permission', () => {
    const granted = new Set(USER_ROLES.flatMap((r) => ROLE_PERMISSIONS[r]));
    expect(PERMISSIONS.filter((p) => !granted.has(p))).toEqual([]);
    for (const r of USER_ROLES) expect(ROLE_PERMISSIONS[r].filter((p) => !PERMISSIONS.includes(p))).toEqual([]);
  });

  it('accreditation gates only permissions the role actually holds', () => {
    for (const role of USER_ROLES) {
      for (const p of REQUIRES_VERIFIED[role] ?? []) expect(ROLE_PERMISSIONS[role]).toContain(p);
    }
  });

  it('Compliance is strictly read-only: no write permission at all', () => {
    const writes = ROLE_PERMISSIONS.COMPLIANCE.filter((p) => /submit|withdraw|accept|create|edit|publish|close|review|send|verify/.test(p));
    expect(writes).toEqual([]);
  });

  it('an LP can’t review indications; a GP can’t submit them', () => {
    expect(decide(actor('LP'), 'ioi:review:own-fund', { ownerOrganizationId: 'org-a' })).toMatchObject({ allowed: false, code: 'ROLE' });
    expect(decide(actor('GP'), 'ioi:submit')).toMatchObject({ allowed: false, code: 'ROLE' });
  });

  it('an unaccredited investor can browse but not submit, message or open a data room', () => {
    for (const state of ['PENDING', 'UNVERIFIED'] as const) {
      expect(decide(actor('LP', state), 'fund:browse').allowed).toBe(true);
      for (const p of ['ioi:submit', 'message:send', 'dataroom:view'] as const) {
        expect(decide(actor('LP', state), p)).toMatchObject({ allowed: false, code: 'ACCREDITATION' });
      }
    }
  });

  it('owned actions are refused on another organization’s resource', () => {
    expect(decide(actor('GP'), 'fund:edit:own', { ownerOrganizationId: 'org-b' })).toMatchObject({ allowed: false, code: 'OWNERSHIP' });
    expect(decide(actor('GP'), 'fund:edit:own', { ownerOrganizationId: 'org-a' }).allowed).toBe(true);
  });

  it('an unverified manager may draft a listing but not publish it', () => {
    expect(decide(actor('GP', 'PENDING'), 'fund:create').allowed).toBe(true);
    expect(decide(actor('GP', 'PENDING'), 'fund:publish:own', { ownerOrganizationId: 'org-a' })).toMatchObject({ code: 'ACCREDITATION' });
  });
});
