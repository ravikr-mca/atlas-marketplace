# System Architecture

Rendered, Greenstone-branded version: [`system-architecture.svg`](system-architecture.svg) (source of truth for the deck/PDF).

Production framing — the prototype (this repo) runs the frontend half of this standalone
against a mock API; everything right of the dashed line is the "how I'd build it for
Greenstone" answer, not code in this repo.

```mermaid
flowchart LR
    subgraph Client
        Browser["React SPA<br/>(this repo)"]
    end

    subgraph Edge["AWS — Edge & Delivery"]
        CF["CloudFront + S3<br/>static frontend"]
    end

    subgraph Compute["AWS — Compute"]
        API["Laravel API<br/>on ECS (Fargate)"]
        WS["WebSocket layer<br/>(Pusher-compatible)"]
    end

    subgraph Data["AWS — Data"]
        RDS[("RDS MySQL<br/>Multi-AZ")]
        Cache[("ElastiCache Redis<br/>sessions, rate limits,<br/>presence")]
        Search[("OpenSearch<br/>fund-vehicle search")]
        S3docs[("S3<br/>data-room documents")]
    end

    subgraph Sec["Security & Identity"]
        Entra["Entra ID (SSO)"]
        Guard["GuardDuty"]
    end

    subgraph Obs["Observability"]
        Sentry["Sentry"]
    end

    Browser -->|HTTPS, static assets| CF
    Browser -->|REST/JSON, HTTPS| API
    Browser <-->|WSS, live subscription %<br/>+ allocation notices| WS
    Browser -.->|frontend errors/perf| Sentry

    API --> RDS
    API --> Cache
    API --> Search
    API --> S3docs
    API --> WS
    API -->|token verification| Entra

    Guard -.->|threat detection| Compute
    Guard -.->|threat detection| Data
```

## Why these choices

- **ECS Fargate, not a monolith EC2 box.** Matches the JD's AWS surface directly (RDS,
  S3, ElastiCache, OpenSearch, GuardDuty all named explicitly) and keeps the API
  horizontally scalable ahead of a fundraise deadline spike (many LPs submitting near a
  fund's close date), without managing servers.
- **ElastiCache does three jobs, not one.** Session storage, rate-limiting the
  Indication-of-Interest endpoint (a required security control — see Technical Approach),
  and WebSocket presence/pub-sub backing — one managed service, three related
  responsibilities, rather than three separate pieces of infrastructure.
- **OpenSearch is scoped to fund-vehicle discovery only**, not a general-purpose search
  layer — the prototype's client-side filter is the honest v1 stand-in (see the deferred
  list in `proposal/concept.md`); OpenSearch is the documented upgrade path once listing
  volume outgrows client-side filtering.
- **GuardDuty wraps the whole AWS account**, not a specific service — it's a detection
  layer, not something the application calls.
