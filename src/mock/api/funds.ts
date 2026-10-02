import { db, delay, wire } from '../db';
import { authorize, type Ctx } from './context';
import type { FundVehicle } from '../../types/entities';

// Drafts are private to the owning manager (and Greenstone admins who review listings).
export const canSeeFund = ({ user, org }: Ctx, fund: FundVehicle) =>
  fund.status !== 'DRAFT' || fund.gpOrganizationId === org.id || user.role === 'ADMIN';

export async function fetchFundVehicles(): Promise<FundVehicle[]> {
  await delay(null);
  const ctx = authorize('fund:browse');
  return wire(db.funds.filter((f) => canSeeFund(ctx, f)));
}

// `| null`, not `| undefined`: TanStack Query treats an undefined queryFn result as an
// error. A fund the caller isn't allowed to see is also null — don't leak that it exists.
export async function fetchFundVehicle(id: string): Promise<FundVehicle | null> {
  await delay(null);
  const ctx = authorize('fund:browse');
  const fund = db.funds.find((f) => f.id === id);
  return fund && canSeeFund(ctx, fund) ? wire(fund) : null;
}

export async function fetchDataRoomDocuments(fundVehicleId: string) {
  await delay(null);
  const ctx = authorize('dataroom:view');
  const fund = db.funds.find((f) => f.id === fundVehicleId);
  if (!fund || !canSeeFund(ctx, fund)) return [];
  return wire(db.documents.filter((d) => d.fundVehicleId === fundVehicleId));
}
