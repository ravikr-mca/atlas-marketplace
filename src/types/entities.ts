// Core domain entities for Atlas Marketplace — a private-markets placement marketplace.
// Sellers (GPs) list fund vehicles seeking capital; buyers (LPs) discover, diligence,
// submit indications of interest, get allocated, and close. See DESIGN.md / proposal/
// for the narrative; this file is the single source of truth for shapes used across
// mock data, UI, and the state machine.

export type UserRole = 'LP' | 'GP' | 'ADMIN' | 'COMPLIANCE';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  title?: string;
  verified: boolean;
}

export type OrganizationKind = 'FUND_MANAGER' | 'INVESTOR';
export type InvestorTier = 'FAMILY_OFFICE' | 'SOVEREIGN_WEALTH' | 'INSTITUTION' | 'UHNWI';

export interface Organization {
  id: string;
  kind: OrganizationKind;
  name: string;
  logoUrl?: string;
  hqLocation: string;
  bio: string;
  investorTier?: InvestorTier;
  accreditation: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  ticketRange?: { min: number; max: number }; // for investors, USD
  aum?: number; // for fund managers, USD
  foundedYear?: number;
}

export interface TrackRecordEntry {
  id: string;
  gpOrganizationId: string; // prior fund raised by this GP firm — belongs on the org, not a single fund vehicle
  fundName: string;
  vintage: number;
  strategy: string;
  netIrr: number; // percent
  moic: number; // multiple on invested capital
  status: 'REALIZED' | 'ACTIVE';
}

export type FundStrategy =
  | 'PRIVATE_EQUITY_BUYOUT'
  | 'GROWTH_EQUITY'
  | 'VENTURE_CAPITAL'
  | 'PRIVATE_CREDIT'
  | 'REAL_ASSETS'
  | 'SECONDARIES';

export type FundVehicleStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'OVERSUBSCRIBED'
  | 'ALLOCATING'
  | 'CLOSED'
  | 'WITHDRAWN';

export interface FundVehicle {
  id: string;
  gpOrganizationId: string;
  name: string;
  strategy: FundStrategy;
  vintage: number;
  geography: string[];
  targetSizeUsd: number;
  hardCapUsd: number;
  minimumCommitmentUsd: number;
  managementFeePct: number;
  carryPct: number;
  status: FundVehicleStatus;
  committedUsd: number; // running total, drives "% subscribed"
  narrativeHtml: string; // Tiptap output
  benchmarkSeries: { year: number; fundIrr: number; benchmarkIrr: number }[]; // for Recharts
  dataRoomDocumentIds: string[];
  closeDate: string; // ISO date
  createdAt: string;
}

// The bid/offer/purchase lifecycle. See proposal/diagrams/state-diagram.md for the
// full transition diagram and the concurrency notes referenced from the brief.
export type IndicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ALLOCATED_FULL'
  | 'ALLOCATED_PARTIAL'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'SUBSCRIPTION_SENT'
  | 'KYC_VERIFIED'
  | 'SIGNED'
  | 'FUNDED';

export interface IndicationOfInterest {
  id: string;
  idempotencyKey: string; // client-generated, prevents duplicate submission on retry
  fundVehicleId: string;
  lpOrganizationId: string;
  requestedAmountUsd: number;
  allocatedAmountUsd?: number;
  status: IndicationStatus;
  submittedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface MessageThread {
  id: string;
  fundVehicleId: string;
  participantOrgIds: string[];
  subject: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  sentAt: string;
}

export interface DataRoomDocument {
  id: string;
  fundVehicleId: string;
  title: string;
  kind: 'PPM' | 'TRACK_RECORD' | 'LPA' | 'SUBSCRIPTION_AGREEMENT' | 'OTHER';
  fileUrl: string;
  sizeBytes: number;
}

export interface Notification {
  id: string;
  userId: string;
  kind: 'SUBSCRIPTION_PROGRESS' | 'ALLOCATION' | 'MESSAGE' | 'DEADLINE';
  body: string;
  createdAt: string;
  read: boolean;
}
