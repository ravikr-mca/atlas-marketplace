import type { Message, MessageThread } from '../../types/entities';

// Fund-scoped LP<->GP diligence threads. A thread belongs to the *deal*, not the two
// individuals, so a colleague can pick it up without losing context (see erd.md).
// `readBy` drives unread counts: thr-1's last message and thr-5's only reply-needed
// message are deliberately unread by the receiving side.
export const messageThreads: MessageThread[] = [
  { id: 'thr-1', fundVehicleId: 'fv-1', participantOrgIds: ['org-lp-1', 'org-gp-1'], subject: 'Fund III realized exits and fee offsets' },
  { id: 'thr-2', fundVehicleId: 'fv-4', participantOrgIds: ['org-lp-3', 'org-gp-4'], subject: 'Anchor ticket and co-investment rights' },
  { id: 'thr-3', fundVehicleId: 'fv-5', participantOrgIds: ['org-lp-2', 'org-gp-5'], subject: 'Final close timing and side-letter terms' },
  { id: 'thr-4', fundVehicleId: 'fv-2', participantOrgIds: ['org-lp-1', 'org-gp-2'], subject: 'Waitlist position on the oversubscribed book' },
  { id: 'thr-5', fundVehicleId: 'fv-6', participantOrgIds: ['org-lp-5', 'org-gp-5'], subject: 'Secondaries pricing methodology' },
  { id: 'thr-6', fundVehicleId: 'fv-3', participantOrgIds: ['org-lp-4', 'org-gp-3'], subject: 'Minimum ticket and founder references' },
];

type Spec = [string, string, string, string, string, string[]];

const SPECS: Spec[] = [
  ['msg-1', 'thr-1', 'user-lp-1', 'Could you share the realized-exit detail behind Fund III’s 2.4x, and how management-fee offsets work for transaction fees?', '2026-09-21T08:15:00Z', ['user-lp-1', 'user-gp-1']],
  ['msg-2', 'thr-1', 'user-gp-1', 'Of course — the exit schedule is in the data room under Fund III Track Record. 100% of transaction fees offset the management fee.', '2026-09-21T10:40:00Z', ['user-lp-1', 'user-gp-1']],
  ['msg-3', 'thr-1', 'user-lp-1', 'Thanks. Is the 40%+ ARR-growth screen applied at entry or on a trailing basis?', '2026-09-22T07:50:00Z', ['user-lp-1']],

  ['msg-4', 'thr-2', 'user-lp-3', 'We are considering an anchor ticket of up to $60M. Are co-investment rights available at that size?', '2026-09-28T09:05:00Z', ['user-lp-3', 'user-gp-4']],
  ['msg-5', 'thr-2', 'user-gp-4', 'Yes — anchors above $50M receive a pro-rata co-investment right on every platform asset. Happy to walk through the pipeline.', '2026-09-28T13:20:00Z', ['user-lp-3', 'user-gp-4']],

  ['msg-6', 'thr-3', 'user-lp-2', 'We have been allocated $40M — can you confirm the date of the final close and whether side-letter terms are standard?', '2026-09-30T08:00:00Z', ['user-lp-2', 'user-gp-5']],
  ['msg-7', 'thr-3', 'user-gp-5', 'Final close is 20 October. Side letters follow our standard MFN template; we will send it with the subscription documents.', '2026-09-30T11:30:00Z', ['user-lp-2', 'user-gp-5']],

  ['msg-8', 'thr-4', 'user-lp-1', 'We see our $25M indication is waitlisted. What is the realistic probability of an allocation before the close?', '2026-09-26T09:00:00Z', ['user-lp-1', 'user-gp-2']],
  ['msg-9', 'thr-4', 'user-gp-2', 'Unlikely at this stage — the book is covered about 1.4x. If a commitment drops out you would be first in line. We would also welcome you in Fund VIII.', '2026-09-26T15:10:00Z', ['user-lp-1', 'user-gp-2']],
  ['msg-10', 'thr-4', 'user-lp-1', 'Understood, thank you for the candour. Please keep us on the list.', '2026-09-26T15:45:00Z', ['user-lp-1', 'user-gp-2']],

  ['msg-11', 'thr-5', 'user-lp-5', 'How do you price LP stakes — NAV discount, or a model-based valuation with a cap?', '2026-10-01T12:00:00Z', ['user-lp-5']],

  ['msg-12', 'thr-6', 'user-lp-4', 'Is $1M the true floor, or is there flexibility for a first-time commitment from a private office?', '2026-09-14T10:00:00Z', ['user-lp-4', 'user-gp-3']],
  ['msg-13', 'thr-6', 'user-gp-3', 'The floor is $1M, but we can accept $500k via a feeder for first-time investors. Founder references available on request.', '2026-09-14T14:25:00Z', ['user-lp-4', 'user-gp-3']],
];

export const messages: Message[] = SPECS.map(([id, threadId, senderUserId, body, sentAt, readBy]) => ({
  id,
  threadId,
  senderUserId,
  body,
  sentAt,
  readBy,
}));
