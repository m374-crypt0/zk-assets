# zk-assets — Prove you are eligible to any RWA policy. Privately

> A zero-knowledge eligibility proof system for Real-World Asset (RWA) protocols.

<!--toc:start-->
- [zk-assets — Prove you can hold any RWA. Privately](#zk-assets-prove-you-can-hold-any-rwa-privately)
  - [The compliance problem](#the-compliance-problem)
    - [The challenge](#the-challenge)
    - [The insight](#the-insight)
    - [Risks alleviated](#risks-alleviated)
    - [What is proven — and what is not](#what-is-proven-and-what-is-not)
    - [Trust model](#trust-model)
  - [Architecture overview](#architecture-overview)
    - [Components](#components)
    - [Data flow](#data-flow)
    - [Technology choices](#technology-choices)
    - [Extensibility](#extensibility)
  - [Running the demo](#running-the-demo)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Step 1 — Compile the circuit and generate the Solidity verifier](#step-1-compile-the-circuit-and-generate-the-solidity-verifier)
    - [Step 2 — Run contract tests](#step-2-run-contract-tests)
    - [Step 3 — Run the issuer integration tests](#step-3-run-the-issuer-integration-tests)
    - [Step 4 — Run the customer integration test suite](#step-4-run-the-customer-integration-test-suite)
<!--toc:end-->

---

## The compliance problem

### The challenge

Companies that tokenize real-world assets — real estate, bonds, commodities,
private equity — must enforce rules about who is allowed to hold them. These
rules come from regulators: investor accreditation requirements, jurisdictional
restrictions, eligibility windows. Enforcing them requires knowing something
private about each customer.

The naive approach puts compliance data on the blockchain. This is unacceptable:

- **Privacy violation** — wallet addresses are public; linking them to identities,
  jurisdictions, or accreditation status creates an irreversible public record.
- **Regulatory exposure** — publishing personal compliance data may itself violate
  data protection laws in many jurisdictions.
- **Irreversibility** — once disclosed on-chain, private information cannot be
  retracted.
- **Gas cost** — storing rich compliance records on-chain is expensive.

The core challenge is:

> How to **prove** eligibility on-chain **without revealing** why the user is
> eligible.

### The insight

Mathematical proofs can confirm a fact without revealing why it is true.
*zk-assets* uses this to let a customer prove they are eligible to hold an asset
without disclosing any of the underlying reasons. A proof is generated entirely
on the customer's device. Only a single cryptographic value — a **commitment** —
ever reaches the blockchain, recorded there by the issuer.

### Risks alleviated

| Risk | Without zk-assets | With zk-assets |
|---|---|---|
| Identity disclosure | KYC data linked to wallet on-chain | No personal data on-chain, ever |
| Regulatory exposure | Publishing compliance data may violate GDPR / local law | Nothing sensitive published |
| Irreversible data leak | Immutable blockchain records | Commitment reveals nothing; can be revoked |
| Gas cost of compliance | Storing rich records per customer | One `uint256` per customer, per policy |
| Ongoing issuer dependency | Issuer must be online to authorize each action | Issuer needed only once; proof is reusable |

### What is proven — and what is not

The zero-knowledge proof guarantees:

- The caller is the **wallet address** bound to the proof at generation time.
- The proof satisfies a specific **policy** (including its validity window).
- The **commitment** on-chain was computed from the caller's private data.

The following are explicitly **out of scope**:

- The customer's identity or jurisdiction.
- The correctness of the off-chain KYC process.
- The legal authority of the issuer.
- Real-time revocation at scale (manual revocation and policy expiry are supported).

### Trust model

*zk-assets* does not eliminate trust — it makes it explicit and minimal:

- **Issuer** is trusted to correctly evaluate eligibility before recording
  commitments. This is the only trust boundary that touches private data.
- **Circuit** defines the eligibility rules and must be governed before any
  update. An incorrect circuit invalidates the entire proving system.
- **Verifier contract** is generated from the circuit and must not be replaced
  without governance.
- **Policy governance** — policies and their parameters are managed by the issuer.

---

## Architecture overview

> This section is aimed at technical decision-makers. Implementation details are
> in the component READMEs.

### Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         zk-assets                                │
│                                                                  │
│  ┌──────────┐  generates  ┌────────────┐                         │
│  │ circuits │─────────────▶ contracts  │                         │
│  │          │             │            │                         │
│  │  Noir ZK │             │ Solidity   │                         │
│  │  circuit │             │ verifier + │                         │
│  └──────────┘             │ prover +   │                         │
│                           │ commitment │                         │
│  ┌──────────┐             │ store      │                         │
│  │ customer │─────────────▶            │                         │
│  │          │  submits    └────────────┘                         │
│  │  TS/Bun  │  proof                                             │
│  │  scripts │                                                    │
│  └──────────┘                                                    │
│       ▲                                                          │
│       │ eligibility + policy                                     │
│  ┌────┴─────┐                                                    │
│  │  issuer  │─────────────▶ blockchain (commitment store)        │
│  │          │  stores                                            │
│  │  TS/Bun  │  commitments                                       │
│  │  API     │                                                    │
│  └──────────┘                                                    │
└──────────────────────────────────────────────────────────────────┘
```

| Component | Role |
|---|---|
| [`circuits/`](circuits/README.md) | Noir ZK circuit — defines eligibility rules; compiled to bytecode for local proof generation; generates the Solidity verifier |
| [`contracts/`](contracts/README.md) | Three Solidity contracts: `CommitmentStore` (issuer writes commitments), `Prover` (verifies proofs on-chain), and the generated ZK `Verifier` |
| [`customer/`](customer/README.md) | Local TypeScript scripts — computes commitments, generates ZK proofs using Barretenberg, submits proofs on-chain |
| [`issuer/`](issuer/README.md) | REST API — manages prospect registration, exposes policies, records customer commitments on-chain |

### Data flow

```
  Customer (local)                Issuer API               Blockchain
       │                              │                         │
       │  (1) register with KYC data  │                         │
       │─────────────────────────────▶│                         │
       │                              │                         │
       │  (2) customer_id + policies  │                         │
       │◀─────────────────────────────│                         │
       │                              │                         │
       │  (3) build attestation locally (never leaves device)   │
       │      customer_id + secret + EVM address + policy       │
       │                              │                         │
       │  (4) commitment = Poseidon2(attestation)               │
       │                              │                         │
       │  (5) send commitment         │                         │
       │─────────────────────────────▶│                         │
       │                              │  (6) store commitment   │
       │                              │────────────────────────▶│
       │                              │    CommitmentStore      │
       │                              │                         │
       │  (7) generate ZK proof locally — entirely on device    │
       │                                                        │
       │  (8) submit proof + public inputs                      │
       │───────────────────────────────────────────────────────▶│
       │                              │    Prover.prove()       │
       │                              │                         │
       │  (9) eligibility confirmed or denied                   │
       │◀───────────────────────────────────────────────────────│
```

After step (6), the **issuer is no longer needed**. Steps (7)–(9) are fully
autonomous: proof generation is local, and verification happens on-chain.

### Technology choices

| Layer | Technology | Rationale |
|---|---|---|
| ZK circuit | Noir | Readable syntax; native UltraHonk backend; strong Solidity tooling |
| Proving backend | Barretenberg (UltraHonk) | Verifier generated from the same toolchain used for proving — avoids proof mismatch |
| Smart contracts | Solidity 0.8.33 / Foundry | Optimizer tuned to exactly 112 runs — maximum before the UltraHonk verifier exceeds the EIP-170 bytecode size limit |
| Off-chain runtime | TypeScript / Bun | Single runtime for both API server and local customer scripts |
| Commitment hash | Poseidon2 | ZK-friendly; identical implementation in the circuit (Noir) and client scripts (TypeScript) |

### Extensibility

The system is asset-agnostic. Policies carry any parameters the issuer defines.
Multiple `Prover`/`Verifier` pairs can be deployed — one per policy — without
modifying the circuit. Revocation is built in: each policy carries a validity
window, and the issuer can manually revoke any commitment.

---

## Running the demo

### Prerequisites

- [`nargo`](https://noir-lang.org/docs/getting_started/installation/) — Noir
  circuit compiler (`>=1.0.0`, matching `circuits/Nargo.toml`)
- [`bun`](https://bun.sh) — TypeScript runtime (`>=1.x`)
- [`foundry`](https://getfoundry.sh) — Solidity toolchain (`forge` + `anvil`)

### Setup

```bash
# Initialise git submodules (OpenZeppelin, forge-std)
git submodule update --init --recursive

# Create the contracts environment file
cd contracts && cp .env.sample .env
```

Edit `contracts/.env` and set `MAINNET_URL` (an Ethereum RPC endpoint) and
`MAINNET_FORK_BLOCK` (a recent stable block number). All other values are
pre-filled for local development.

### Step 1 — Compile the circuit and generate the Solidity verifier

```bash
make circuits generate_solidity_verifier
```

This compiles the Noir circuit to ACIR bytecode and writes
`contracts/src/Verifier.sol` using the Barretenberg backend. Using the same
toolchain for both verifier generation and proving is critical — it ensures the
on-chain verifier accepts proofs generated locally.

### Step 2 — Run contract tests

```bash
make contracts test        # unit tests with gas report
make contracts testv       # verbose output
make contracts coverage    # coverage report
```

Tests run against a forked mainnet. Foundry launches and manages Anvil
automatically.

### Step 3 — Run the issuer integration tests

```bash
make ./run/integration/tests/between/issuer/and/local/ blockchain
```

This spins up a local Anvil blockchain, deploys all contracts, and runs the
issuer integration suite. It exercises:

- Prospect registration
- Policy listing and property queries
- On-chain commitment recording
- Commitment revocation

### Step 4 — Run the customer integration test suite

```bash
make ./run/integration/tests/between/customer/and/local/ blockchain
```

This runs the complete eligibility proof cycle:

1. Local Anvil blockchain is started and contracts are deployed.
2. The issuer API starts in the background.
3. A customer registers, retrieves policy data, builds a commitment locally,
   and sends it to the issuer for on-chain storage.
4. The customer generates a **real ZK proof** locally using Barretenberg.
5. The proof is submitted on-chain and verified by the `Prover` contract.
6. Eligibility is confirmed — with zero private data disclosed.
