import type { Notification } from '../../types/entities';

// All five notification kinds, mix of read/unread, across several personas so the bell
// is never empty for the demo accounts. Deadline reminders for live funds are *also*
// computed from closeDate at read time (see api.ts); these seeds are the persisted ones.
export const notifications: Notification[] = [
  { id: 'ntf-1', userId: 'user-lp-1', kind: 'ALLOCATION', body: 'Your $25M indication in Corniche GCC Buyout Fund III was fully allocated — subscription documents are ready.', createdAt: '2026-09-30T09:10:00Z', read: false, link: '/dashboard' },
  { id: 'ntf-2', userId: 'user-lp-1', kind: 'MESSAGE', body: 'Elena Marsh replied about Fund III exits and fee offsets.', createdAt: '2026-09-21T10:40:00Z', read: true, link: '/messages' },
  { id: 'ntf-3', userId: 'user-lp-1', kind: 'DEADLINE', body: 'Meridian Growth Fund IV closes on 15 Nov — your indication is still under review.', createdAt: '2026-10-01T06:00:00Z', read: false, link: '/funds/fv-1' },
  { id: 'ntf-4', userId: 'user-lp-3', kind: 'ALLOCATION', body: 'Your $150M indication in Corniche GCC Buyout Fund III was scaled back to $120M pro-rata.', createdAt: '2026-09-30T09:00:00Z', read: false, link: '/dashboard' },
  { id: 'ntf-5', userId: 'user-lp-3', kind: 'MESSAGE', body: 'Rashid Al Nuaimi replied about anchor tickets and co-investment rights.', createdAt: '2026-09-28T13:20:00Z', read: false, link: '/messages' },
  { id: 'ntf-6', userId: 'user-lp-2', kind: 'SUBSCRIPTION_PROGRESS', body: 'Corniche GCC Buyout Fund III is now 95% subscribed against its hard cap.', createdAt: '2026-09-29T07:30:00Z', read: true, link: '/funds/fv-5' },
  { id: 'ntf-7', userId: 'user-lp-5', kind: 'MESSAGE', body: 'Your question to Corniche about secondaries pricing is awaiting a reply.', createdAt: '2026-10-01T12:00:00Z', read: true, link: '/messages' },
  { id: 'ntf-8', userId: 'user-lp-4', kind: 'ALLOCATION', body: 'Your $5M indication in Meridian Growth Fund IV was fully allocated.', createdAt: '2026-09-22T10:00:00Z', read: true, link: '/dashboard' },

  { id: 'ntf-9', userId: 'user-gp-1', kind: 'SUBSCRIPTION_PROGRESS', body: 'Meridian Growth Fund IV reached 60% of its hard cap.', createdAt: '2026-09-23T08:00:00Z', read: true, link: '/funds/fv-1' },
  { id: 'ntf-10', userId: 'user-gp-1', kind: 'MESSAGE', body: 'Omar Al Farsi asked a follow-up question about the ARR-growth screen.', createdAt: '2026-09-22T07:50:00Z', read: false, link: '/messages' },
  { id: 'ntf-11', userId: 'user-gp-1', kind: 'ALLOCATION', body: 'New indication: Al Barari Family Office requested $15M in Meridian Growth Fund IV.', createdAt: '2026-09-20T09:00:00Z', read: false, link: '/dashboard' },
  { id: 'ntf-12', userId: 'user-gp-4', kind: 'DEADLINE', body: 'Dunes Gulf Residential Income Fund I passed its scheduled close date — extend the close or close below target.', createdAt: '2026-09-16T06:00:00Z', read: false, link: '/funds/fv-10' },
  { id: 'ntf-13', userId: 'user-gp-5', kind: 'MESSAGE', body: 'Dana Al Thani asked about secondaries pricing methodology.', createdAt: '2026-10-01T12:00:00Z', read: false, link: '/messages' },
  { id: 'ntf-14', userId: 'user-gp-6', kind: 'ACCREDITATION', body: 'Your accreditation application is under review. You can keep drafts, but cannot publish until it is approved.', createdAt: '2026-09-28T09:00:00Z', read: false, link: '/help/roles' },

  { id: 'ntf-15', userId: 'user-lp-6', kind: 'ACCREDITATION', body: 'Your accreditation application is under review. You can browse funds but not submit indications yet.', createdAt: '2026-09-18T09:00:00Z', read: true, link: '/help/roles' },
  { id: 'ntf-16', userId: 'user-lp-7', kind: 'ACCREDITATION', body: 'Your accreditation application is under review — identity and source-of-funds checks are in progress.', createdAt: '2026-09-29T09:00:00Z', read: false, link: '/help/roles' },
  { id: 'ntf-17', userId: 'user-lp-8', kind: 'ACCREDITATION', body: 'Upload your accreditation documents to start verification.', createdAt: '2026-09-30T09:00:00Z', read: false, link: '/help/roles' },

  { id: 'ntf-18', userId: 'user-admin-1', kind: 'ACCREDITATION', body: 'Gulf Pension Collective and Maktoum Ventures Office are awaiting accreditation review.', createdAt: '2026-09-29T09:30:00Z', read: false, link: '/admin/approvals' },
  { id: 'ntf-19', userId: 'user-compliance-1', kind: 'ALLOCATION', body: 'Weekly digest: 6 allocation decisions and 1 decline recorded in the audit trail.', createdAt: '2026-10-01T05:00:00Z', read: true, link: '/audit' },
];
