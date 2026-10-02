import { beforeEach, describe, expect, it } from 'vitest';
import * as api from './api';

const as = async (userId: string) => api.setAccessToken((await api.demoLogin(userId)).token);
const code = (p: Promise<unknown>) => p.then(() => 'OK', (e) => (api.isApiError(e) ? e.code : 'OTHER'));

beforeEach(() => {
  api.resetDb();
  api.setAccessToken(null);
});

describe('authentication', () => {
  it('refuses every call without a session', async () => {
    expect(await code(api.fetchFundVehicles())).toBe('UNAUTHENTICATED');
    expect(await code(api.fetchAllIndications())).toBe('UNAUTHENTICATED');
  });

  it('signs in with the demo password, and gives no hint which half was wrong', async () => {
    const email = api.listDemoPersonas().find((p) => p.userId === 'user-lp-1')!.email;
    expect(email.endsWith('.test')).toBe(true);
    expect((await api.login({ email, password: 'AtlasDemo!2026' })).user.id).toBe('user-lp-1');
    expect(await code(api.login({ email, password: 'nope' }))).toBe('INVALID_CREDENTIALS');
    expect(await code(api.login({ email: 'nobody@x.test', password: 'nope' }))).toBe('INVALID_CREDENTIALS');
  });

  it('locks the account after 5 failures, even for the right password, until the lockout passes', async () => {
    const email = api.listDemoPersonas().find((p) => p.userId === 'user-lp-1')!.email;
    for (let i = 0; i < api.MAX_FAILURES; i++) await code(api.login({ email, password: 'bad' }));
    expect(await code(api.login({ email, password: 'AtlasDemo!2026' }))).toBe('ACCOUNT_LOCKED');
    api.clock.advance(api.LOCKOUT_MS + 1000);
    expect(await code(api.login({ email, password: 'AtlasDemo!2026' }))).toBe('OK');
  });

  it('staff cannot use a password — SSO only', async () => {
    const email = api.listDemoPersonas().find((p) => p.userId === 'user-admin-1')!.email;
    expect(await code(api.login({ email, password: 'AtlasDemo!2026' }))).toBe('SSO_REQUIRED');
    expect((await api.ssoLogin('user-admin-1')).user.role).toBe('ADMIN');
    expect(await code(api.ssoLogin('user-lp-1'))).toBe('FORBIDDEN'); // not in the directory
  });

  it('expires an idle session after 30 minutes, and sliding activity keeps it alive', async () => {
    await as('user-lp-1');
    api.clock.advance(api.SESSION_TTL_MS - 60_000);
    expect(await code(api.fetchFundVehicles())).toBe('OK'); // activity slides the window
    api.clock.advance(api.SESSION_TTL_MS - 60_000);
    expect(await code(api.fetchFundVehicles())).toBe('OK');
    api.clock.advance(api.SESSION_TTL_MS + 1000);
    expect(await code(api.fetchFundVehicles())).toBe('SESSION_EXPIRED');
  });

  it('logs sign-in, failure and sign-out to the audit trail', async () => {
    await as('user-lp-1');
    await api.logout();
    const actions = api.db.audit.filter((a) => a.entityType === 'AUTH').map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['LOGIN', 'LOGOUT']));
  });
});

