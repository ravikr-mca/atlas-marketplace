import type { FundVehicle } from '../types/entities';

/**
 * Whether a fund can take new indications right now. Shared by the API (which refuses)
 * and the UI (which explains before the investor even tries).
 *
 * OVERSUBSCRIBED still accepts indications on purpose: the book is covered, so new
 * demand joins the waitlist behind existing allocations (see "book coverage").
 */
export type AcceptanceResult =
  | { ok: true }
  | { ok: false; code: 'NOT_OPEN' | 'CLOSE_DATE_PASSED'; message: string };

const NOT_OPEN_MESSAGE: Partial<Record<FundVehicle['status'], string>> = {
  DRAFT: 'This listing is still a private draft.',
  ALLOCATING: 'The book is closed to new indications while the manager completes allocations ahead of the final close.',
  CLOSED: 'This fund has closed and is no longer accepting indications.',
  WITHDRAWN: 'The manager has withdrawn this listing.',
};

export function fundAcceptsIndications(
  fund: Pick<FundVehicle, 'status' | 'closeDate'>,
  now: Date = new Date(),
): AcceptanceResult {
  if (fund.status !== 'OPEN' && fund.status !== 'OVERSUBSCRIBED') {
    return { ok: false, code: 'NOT_OPEN', message: NOT_OPEN_MESSAGE[fund.status] ?? 'This fund is not accepting indications.' };
  }
  // closeDate is a calendar date; the fund accepts indications through the end of that day.
  const endOfCloseDay = Date.parse(`${fund.closeDate}T23:59:59Z`);
  if (now.getTime() > endOfCloseDay) {
    return {
      ok: false,
      code: 'CLOSE_DATE_PASSED',
      message: 'The scheduled close date has passed. The manager needs to extend the close or close the fund.',
    };
  }
  return { ok: true };
}

/** Requested demand on the book divided by the hard cap — how many times the cap is "covered". */
export function bookCoverage(requestedActiveUsd: number, hardCapUsd: number): number {
  return hardCapUsd === 0 ? 0 : requestedActiveUsd / hardCapUsd;
}
