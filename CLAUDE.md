# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zk-assets** is a zero-knowledge eligibility proof system for Real-World Asset
(RWA) protocols. It allows users to prove on-chain compliance with off-chain
rules without revealing identity, jurisdiction, or private compliance data. The
system uses Noir circuits with a Barretenberg (UltraHonk) backend, and Solidity
smart contracts for on-chain verification.

## Repository Structure

Four independent sub-components, each with their own `Makefile`:

- **`circuits/`** — Noir ZK circuit (`rwa_eligibility_v1`). Compiled to ACIR
  bytecode; also generates a Solidity verifier contract.
- **`contracts/`** — Foundry project with two core contracts:
  `CommitmentStore.sol` (issuer stores customer commitments) and `Prover.sol`
  (customer submits ZK proof on-chain). Uses OpenZeppelin and the generated
  circuit verifier.
- **`customer/`** — TypeScript/Bun local scripts for commitment generation,
  proof generation (via `@noir-lang/noir_js` + `@aztec/bb.js`), and on-chain
  proof submission (via `viem`).
- **`issuer/`** — TypeScript/Bun HTTP API (`hono` + `zod-openapi`) simulating a
  RWA provider. Manages prospects, customers, policies, and records commitments
  on-chain.

## Build System

The root `Makefile` uses [rake](https://github.com/m374-crypt0/rake): commands
are forwarded to sub-component Makefiles.

```
make <component> <target>
# e.g.:
make circuits compile
make contracts test
make issuer run
make customer test
```

## Commands per Component

### circuits

```bash
make circuits compile                    # nargo compile (also cleans first)
make circuits generate_solidity_verifier # compile + generate Verifier.sol into contracts/
make circuits test                       # nargo test --show-output
make circuits watch                      # watch mode
```

### contracts

```bash
make contracts build                     # forge build
make contracts test                      # forge test --gas-report
make contracts testv                     # forge test -vvv (verbose)
make contracts watch                     # forge test -w
make contracts watchv                    # forge test -w -vvv
make contracts coverage                  # forge coverage
make contracts local_deploy              # run tests + deploy via LocalDeploy.s.sol on local anvil
```

Requires `contracts/.env` (copy from `contracts/.env.sample`). Anvil is started automatically for local deploy/run targets.

### issuer

```bash
make issuer run        # build + bun run src/
make issuer dev        # build + bun run dev (hot reload)
make issuer test       # build + bun test --test-name-pattern='<unit>'
make issuer watch      # build + bun --watch test
```

### customer

```bash
make customer test     # bun test --test-name-pattern='<unit>'
make customer watch    # bun --watch test
```

To run integration test suites, use *rake* capabilities

```bash
make ./run/integration/tests/between/issuer/and/local/ blockchain
make ./run/integration/tests/between/customer/and/local/ blockchain
```

## Architecture & Data Flow

### Circuit (`circuits/src/main.nr`)

The Noir circuit proves three things:

1. `request.sender == private_inputs.authorized_sender` — caller is the
   authorized address
2. `request.current_timestamp <= policy.scope.parameters.valid_until` — within
   validity window
3. `request.commitment == poseidon2Hash(customer_id, customer_secret,
   authorized_sender, policy.id, policy.scope.id, valid_until)` — commitment
   matches private inputs

**Private inputs**: `customer_id`, `customer_secret`, `authorized_sender`
**Public inputs**: `policy` (id, scope.id, scope.parameters.valid_until),
               `request` (sender, current_timestamp, commitment)

### Commitment Hash

Poseidon2 hash of 6 fields: `[customer_id, customer_secret, authorized_sender,
policy.id, policy.scope.id, valid_until]`. The same hash is computed in
TypeScript (`customer/src/index.ts`) using `@zkpassport/poseidon2`.

### On-Chain Contracts

- `CommitmentStore`: Ownable; issuer calls `commit(uint256)` /
                   `revoke(uint256)`. Validates against prime field order.
- `Prover`: Receives an `Inputs` struct (`policyId`, `policyScopeId`,
          `policyParameters`, `commitment`) from the customer. Checks that
          `commitment` exists in `CommitmentStore`, then builds the 5-element
          verifier input array — injecting `msg.sender` at index 3 and
          `commitment` at index 4 — before calling `IVerifier.verify()`.

### Public inputs ordering (critical for `Prover.sol`)

Index 0: `policy.id`, 1: `policy.scope.id`, 2: `valid_until`,
3: `msg.sender` (injected by Prover), 4: `commitment`

### Issuer API (port 3000)

Routes: `/prospects`, `/policies`, `/customers`, `/issuer`
Swagger UI at `/ui`, OpenAPI spec at `/doc`
In-memory repositories (`inMemoryCustomerRepository.ts`, `inMemoryPolicyRepository.ts`)

## Key Technical Notes

- **Solidity**: `0.8.33`, EVM version `osaka`, optimizer runs set to exactly
  `112` (max that keeps UltraHonk verifier under EIP-170 bytecode size limit).
- **Foundry remappings**: `@circuits/target/` → `../circuits/target/` (verifier
  artifact from circuit compilation).
- **Bun** is used as the runtime and test runner for both `customer` and `issuer`.
- **Integration tests** live in `run/integration/tests/between/` (between
  customer and issuer).
- Unit tests are tagged `<unit>` in test name patterns; the default `make test`
  targets only unit tests.
