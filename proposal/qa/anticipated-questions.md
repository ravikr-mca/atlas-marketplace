# Anticipated technical Q&A

25 minutes of discussion after the presentation, panel: Cyrus Alavi (Head of Technology),
Najnene (VP Technology). Mapped to the brief's own assessment criteria and to the places
in the proposal most likely to draw a follow-up. Each entry: the likely question, the
sharpest honest answer, and where to point in the materials if pressed further.

## Product thinking / judgement

**"Why this category, specifically? Isn't it presumptuous to model your own business?"**
Deliberately answer this head-on rather than waiting for it: the point isn't to describe
Greenstone's existing platform, it's to demonstrate understanding of the *category* of
problem — two-sided cold-start, real valuation questions, oversubscription and
allocation — that Greenstone's placement team solves manually. A safer, more generic
category (collectables, physical goods) would have been *less* work but a *weaker*
signal of product thinking for this specific role. Name the alternative considered
(PE/VC secondaries) and why it was set aside (materially different product, deferred
list in the proposal).

**"What would you cut if you had two weeks instead of the runway you had?"**
Have a real, ordered answer, not "everything except the core": keep listing + discovery
+ IOI submission with the state machine (that's the technical proof); cut the Admin/
Compliance dashboard (nice-to-have oversight, not core to the buyer/seller loop), cut
Tiptap in favor of plain markdown rendering (real editing isn't demonstrated anyway, a
static render would've been "enough" — say so as a trade-off, not a gap you missed),
keep the mobile responsive pass (skipping it once already cost a rework cycle in this
build — worth saying as evidence of judgement, not just claiming it).

**"Who verifies GPs and LPs in v1? Isn't 'a human reviews it' a cop-out?"**
No — it's the considered choice, and the reasoning is in the proposal: cold-start trust
for institutional-grade capital placement is not a problem an algorithm should solve in
v1. A human review step is cheaper to build, more credible to LPs moving $5M+ tickets,
and matches how Greenstone's own placement business actually establishes trust today.
The deferred list is explicit that this isn't overlooked, it's sequenced.

## Frontend architecture

**"Why Redux *and* TanStack Query — why not just one?"**
The dividing line is mechanical: if it came from the API, it's in Query; if it's purely
client-side (current viewer role, an open dialog), it's in Redux. Concretely: Redux never
caches anything the API returned, so replacing the mock API with a real Laravel client
touches zero Redux code. RTK Query would collapse this into one library but blur that
boundary — worth naming as the alternative considered, and why the explicit split reads
better in a codebase multiple engineers will touch.

**"Walk me through what happens when the network drops mid-submission."**
This is the idempotency-key answer: the client generates a fresh key per user action
(not per attempt), so a retry of the *same* attempt reuses the same key; the server looks
up that key before creating anything and returns the existing indication if found — no
duplicate, no double-allocation. Point to `src/mock/api.ts` and the "is idempotent" test
in `api.test.ts` — this isn't just described, it's implemented and tested.

**"Why MUI and not something like shadcn/Tailwind, which is what your other projects
use?"** Because Greenstone's actual stack is MUI, and the point of the prototype is to
show fluency in *their* system, not port an unrelated component library. Say this
plainly — it signals the judgement to match the team's tools over personal preference.

## Data & transaction design

**"Two LPs submit at the same instant near a fund's cap — walk me through exactly what
happens, mechanically, at the database level."**
Be honest about the boundary between what's demonstrated and what's described: the
prototype's mock API is single-threaded JS and can't reproduce a true race condition, so
the *policy* (server-authoritative capacity check, pro-rata scale-back) is real, tested
code, while the *production concurrency mechanism* (row-level lock via `SELECT ... FOR
UPDATE`, or an optimistic version column with retry-on-conflict) is documented, not
built. Naming this distinction unprompted is a stronger answer than hoping it doesn't
come up.

**"Why pro-rata and not first-come-first-served? Isn't pro-rata more complex for no
reason?"** First-come-first-served is simpler to build but wrong for the domain: real GPs
scale back proportionally (or by strategic priority, hence the override) because
fundraising relationships matter beyond submission timestamps. This is a case where the
"harder" technical choice is the domain-correct one — good material for the
"communication to non-technical stakeholders" criterion too.

**"What's in the audit log, exactly, and who can see it?"**
Every `IndicationOfInterest` state transition — who, what from/to state, when, and (for
declines) the required reason. `COMPLIANCE` role has read access, no allocation
authority — the separation of deal-making from oversight is structural, not a
permissions checkbox.

## Security & quality

**"Where's the biggest security gap in what you built, honestly?"**
Answer honestly rather than deflecting: the prototype has no real authentication at
all — role-switching is a Redux dropdown for demo purposes. That's fine for a prototype
whose job is to demonstrate frontend architecture, but say plainly that Entra ID SSO,
real RBAC enforcement, and encrypted KYC storage are all *designed and documented*, not
built, and that's a legitimate scope line for a 5-day take-home rather than an oversight.

**"What's your testing philosophy here — why isn't there more coverage?"**
Coverage percentage was explicitly not the goal; test effort went where a bug would
actually hurt — the allocation/state-machine logic, which has 7 passing tests covering
full allocation, partial/oversubscription, idempotency, illegal transitions, and capacity
release on withdrawal. Say this was a deliberate scoping decision, and name what a real
v1 would add next (component tests for conditional UI, one Playwright E2E over the
submission flow — both already noted in the proposal's Performance section).

## Delivery

**"Why Vercel for the demo instead of the AWS setup you describe?"**
Purely pragmatic — Vercel gives a zero-infra, instant public link appropriate for a
five-day take-home; it is explicitly *not* the production recommendation, which is
S3/CloudFront + ECS in the proposal. Naming that gap unprompted, rather than letting them
find it, is the stronger move.

## If asked something genuinely not covered

Say so directly — "I hadn't considered that specifically, here's how I'd think about
it" — and reason from the same principles used throughout: server-authoritative state,
explicit trade-offs, defer what doesn't need to be in v1. That's a better answer than
guessing confidently.
