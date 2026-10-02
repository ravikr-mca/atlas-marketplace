// Core domain entities for Atlas Marketplace — a private-markets placement marketplace.
// Sellers (GPs) list fund vehicles seeking capital; buyers (LPs) discover, diligence,
// submit indications of interest, get allocated, and close. See DESIGN.md / proposal/
// for the narrative; this file is the single source of truth for shapes used across
// mock data, UI, and the state machine.
//
// Every enum is a `const` array with its union type derived from it, so the seed-data
// coverage test and the UI dropdowns iterate the exact same list the types are built from.

export const USER_ROLES = ['LP', 'GP', 'ADMIN', 'COMPLIANCE'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  name: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  title?: string;
  verified: boolean; // identity/e-mail verified — separate from the *organization's* accreditation
}

export const ORGANIZATION_KINDS = ['FUND_MANAGER', 'INVESTOR', 'PLATFORM'] as const;
export type OrganizationKind = (typeof ORGANIZATION_KINDS)[number];

export const INVESTOR_TIERS = ['FAMILY_OFFICE', 'SOVEREIGN_WEALTH', 'INSTITUTION', 'UHNWI'] as const;
export type InvestorTier = (typeof INVESTOR_TIERS)[number];

export const ACCREDITATION_STATES = ['VERIFIED', 'PENDING', 'UNVERIFIED'] as const;
export type Accreditation = (typeof ACCREDITATION_STATES)[number];

export interface Organization {
  id: string;
  kind: OrganizationKind;
  name: string;
  logoUrl?: string;
  hqLocation: string;
  bio: string;
  investorTier?: InvestorTier;
  accreditation: Accreditation;
  ticketRange?: { min: number; max: number }; // for investors, USD
  aum?: number; // for fund managers, USD
  foundedYear?: number;
  mandate?: string; // for investors: what they look for — shown on their (restricted) profile
  strategiesOfInterest?: FundStrategy[]; // for investors
  verifiedAt?: string; // ISO — when Greenstone verified accreditation
  verifiedByUserId?: string;
  rejectionReason?: string; // set when an application was rejected
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

export const FUND_STRATEGIES = [
  'PRIVATE_EQUITY_BUYOUT',
  'GROWTH_EQUITY',
  'VENTURE_CAPITAL',
  'PRIVATE_CREDIT',
  'REAL_ASSETS',
  'SECONDARIES',
] as const;
export type FundStrategy = (typeof FUND_STRATEGIES)[number];

export const FUND_VEHICLE_STATUSES = ['DRAFT', 'OPEN', 'OVERSUBSCRIBED', 'ALLOCATING', 'CLOSED', 'WITHDRAWN'] as const;
export type FundVehicleStatus = (typeof FUND_VEHICLE_STATUSES)[number];

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
  committedUsd: number; // server-owned running total (incl. commitments secured off-platform), drives "% subscribed"
  narrativeHtml: string; // Tiptap output
  benchmarkSeries: { year: number; fundIrr: number; benchmarkIrr: number }[]; // for Recharts
  dataRoomDocumentIds: string[];
  closeDate: string; // ISO date
  createdAt: string;
  publishedAt?: string;
}

// The bid/offer/purchase lifecycle. See proposal/diagrams/state-diagram.md for the
// full transition diagram and the concurrency notes referenced from the brief.
export const INDICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ALLOCATED_FULL',
  'ALLOCATED_PARTIAL',
  'DECLINED',
  'WITHDRAWN',
  'SUBSCRIPTION_SENT',
  'KYC_VERIFIED',
  'SIGNED',
  'FUNDED',
] as const;
export type IndicationStatus = (typeof INDICATION_STATUSES)[number];

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
  participantOrgIds: string[]; // [investor org, fund-manager org]
  subject: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderUserId: string;
  body: string;
  sentAt: string;
  readBy: string[]; // user ids who have read it — drives unread counts
}

export const DATA_ROOM_DOCUMENT_KINDS = ['PPM', 'TRACK_RECORD', 'LPA', 'SUBSCRIPTION_AGREEMENT', 'OTHER'] as const;
export type DataRoomDocumentKind = (typeof DATA_ROOM_DOCUMENT_KINDS)[number];

export interface DataRoomDocument {
  id: string;
  fundVehicleId: string;
  title: string;
  kind: DataRoomDocumentKind;
  fileUrl: string;
  sizeBytes: number;
}

export const NOTIFICATION_KINDS = ['SUBSCRIPTION_PROGRESS', 'ALLOCATION', 'MESSAGE', 'DEADLINE', 'ACCREDITATION'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string; // in-app route the notification points to
}

// Append-only record of who did what and when — the evidence behind the "full audit
// log on every state change" claim in the proposal. Written by every mutating mock API
// call (and by login/lockout/consent), read by the audit trail and Compliance views.
export const AUDIT_ENTITY_TYPES = ['INDICATION', 'FUND', 'ORGANIZATION', 'AUTH', 'CONSENT', 'MESSAGE'] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export interface AuditLogEntry {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  actorUserId?: string; // absent for system-originated entries
  action: string; // e.g. SUBMITTED, DECLINED, ALLOCATION_OVERRIDDEN, LOGIN, LOGIN_FAILED
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  at: string; // ISO timestamp
}

// What a user has explicitly agreed to, and when — recorded before they can proceed.
// Placeholder copy in the UI is labelled illustrative, not legal text.
export const CONSENT_KINDS = ['TERMS', 'NDA', 'RISK_ACK'] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

export interface ConsentRecord {
  id: string;
  userId: string;
  kind: ConsentKind;
  fundVehicleId?: string; // NDA is per fund
  indicationId?: string; // risk acknowledgement is per indication
  version: string; // version of the copy that was accepted
  acceptedAt: string;
}
