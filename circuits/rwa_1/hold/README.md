# rwa_1/hold — Eligibility circuit for `rwa_1` asset and `hold` policy scope

> This is one member of the [`circuits` workspace](../../README.md). It defines
> eligibility rules for the **`rwa_1`** asset under the **`hold`** policy scope.
> Additional circuits can be added to the workspace when the issuer introduces
> new assets or policy scopes — see the workspace README for instructions.

Package: **`zk_assets_rwa_1_hold_v1`**

---

> **circuits** defines the eligibility rules as a zero-knowledge circuit. It
> allows a customer to prove compliance with an issuer's policy using only
> public inputs — no private data is ever disclosed.

<!--toc:start-->
- [rwa_1/hold — Eligibility circuit for `rwa_1` asset and `hold` policy scope](#rwa1hold-eligibility-circuit-for-rwa1-asset-and-hold-policy-scope)
  - [Responsibilities](#responsibilities)
  - [Trust boundaries](#trust-boundaries)
  - [Circuit inputs](#circuit-inputs)
    - [Private inputs](#private-inputs)
    - [Public inputs](#public-inputs)
  - [Interactions in the entire *zk-assets* system](#interactions-in-the-entire-zk-assets-system)
    - [Flow](#flow)
  - [Final words](#final-words)
<!--toc:end-->

## Responsibilities

1. Define a sound, unambiguous logic for proving customer eligibility.
2. Ensure no private information is disclosed when verifying a proof.
3. Generate a Solidity verifier contract deployable by the contracts component.

## Trust boundaries

- **Circuit logic** — the circuit is the ground truth for what "eligible" means.
  Any update must go through governance; a changed circuit invalidates all
  existing proofs.
- **Generated Solidity verifier** — must not be regenerated or replaced without
  governance. It is tightly coupled to the circuit version in use.

## Circuit inputs

### Private inputs

| Input | Description |
|---|---|
| `customer_id` | Assigned by the issuer at registration; highly sensitive |
| `customer_secret` | A secret value chosen by the customer; never shared |
| `authorized_sender` | The EVM address the proof will be bound to |

### Public inputs

| Input | Accepted value | Description | Supplied by |
|---|---|---|---|
| `policy.id` | `0` (enforced) | Identifier of the policy being proven | customer |
| `policy.scope.id` | `0` (enforced) | Scope identifier for the `hold` scope | customer |
| `policy.scope.parameters.valid_until` | any `u64` | Expiry timestamp of the policy | customer |
| `request.sender` | `msg.sender` | EVM address submitting the proof on-chain | `Prover.sol` |
| `request.current_timestamp` | `block.timestamp` | Block timestamp at proof submission | `Prover.sol` |
| `request.commitment` | — | Poseidon2 hash of private inputs + policy; stored on-chain by the issuer | customer |

> `policy.id` and `policy.scope.id` are hard-constrained to `0` in the circuit.
> Proofs built with any other value will fail witness generation. These
> constraints are what tie this circuit to exactly one asset (`rwa_1`) and one
> scope (`hold`). A new asset or scope requires a dedicated circuit — see the
> [workspace README](../../README.md#adding-a-new-circuit).

> `sender` and `current_timestamp` are not part of the `Inputs` struct the
> customer submits to `Prover.sol`. The Prover injects them from the transaction
> context before forwarding to the Verifier. This prevents the customer from
> claiming an arbitrary sender or timestamp.

## Interactions in the entire *zk-assets* system

### Flow

```
    contracts            circuits                     customer
        │                    │                            │
        │   (1) compile to   │                            │
        │   ACIR bytecode    │                            │
        │                    │                            │
        │◀── (2) generate ───│                            │
        │    Solidity        │                            │
        │    verifier        │                            │
        │                    │                            │
        │                    │  (3) execute circuit with  │
        │                    │  private + public inputs   │
        │                    │  to produce witness ──────▶│
        │                    │                            │
        │                    │  (4) generate proof        │
        │                    │  from witness ────────────▶│
        │                    │                            │
        │◀──────────────────────────────(5) submit proof──│
        │                               on-chain          │
```

## Final words

**circuits** is the most critical component of *zk-assets*. Its logic determines
what "proven" means for the entire system. It must be clear, correct, and
governed with the same rigour as a smart contract.
