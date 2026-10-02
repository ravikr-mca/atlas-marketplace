import type { DataRoomDocument, DataRoomDocumentKind } from '../../types/entities';

// Compact spec table: [id, fundVehicleId, title, kind, size in MB].
// fv-9 is a DRAFT with only an OTHER document on purpose — it demonstrates the publish
// gate (a PPM and a track-record document are required), see the listing wizard.
// doc-1..doc-4 are the original seed documents; ids are stable.
type Spec = [string, string, string, DataRoomDocumentKind, number];

const SPECS: Spec[] = [
  ['doc-1', 'fv-1', 'Meridian Fund IV — PPM', 'PPM', 2.4],
  ['doc-2', 'fv-1', 'Fund III Track Record', 'TRACK_RECORD', 0.89],
  ['doc-5', 'fv-1', 'Meridian Fund IV — Limited Partnership Agreement', 'LPA', 1.9],
  ['doc-6', 'fv-1', 'Meridian Fund IV — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.6],
  ['doc-7', 'fv-1', 'Fund IV Fee & Expense Summary', 'OTHER', 0.3],

  ['doc-3', 'fv-2', 'Highfield Fund VII — PPM', 'PPM', 3.1],
  ['doc-8', 'fv-2', 'Fund VI Realized Loan Performance', 'TRACK_RECORD', 1.2],
  ['doc-9', 'fv-2', 'Highfield Fund VII — Limited Partnership Agreement', 'LPA', 2.2],
  ['doc-10', 'fv-2', 'Highfield Fund VII — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.7],

  ['doc-4', 'fv-3', 'Sable Ventures Fund II — PPM', 'PPM', 1.75],
  ['doc-11', 'fv-3', 'Fund I Portfolio Summary', 'TRACK_RECORD', 0.8],
  ['doc-12', 'fv-3', 'Founder Reference Pack', 'OTHER', 1.1],

  ['doc-13', 'fv-4', 'Dunes Logistics & Infrastructure Fund II — PPM', 'PPM', 2.8],
  ['doc-14', 'fv-4', 'Fund I Realized Performance', 'TRACK_RECORD', 1.0],
  ['doc-15', 'fv-4', 'Fund II — Limited Partnership Agreement', 'LPA', 2.0],
  ['doc-16', 'fv-4', 'Fund II — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.6],
  ['doc-17', 'fv-4', 'Pipeline Site Visit Deck', 'OTHER', 4.2],

  ['doc-18', 'fv-5', 'Corniche Buyout Fund III — PPM', 'PPM', 3.4],
  ['doc-19', 'fv-5', 'Fund II Realized Track Record', 'TRACK_RECORD', 1.5],
  ['doc-20', 'fv-5', 'Fund III — Limited Partnership Agreement', 'LPA', 2.4],
  ['doc-21', 'fv-5', 'Fund III — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.7],

  ['doc-22', 'fv-6', 'Corniche Secondaries Fund I — PPM', 'PPM', 2.1],
  ['doc-23', 'fv-6', 'Corniche Realized Track Record', 'TRACK_RECORD', 1.3],
  ['doc-24', 'fv-6', 'Secondaries Fund I — Limited Partnership Agreement', 'LPA', 1.8],
  ['doc-25', 'fv-6', 'Pricing & Valuation Policy', 'OTHER', 0.5],

  ['doc-26', 'fv-7', 'Highfield Opportunistic Credit III — PPM', 'PPM', 2.9],
  ['doc-27', 'fv-7', 'Opportunistic Credit Track Record', 'TRACK_RECORD', 1.1],
  ['doc-28', 'fv-7', 'Opportunistic Credit III — Limited Partnership Agreement', 'LPA', 2.1],

  ['doc-29', 'fv-8', 'Co-Invest Vehicle Summary', 'PPM', 0.9],
  ['doc-30', 'fv-8', 'Withdrawal Notice to Investors', 'OTHER', 0.2],

  ['doc-31', 'fv-10', 'Dunes Residential Income Fund I — PPM', 'PPM', 2.5],
  ['doc-32', 'fv-10', 'Residential Portfolio Track Record', 'TRACK_RECORD', 0.9],
  ['doc-33', 'fv-10', 'Residential Income Fund I — Limited Partnership Agreement', 'LPA', 1.9],
  ['doc-34', 'fv-10', 'Residential Income Fund I — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.6],

  ['doc-35', 'fv-11', 'Meridian Industrial Technology Buyout I — PPM', 'PPM', 2.6],
  ['doc-36', 'fv-11', 'Meridian Growth Track Record (Funds I–III)', 'TRACK_RECORD', 1.4],
  ['doc-37', 'fv-11', 'Buyout Fund I — Limited Partnership Agreement', 'LPA', 2.0],

  ['doc-38', 'fv-12', 'Highfield Infrastructure Debt Fund I — PPM', 'PPM', 3.0],
  ['doc-39', 'fv-12', 'Infrastructure Credit Track Record', 'TRACK_RECORD', 1.2],
  ['doc-40', 'fv-12', 'Infrastructure Debt Fund I — Limited Partnership Agreement', 'LPA', 2.3],
  ['doc-41', 'fv-12', 'Infrastructure Debt Fund I — Subscription Agreement', 'SUBSCRIPTION_AGREEMENT', 0.7],

  ['doc-42', 'fv-9', 'Northgate Teaser (draft)', 'OTHER', 0.4],
];

export const dataRoomDocuments: DataRoomDocument[] = SPECS.map(([id, fundVehicleId, title, kind, mb]) => ({
  id,
  fundVehicleId,
  title,
  kind,
  fileUrl: '#',
  sizeBytes: Math.round(mb * 1_000_000),
}));
