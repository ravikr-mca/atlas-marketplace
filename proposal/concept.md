# Atlas Marketplace — Concept

Working source for the concept presentation and companion proposal doc. This is the
narrative spine; Phases 2–5 turn it into diagrams, the deck, and the PDF.

## Category and participants

**What's traded:** access to private-market fund vehicles — commitments of capital into
closed-end funds (growth equity, venture, private credit, real assets, secondaries)
managed by professional fund managers (GPs).

**Why this category suits a marketplace model:** capital placement is currently a
relationship-driven, largely offline process — exactly the kind of high-friction,
information-asymmetric market a marketplace disintermediates. It also has a genuine
two-sided cold-start problem (GPs need credible LPs; LPs need vetted GPs), real
listing/valuation questions (track record, fees, terms — not a fixed price), and a real
bid/negotiation dynamic (funds get oversubscribed and must allocate). It is *not* a
generic e-commerce fit-for-anything category — which is exactly why it's a stronger proof
of product thinking than a physical-goods or collectables marketplace would be.

**Why this specific category:** it mirrors Greenstone's own business (GCC investors ↔
global fund managers) closely enough to show I understand what they do, without literally
describing their existing platform — Atlas Marketplace productizes the *category* of
problem Greenstone's placement team solves manually today.

**Sellers — Fund Managers (GPs).** Need: credible, qualified demand for a raise; a way to
show track record and differentiate from other funds currently raising; a controlled,
auditable process for allocating an oversubscribed fund; compliant handling of sensitive
LP data during diligence.

**Buyers — Investors (LPs): family offices, sovereign wealth funds, institutions,
UHNWIs.** Need: a trustworthy way to discover funds that fit their mandate (strategy,
geography, ticket size, vintage); enough diligence material to compare funds without a
GP's IR team as the only channel; a clear, provable path from expressing interest to a
signed subscription; confidence the platform enforces accreditation on the other GPs and
LPs, not just claims to.

## Principal journeys

**GP journey — raise a fund.** Register org → Greenstone/Admin verifies accreditation &
compliance → create `FundVehicle` listing (strategy, terms, narrative, track record, data
room documents) → publish (status `OPEN`) → monitor live subscription progress and
incoming indications → review/negotiate on submitted indications → as the fund approaches
its hard cap, allocate (full or pro-rata partial) → send subscription documents → track
KYC/AML + signature completion → close fund (`FUNDED`).

**LP journey — commit capital.** Register org → complete accreditation/KYC profile →
browse/filter fund vehicles by strategy, geography, vintage, ticket size → open a fund's
detail page (narrative, track record chart vs benchmark, data room) → message the GP with
diligence questions → submit an Indication of Interest (amount) → track status live
(`SUBMITTED` → `UNDER_REVIEW` → `ALLOCATED_FULL`/`ALLOCATED_PARTIAL`) → receive
subscription documents → complete KYC/AML → sign → fund the commitment.

**Key decision points / marketplace states:** whether to publish a listing before track
record documents are fully uploaded (blocked — `DRAFT` gate); what happens when total
requested indications exceed the hard cap (pro-rata scale-back, not first-come-first-served
— explained in the state diagram); whether an LP can withdraw a submitted indication before
allocation (yes, `WITHDRAWN`); what happens if the close date passes with the fund still
under target (GP choice: extend close date or close under target — modeled as a GP action,
not automated).

## Marketplace mechanics

- **Discovery/search:** filter by strategy, geography, vintage, ticket-size fit against
  the LP's own stated range, GP verification status.
- **Comparison:** track record chart (fund IRR vs benchmark index) side-by-side available
  on each listing; MOIC/IRR/fee terms surfaced as structured fields, not just prose, so
  they're filterable and comparable across listings.
- **Communication:** per-fund message threads between LP and GP, gated so an LP must have
  a verified accreditation status before a thread opens — this is where deal-specific
  diligence Q&A happens instead of email.
- **Trust/safety:** org-level verification badge (Greenstone/Admin-reviewed), accreditation
  status shown on every profile, audit log on every state transition of an indication
  (who changed what, when) for dispute resolution.
- **Payment/fulfilment:** out of scope for in-platform money movement in v1 — the platform
  tracks the *commitment* and *subscription* lifecycle; actual capital calls/wiring happen
  through the fund's existing fund administrator, referenced but not processed on-platform
  (see Priorities below for why).
- **Disputes:** a declined or scaled-back indication carries a required GP note (see
  `IndicationOfInterest.notes` in the data model) so an LP always has a stated reason, and
  the audit log gives Compliance/Admin a full record if escalated.
- **Regulation:** DIFC data-protection framing throughout (Greenstone is Dubai-based);
  accreditation/KYC status is a first-class field on every org, not an afterthought; roles
  include a dedicated `COMPLIANCE` user type with read/audit access but no allocation
  authority, to separate deal-making from oversight.

## Priorities for an initial release

**In v1:** fund-vehicle listing + publish flow, discovery/filter, track-record comparison
view, messaging, indication submission with server-authoritative allocation (incl.
pro-rata scale-back), live subscription-progress updates, subscription-document handoff
(tracked, not generated), role-based access (LP/GP/Admin/Compliance).

**Explicitly deferred (and why):** in-platform capital movement / escrow (regulatory and
integration weight far exceeds what a v1 should carry — funds already have administrators
for this); automated KYC/AML provider integration (mocked as a status field in v1, real
integration is a vendor-selection exercise, not a frontend architecture problem); secondary
transfers of existing LP stakes (a related but materially different product — see the
"PE/VC secondaries" alternative category considered and set aside); multi-currency (assume
USD-denominated commitments in v1, most GCC institutional tickets are USD anyway).

**Assumptions made:** GPs and their fund vehicles are pre-vetted by Greenstone before
they can publish (the platform doesn't try to solve cold-start trust algorithmically in
v1 — a human verification step is cheaper and more credible for this asset class);
allocation decisions are pro-rata by default but a GP can override with a documented
reason (pure algorithmic allocation would be wrong for real fundraising, where GPs
legitimately prioritize strategic LPs).
