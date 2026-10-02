import type { FundVehicle } from '../../types/entities';
import { organizations } from './organizations';
import { users } from './users';
import { rawFundVehicles } from './funds';
import { trackRecords } from './trackRecords';
import { indications } from './indications';
import { dataRoomDocuments } from './documents';
import { messageThreads, messages } from './messages';
import { notifications } from './notifications';
import { buildSeedAudit, buildSeedConsents } from './audit';

// Single assembly point for all seed data. Fund -> document links are derived from the
// documents themselves so the two can't disagree.
export const fundVehicles: FundVehicle[] = rawFundVehicles.map((f) => ({
  ...f,
  dataRoomDocumentIds: dataRoomDocuments.filter((d) => d.fundVehicleId === f.id).map((d) => d.id),
}));

export const auditLog = buildSeedAudit({ indications, organizations, users, funds: fundVehicles });
export const consents = buildSeedConsents({ indications, users });

export {
  organizations,
  users,
  trackRecords,
  indications,
  dataRoomDocuments,
  messageThreads,
  messages,
  notifications,
};
