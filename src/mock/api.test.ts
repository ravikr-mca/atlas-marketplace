import { describe, expect, it } from 'vitest';

// Every test starts from the seed with nobody signed in (resetDb is the same action the
// "Reset demo data" menu item uses).
async function freshApi() {
  const api = await import('./api');
  api.resetDb();
  api.setAccessToken(null);
  const as = async (userId: string) => {
    const { token } = await api.demoLogin(userId);
    api.setAccessToken(token);
  };
  return { ...api, as };
}

describe('submitIndication — allocation & concurrency logic', () => {
  it('allocates the full requested amount when capacity remains', async () => {
    const api = await freshApi();
    await api.as('user-lp-1'); // Omar, verified family office
    const result = await api.submitIndication({ idempotencyKey: 'test-full-1', fundVehicleId: 'fv-3', requestedAmountUsd: 1_000_000 });
    expect(result.status).toBe('ALLOCATED_FULL');
    expect(result.allocatedAmountUsd).toBe(1_000_000);
    expect(result.lpOrganizationId).toBe('org-lp-1'); // taken from the session, not the request
  });

  it('allocates nothing when the fund is already at its hard cap, and leaves the indication under review', async () => {
    const api = await freshApi();
    await api.as('user-lp-5'); // no existing indication in fv-2
    // fv-2 is seeded exactly at its hard cap, so there is no capacity left to allocate.
    const result = await api.submitIndication({ idempotencyKey: 'test-partial-1', fundVehicleId: 'fv-2', requestedAmountUsd: 15_000_000 });
    expect(result.allocatedAmountUsd).toBe(0);
    expect(result.status).toBe('UNDER_REVIEW');
  });

  it('is idempotent — retrying the same key returns the original result, not a duplicate', async () => {
    const api = await freshApi();
    await api.as('user-lp-2');
    const input = { idempotencyKey: 'test-idempotent-1', fundVehicleId: 'fv-3', requestedAmountUsd: 2_000_000 };
    const first = await api.submitIndication(input);
    const retry = await api.submitIndication(input);
    expect(retry.id).toBe(first.id);
    const all = await api.fetchIndicationsForFundVehicle('fv-3');
    expect(all.filter((i) => i.idempotencyKey === 'test-idempotent-1')).toHaveLength(1);
  });

  it('scales back a request that only partially fits the remaining hard cap', async () => {
    const api = await freshApi();
    await api.as('user-lp-2');
    const fund = (await api.fetchFundVehicle('fv-3'))!;
    const remaining = fund.hardCapUsd - fund.committedUsd;
    const result = await api.submitIndication({ idempotencyKey: 'test-partial-2', fundVehicleId: 'fv-3', requestedAmountUsd: remaining + 10_000_000 });
    expect(result.allocatedAmountUsd).toBe(remaining);
    expect(result.status).toBe('ALLOCATED_PARTIAL');
    const after = (await api.fetchFundVehicle('fv-3'))!;
    expect(after.committedUsd).toBe(after.hardCapUsd); // pinned exactly at the cap, never over
  });
});

describe('transitionIndication — state machine', () => {
  it('rejects a transition the documented state diagram does not allow', async () => {
    const api = await freshApi();
    await api.as('user-lp-3'); // ind-3 belongs to org-lp-3 and is already SIGNED
    await expect(api.transitionIndication('ind-3', 'WITHDRAW')).rejects.toThrow('Illegal transition');
  });

  it('walks the full allocated -> funded path, each step taken by the right party', async () => {
    const api = await freshApi();
    const ind = (await (async () => { await api.as('user-admin-1'); return api.fetchAllIndications(); })()).find((i) => i.id === 'ind-2')!;
    await api.as(ind.lpOrganizationId.replace('org-', 'user-')); // org-lp-N -> user-lp-N
    expect((await api.transitionIndication('ind-2', 'ACCEPT_ALLOCATION')).status).toBe('SUBSCRIPTION_SENT');
    const fundGp = (await api.fetchFundVehicle(ind.fundVehicleId))!.gpOrganizationId.replace('org-', 'user-');
    await api.as(fundGp);
    expect((await api.transitionIndication('ind-2', 'ADVANCE')).status).toBe('KYC_VERIFIED');
    expect((await api.transitionIndication('ind-2', 'ADVANCE')).status).toBe('SIGNED');
    expect((await api.transitionIndication('ind-2', 'ADVANCE')).status).toBe('FUNDED');
  });

  it('withdrawing an allocated indication releases its capacity, and a full book reopens', async () => {
    const api = await freshApi();
    await api.as('user-admin-1');
    const before = (await api.fetchFundVehicle('fv-2'))!; // Highfield, OVERSUBSCRIBED, committed == hard cap
    const allocated = (await api.fetchIndicationsForFundVehicle('fv-2')).find((i) => i.status === 'ALLOCATED_PARTIAL')!;
    await api.as(allocated.lpOrganizationId.replace('org-', 'user-'));
    expect((await api.transitionIndication(allocated.id, 'WITHDRAW')).status).toBe('WITHDRAWN');
    const after = (await api.fetchFundVehicle('fv-2'))!;
    expect(after.committedUsd).toBe(before.committedUsd - allocated.allocatedAmountUsd!);
    expect(after.status).toBe('OPEN');
  });
});
