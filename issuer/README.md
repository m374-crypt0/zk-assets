# issuer — The organization managing Real World Assets

> The **issuer** represents the RWA organization: it evaluates customer
> eligibility, exposes policies, and records eligibility commitments on-chain.
> It is the only component that handles private customer data.

<!--toc:start-->
- [issuer — The organization managing Real World Assets](#issuer-the-organization-managing-real-world-assets)
  - [Responsibilities](#responsibilities)
  - [Trust boundaries](#trust-boundaries)
  - [Interactions in the entire *zk-assets* system](#interactions-in-the-entire-zk-assets-system)
    - [Flow](#flow)
  - [A word about the issuer platform](#a-word-about-the-issuer-platform)
<!--toc:end-->

## Responsibilities

1. Expose a registration endpoint for prospects (KYC intake).
2. Expose all supported policies and their properties.
3. Handle eligibility attestation requests from customers — recording
   commitments on-chain when the customer is eligible, without storing or
   publishing private customer data.

## Trust boundaries

The issuer is the **sole trust boundary** in the *zk-assets* system where private
data is handled. It is assumed trustworthy for:

- Managing RWA access in compliance with applicable laws, regulations, and
  jurisdictional requirements.
- Protecting customer private information.
- Correctly evaluating customer eligibility before recording any commitment
  on-chain.

## Interactions in the entire *zk-assets* system

### Flow

```
  Prospect / Customer          Issuer API              Blockchain
         │                         │                        │
  (1) register with KYC data       │                        │
  ───────────────────────────────▶ │                        │
         │                         │                        │
  (2) receive customer_id          │                        │
  ◀─────────────────────────────── │                        │
         │                         │                        │
  (3) request policy list          │                        │
  ───────────────────────────────▶ │                        │
         │                         │                        │
  (4) receive policy identifiers   │                        │
  ◀─────────────────────────────── │                        │
         │                         │                        │
  (5) request policy properties    │                        │
  ───────────────────────────────▶ │                        │
         │                         │                        │
  (6) receive policy properties    │                        │
  ◀─────────────────────────────── │                        │
         │                         │                        │
  (7) submit eligibility record    │                        │
      (commitment + customer_id    │                        │
       + policy properties)        │                        │
  ───────────────────────────────▶ │                        │
         │                         │  (8) if eligible,      │
         │                         │  store commitment      │
         │                         │ ──────────────────────▶│
         │                         │                        │
         │                         │  (9) revoke commitment │
         │                         │  (when needed)         │
         │                         │ ──────────────────────▶│
```

## A word about the issuer platform

The issuer API is only useful within its [trust boundaries](#trust-boundaries).
Once a customer's commitment is recorded on-chain, the issuer is no longer
required for the customer to generate and submit proofs. Its role is complete.
