# customer — Prove compliance without disclosure

> The **customer** is a registered user who can prove eligibility regarding an
> issuer's policy for a specific RWA — without disclosing any personal
> information, on-chain or off-chain.

<!--toc:start-->
- [customer — Prove compliance without disclosure](#customer-prove-compliance-without-disclosure)
  - [Responsibilities](#responsibilities)
  - [Trust boundaries](#trust-boundaries)
  - [Interactions in the entire *zk-assets* system](#interactions-in-the-entire-zk-assets-system)
    - [Flow](#flow)
  - [A word about the customer](#a-word-about-the-customer)
<!--toc:end-->

## Responsibilities

1. Create a set of inputs from the issuer's policy properties combined with
   secret values known only to the customer, and keep them safe.
2. Compute a **commitment** from those inputs.
3. Send the commitment to the issuer for on-chain storage, conditional on
   eligibility.
4. Generate a **ZKP** locally, bound to a chosen EVM address, and verify it
   locally before submitting.
5. Submit the ZKP on-chain to prove compliance without disclosing any personal
   information.

## Trust boundaries

The customer component is essentially **trustless** — all sensitive operations
happen locally and no private data leaves the machine. The only external trust
assumptions are:

- The **issuer** is assumed to have correctly evaluated eligibility.
- The **circuit** correctly enforces the intended rules.

The customer's identity is not proven on-chain; this is intentional and
explicit in the system design.

## Interactions in the entire *zk-assets* system

### Flow

```
  Customer (local)          Issuer API              Blockchain
       │                         │                        │
  (3) build attestation locally  │                        │
      customer_id + secret +     │                        │
      EVM address + policy       │                        │
      properties                 │                        │
       │                         │                        │
  (4) compute commitment         │                        │
      (Poseidon2 hash)           │                        │
       │                         │                        │
  (5) send commitment            │                        │
  ──────────────────────────────▶│                        │
       │                         │  (6) store commitment  │
       │                         │  if customer is        │
       │                         │  eligible              │
       │                         │ ──────────────────────▶│
       │                         │                        │
  (7) generate ZK proof locally  │                        │
      using circuit bytecode     │                        │
      (proof never leaves device)│                        │
       │                         │                        │
  (8) submit proof + public inputs                        │
  ────────────────────────────────────────────────────── ▶│
       │                         │                        │
  (9) eligibility confirmed      │                        │
  ◀───────────────────────────────────────────────────────│
```

## A word about the customer

All work involving private data — building the attestation, computing the
commitment, generating the proof — happens **locally** and **never leaves the
customer's machine**.

After the commitment is recorded on-chain (step 6), the issuer is no longer
involved. The customer can generate and submit new proofs at any time,
autonomously.

> Compliance without disclosure.
