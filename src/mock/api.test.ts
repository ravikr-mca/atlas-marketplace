import { beforeEach, describe, expect, it, vi } from 'vitest';

// Each test gets a fresh module instance (fresh in-memory store) since api.ts keeps
// mutable module-level state — the fastest honest way to isolate tests without adding
// a reset function nothing else needs.
async function freshApi() {
  vi.resetModules();
  return import('./api');
}

describe('submitIndication — allocation & concurrency logic', () => {
  it('allocates the full requested amount when capacity remains', async () => {
    const api = await freshApi();
    const result = await api.submitIndication({
      idempotencyKey: 'test-full-1',
      fundVehicleId: 'fv-3', // Sable Ventures Fund II — well under its hard cap in seed data
      lpOrganizationId: 'org-lp-1',
      requestedAmountUsd: 1_000_000,
    });
    expect(result.status).toBe('ALLOCATED_FULL');
    expect(result.allocatedAmountUsd).toBe(1_000_000);
  });

  it('scales back to remaining capacity when the request would exceed the hard cap', async () => {
    const api = await freshApi();
    // fv-2 (Highfield) seed data: committedUsd 940M, hardCapUsd 900M — already over cap,
    // so any further request should allocate 0 and land under review, not negative.
    const result = await api.submitIndication({
      idempotencyKey: 'test-partial-1',
      fundVehicleId: 'fv-2',
      lpOrganizationId: 'org-lp-2',
      requestedAmountUsd: 5_000_000,
    });
    expect(result.allocatedAmountUsd).toBe(0);
    expect(result.status).toBe('UNDER_REVIEW');
  });

  it('is idempotent — retrying the same key returns the original result, not a duplicate', async () => {
    const api = await freshApi();
    const first = await api.submitIndication({
      idempotencyKey: 'test-idempotent-1',
      fundVehicleId: 'fv-3',
      lpOrganizationId: 'org-lp-3',
      requestedAmountUsd: 2_000_000,
    });
    const retry = await api.submitIndication({
      idempotencyKey: 'test-idempotent-1',
      fundVehicleId: 'fv-3',
      lpOrganizationId: 'org-lp-3',
      requestedAmountUsd: 2_000_000,
    });
    expect(retry.id).toBe(first.id);

    const all = await api.fetchIndicationsForFundVehicle('fv-3');
    expect(all.filter((i) => i.idempotencyKey === 'test-idempotent-1')).toHaveLength(1);
  });

  it('scales back a request that only partially fits the remaining hard cap', async () => {
    const api = await freshApi();
    const fund = await api.fetchFundVehicle('fv-3');
    const remaining = fund!.hardCapUsd - fund!.committedUsd; // 175M - 42M = 133M in seed data

    const result = await api.submitIndication({
      idempotencyKey: 'test-partial-2',
      fundVehicleId: 'fv-3',
      lpOrganizationId: 'org-lp-1',
      requestedAmountUsd: remaining + 10_000_000, // deliberately over what's left
    });

    expect(result.allocatedAmountUsd).toBe(remaining);
    expect(result.status).toBe('ALLOCATED_PARTIAL');

    const after = await api.fetchFundVehicle('fv-3');
    expect(after!.committedUsd).toBe(fund!.hardCapUsd); // pinned exactly at the cap, never over
  });
});
