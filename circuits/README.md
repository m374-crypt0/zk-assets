# circuits — Where zero-knowledge magic operates

> **circuits** defines the eligibility rules as a zero-knowledge circuit. It
> allows a customer to prove compliance with an issuer's policy using only
> public inputs — no private data is ever disclosed.

<!--toc:start-->
- [circuits — Where zero-knowledge magic operates](#circuits-where-zero-knowledge-magic-operates)
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

| Input | Description | Supplied by |
|---|---|---|
| `policy.id` | Identifier of the policy being proven | customer |
| `policy.scope.id` | Scope identifier (e.g. *holding*) | customer |
| `policy.scope.parameters.valid_until` | Expiry timestamp of the policy | customer |
| `request.sender` | EVM address submitting the proof on-chain | `Prover.sol` (`msg.sender`) |
| `request.current_timestamp` | Block timestamp at proof submission | `Prover.sol` (`block.timestamp`) |
| `request.commitment` | Poseidon2 hash of private inputs + policy; stored on-chain by the issuer | customer |

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
