# Data Model — Entity Relationship Diagram

Source of truth for these shapes is [`src/types/entities.ts`](../../src/types/entities.ts)
— this diagram is generated from that file, not the other way round, so the two never
drift apart during the build.

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ TRACK_RECORD_ENTRY : "has prior funds (GP only)"
    ORGANIZATION ||--o{ FUND_VEHICLE : "raises (GP only)"
    ORGANIZATION ||--o{ INDICATION_OF_INTEREST : "submits (LP only)"
    ORGANIZATION }o--o{ MESSAGE_THREAD : "participates in"

    FUND_VEHICLE ||--o{ INDICATION_OF_INTEREST : receives
    FUND_VEHICLE ||--o{ DATA_ROOM_DOCUMENT : contains
    FUND_VEHICLE ||--o{ MESSAGE_THREAD : "scopes"

    MESSAGE_THREAD ||--o{ MESSAGE : contains
    USER ||--o{ MESSAGE : sends
    USER ||--o{ NOTIFICATION : receives

    ORGANIZATION {
        string id PK
        string kind "FUND_MANAGER | INVESTOR"
        string name
        string hqLocation
        string accreditation "VERIFIED | PENDING | UNVERIFIED"
        string investorTier "nullable, LP only"
        number aum "nullable, GP only"
    }

    USER {
        string id PK
        string organizationId FK
        string role "LP | GP | ADMIN | COMPLIANCE"
        string name
        boolean verified
    }

    TRACK_RECORD_ENTRY {
        string id PK
        string gpOrganizationId FK
        string fundName
        number vintage
        number netIrr
        number moic
        string status "REALIZED | ACTIVE"
    }

    FUND_VEHICLE {
        string id PK
        string gpOrganizationId FK
        string name
        string strategy
        number vintage
        number targetSizeUsd
        number hardCapUsd
        number committedUsd
        number minimumCommitmentUsd
        string status "DRAFT|OPEN|OVERSUBSCRIBED|ALLOCATING|CLOSED|WITHDRAWN"
        string closeDate
    }

    INDICATION_OF_INTEREST {
        string id PK
        string idempotencyKey UK
        string fundVehicleId FK
        string lpOrganizationId FK
        number requestedAmountUsd
        number allocatedAmountUsd "nullable until reviewed"
        string status "see state-diagram.md"
        string submittedAt
    }

    DATA_ROOM_DOCUMENT {
        string id PK
        string fundVehicleId FK
        string title
        string kind "PPM|TRACK_RECORD|LPA|SUBSCRIPTION_AGREEMENT|OTHER"
        string fileUrl
    }

    MESSAGE_THREAD {
        string id PK
        string fundVehicleId FK
        string subject
    }

    MESSAGE {
        string id PK
        string threadId FK
        string senderUserId FK
        string body
        string sentAt
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string kind "SUBSCRIPTION_PROGRESS|ALLOCATION|MESSAGE|DEADLINE"
        boolean read
    }
```

## Notes on the shape of this model

- **`IndicationOfInterest.idempotencyKey` is unique, not `id`.** The client generates it
  once per submission attempt; `submitIndication` (see `src/mock/api.ts`) looks it up
  before creating anything, so a network retry after a dropped response can never create
  a duplicate indication. This is the concrete mechanism behind the brief's "concurrent
  bids and race conditions" requirement.
- **`FundVehicle.committedUsd` is a running total owned by the server**, not derived
  client-side from summing indications — the frontend never computes subscription
  percentage from its own cache, it always reads the authoritative field. See
  `state-diagram.md` for why this matters under concurrent submissions.
- **`MessageThread` is scoped to a `FundVehicle`, not a pair of users.** Diligence
  conversations belong to the deal, not the individuals — this also makes it trivial to
  hand a thread to a colleague at either org without losing context, and gives Compliance
  a single place to review all communication about a given raise.
- **`TrackRecordEntry` belongs to the `Organization` (GP firm), not a `FundVehicle`.** A
  firm's prior funds are evidence for *every* current raise, not just one — track record
  is a firm-level trust signal, and the UI reads it off the GP's org profile.