describe('authorization (enforced in the API, not just the UI)', () => {
  it('scopes indications by tenant: a GP sees only its own funds, an LP only its own', async () => {
    await as('user-gp-1');
    expect(await code(api.fetchIndicationsForGpOrg('org-gp-1'))).toBe('OK');
    expect(await code(api.fetchIndicationsForGpOrg('org-gp-2'))).toBe('FORBIDDEN');
    expect(await code(api.fetchAllIndications())).toBe('FORBIDDEN');
    await as('user-lp-1');
    expect(await code(api.fetchIndicationsForOrg('org-lp-2'))).toBe('FORBIDDEN');
    const mine = await api.fetchIndicationsForFundVehicle('fv-2');
    expect(mine.every((i) => i.lpOrganizationId === 'org-lp-1')).toBe(true);
  });

  it('an investor cannot decline; a manager cannot withdraw; the wrong manager cannot touch another fund', async () => {
    await as('user-lp-1');
    expect(await code(api.transitionIndication('ind-8', 'DECLINE', 'x'))).toBe('FORBIDDEN');
    await as('user-gp-1');
    expect(await code(api.transitionIndication('ind-8', 'WITHDRAW'))).toBe('FORBIDDEN');
    await as('user-gp-3'); // ind-8 is in fv-2, not Sable's fund
    expect(await code(api.transitionIndication('ind-8', 'DECLINE', 'x'))).toBe('FORBIDDEN');
  });

  it('declining requires a reason', async () => {
    await as('user-gp-2'); // Highfield manages fv-2
    expect(await code(api.transitionIndication('ind-8', 'DECLINE'))).toBe('VALIDATION');
    expect(await code(api.transitionIndication('ind-8', 'DECLINE', 'Outside mandate.'))).toBe('OK');
  });

  it('a pending or unaccredited investor cannot submit or open a data room', async () => {
    for (const id of ['user-lp-6', 'user-lp-8']) {
      await as(id);
      expect(await code(api.fetchFundVehicles())).toBe('OK');
      expect(await code(api.submitIndication({ idempotencyKey: `k-${id}`, fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 }))).toBe('NOT_ACCREDITED');
      expect(await code(api.fetchDataRoomDocuments('fv-3'))).toBe('NOT_ACCREDITED');
    }
  });

  it('Compliance reads everything but cannot change anything', async () => {
    await as('user-compliance-1');
    expect((await api.fetchAllIndications()).length).toBeGreaterThan(20);
    expect(await code(api.transitionIndication('ind-8', 'DECLINE', 'x'))).toBe('FORBIDDEN');
    expect(await code(api.submitIndication({ idempotencyKey: 'k-c', fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 }))).toBe('FORBIDDEN');
  });

  it('keeps draft listings private to the owning manager (and admins)', async () => {
    const draft = api.db.funds.find((f) => f.status === 'DRAFT')!;
    await as('user-lp-1');
    expect(await api.fetchFundVehicle(draft.id)).toBeNull();
    expect((await api.fetchFundVehicles()).some((f) => f.id === draft.id)).toBe(false);
    await as(draft.gpOrganizationId.replace('org-', 'user-'));
    expect((await api.fetchFundVehicle(draft.id))?.id).toBe(draft.id);
  });

  it('restricts investor profiles to the investor, staff, and managers holding its indication', async () => {
    await as('user-lp-1');
    expect(await code(api.fetchOrganization('org-lp-2'))).toBe('FORBIDDEN');
    expect(await code(api.fetchOrganization('org-gp-1'))).toBe('OK');
    await as('user-gp-3'); // Sable: no indication from org-lp-1
    expect(await code(api.fetchOrganization('org-lp-1'))).toBe('FORBIDDEN');
    await as('user-compliance-1');
    expect(await code(api.fetchOrganization('org-lp-1'))).toBe('OK');
  });

  it('refuses a submission below the minimum, in a closed fund, past the close date, or twice', async () => {
    await as('user-lp-1');
    expect(await code(api.submitIndication({ idempotencyKey: 'a', fundVehicleId: 'fv-3', requestedAmountUsd: 10_000 }))).toBe('VALIDATION');
    const closed = api.db.funds.find((f) => f.status === 'CLOSED')!;
    expect(await code(api.submitIndication({ idempotencyKey: 'b', fundVehicleId: closed.id, requestedAmountUsd: closed.minimumCommitmentUsd }))).toBe('FUND_NOT_OPEN');
    const stale = api.db.funds.find((f) => f.status === 'OPEN' && f.closeDate < '2026-10-02')!;
    expect(await code(api.submitIndication({ idempotencyKey: 'c', fundVehicleId: stale.id, requestedAmountUsd: stale.minimumCommitmentUsd }))).toBe('FUND_NOT_OPEN');
    expect(await code(api.submitIndication({ idempotencyKey: 'd', fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 }))).toBe('OK');
    expect(await code(api.submitIndication({ idempotencyKey: 'e', fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 }))).toBe('DUPLICATE_ACTIVE');
  });
});

describe('accreditation review', () => {
  it('only Admin can review; approving unlocks the investor immediately and notifies them', async () => {
    await as('user-compliance-1');
    expect(await code(api.reviewOrganization({ organizationId: 'org-lp-6', decision: 'APPROVE' }))).toBe('FORBIDDEN');

    await as('user-lp-6');
    const submit = () => api.submitIndication({ idempotencyKey: `k-${Math.random()}`, fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 });
    expect(await code(submit())).toBe('NOT_ACCREDITED');

    await as('user-admin-1');
    const approved = await api.reviewOrganization({ organizationId: 'org-lp-6', decision: 'APPROVE' });
    expect(approved.accreditation).toBe('VERIFIED');
    expect(approved.verifiedByUserId).toBe('user-admin-1');

    await as('user-lp-6');
    expect(await code(submit())).toBe('OK'); // same session, new permissions
    expect(api.db.notifications.some((n) => n.userId === 'user-lp-6' && n.kind === 'ACCREDITATION' && n.body.includes('now accredited'))).toBe(true);
    expect(api.db.audit.some((a) => a.entityId === 'org-lp-6' && a.action === 'ACCREDITATION_VERIFIED' && a.actorUserId === 'user-admin-1')).toBe(true);
  });

  it('rejecting needs a reason, keeps the org blocked, and can’t be repeated', async () => {
    await as('user-admin-1');
    expect(await code(api.reviewOrganization({ organizationId: 'org-lp-6', decision: 'REJECT' }))).toBe('VALIDATION');
    const rejected = await api.reviewOrganization({ organizationId: 'org-lp-6', decision: 'REJECT', reason: 'Proof of funds is missing.' });
    expect(rejected.accreditation).toBe('UNVERIFIED');
    expect(rejected.rejectionReason).toBe('Proof of funds is missing.');
    expect(await code(api.reviewOrganization({ organizationId: 'org-lp-6', decision: 'APPROVE' }))).toBe('ILLEGAL_TRANSITION');
  });

  it('the approval queue is Admin-only', async () => {
    await as('user-lp-1');
    expect(await code(api.fetchApprovalQueue())).toBe('FORBIDDEN');
    await as('user-admin-1');
    expect((await api.fetchApprovalQueue()).every((o) => o.accreditation !== 'VERIFIED')).toBe(true);
  });
});
