# zk-assets — KYC once, prove everywhere

> Enabling institutions to trade tokenized assets without exposing investor
> identities or positions.

---

## The story

A European family office wants to subscribe to a tokenized private equity fund
on-chain. The fund is regulated: only accredited investors can hold it. The
fund manager needs proof. The family office's compliance officer needs to
provide it.

Here is the problem: **on a public blockchain, proof means disclosure.**

If the fund manager's smart contract checks investor status on-chain, one of
two things happens:

1. **The investor's accreditation data is published.** Wallet address, net
   worth tier, jurisdiction — permanently visible, immutable, indexed by every
   data aggregator on the internet.
2. **The fund relies on a centralized allow-list.** An oracle or admin wallet
   decides who can trade. The "on-chain" compliance is a fiction; the real
   control is in one database, probably in a jurisdiction you cannot audit.

Neither is acceptable to institutions. Neither is legal in most jurisdictions.
And neither scales to the $30 trillion in real-world assets that tokenization
is supposed to unlock.

This is the problem *zk-assets* solves.

---

## What is at risk without this approach

| If you publish compliance data on-chain | If you rely on a centralized oracle |
|---|---|
| GDPR / data protection violation | Single point of failure for all trades |
| Irreversible identity disclosure | Admin key = protocol kill switch |
| Wallet-to-person correlation for every trade | Offline oracle = frozen assets |
| Regulatory liability for the issuer | Counterparty must trust your database |

The compliance data that regulators require is precisely the data that
blockchain transparency makes toxic to store on-chain. The industry has known
this for years. Most projects patch it with a multisig allow-list and call it
"compliant." It is not.

---

## The insight

You do not need to know *why* someone is eligible. You only need to know
*that* they are.

Zero-knowledge proofs make this distinction into code. *zk-assets* lets a
fund manager certify an investor once, off-chain, using their existing KYC
process. The investor's wallet then holds a cryptographic commitment — a
single number — that proves the certification happened, without revealing
anything about the investor.

When the investor wants to hold the tokenized asset, they generate a proof
locally on their own device. The proof says: *I am the wallet that holds
the commitment, the commitment was issued for this policy, and the policy
is still valid.* Nothing else. The blockchain verifies the math and grants
access.

**The issuer is involved once. After that, the investor is self-sovereign.**

---

## The concrete use case: tokenized private equity

**Rule:** Only accredited investors can hold shares of `FUND-A`.

**Without zk-assets:**

```
Fund manager → uploads KYC tier to allow-list contract
Investor wallet → checked against list on every transfer
On-chain: wallet address + accreditation tier = public forever
```

**With zk-assets:**

```
Fund manager → runs existing KYC → issues commitment (one uint256 on-chain)
Investor wallet → generates proof locally → submits to Prover contract
On-chain: math result (valid/invalid) = nothing about the investor revealed
```

The commitment is a Poseidon2 hash of six values: customer identifier, a
secret only the investor knows, their wallet address, the policy, the policy
scope, and a validity window. It reveals nothing. It can be revoked. It
expires automatically.

The fund manager never touches the investor's wallet again.

---

## What the system does — in plain terms

1. **Investor completes KYC** with the fund manager (off-chain, as today).
2. **Fund manager issues a commitment** — one number stored on a smart contract.
3. **Investor generates a proof** on their own device — proves they hold the
   commitment for this policy, without revealing the underlying data.
4. **Smart contract verifies the proof** — grants or denies access.

That is the entire flow. No oracle. No admin key. No personal data on-chain.

The proof is reusable for any asset that uses the same policy.

**KYC once, prove everywhere.**

---

## Why this matters now

The RWA tokenization market is moving from pilots to production. BlackRock,
Franklin Templeton, Apollo — they are all live. But they are all running on
allow-lists. The compliance layer is a centralized patch on a decentralized
system.

Regulators are starting to notice. MiCA in Europe and the SEC's evolving
position on tokenized securities both require that compliance mechanisms
respect data protection law. Publishing investor status on-chain does not.

*zk-assets* is the layer that makes on-chain RWA compliance legally
defensible, technically decentralized, and scalable across asset classes.

---

## Institutional signal

A senior technology executive at a Swiss-based financial services group reached
out directly after learning about *zk-assets*. The interest was unsolicited:
the compliance problem *zk-assets* solves is one they recognize from their own
operations and cannot find addressed in existing tooling.

This is more meaningful than a market report. A practitioner inside a regulated
financial institution looked at the problem, found the project, and made contact
— without being asked. That is the definition of product-market fit at the
infrastructure layer.

---

## Technical proof points (for the jury)

This is a working system, not a whitepaper.

- **Noir ZK circuit** — defines the eligibility rules; compiled to ACIR
  bytecode and verified on-chain using UltraHonk.
- **Solidity contracts** — `CommitmentStore` (issuer stores one `uint256` per
  customer) and `Prover` (customer submits proof; contract injects `msg.sender`
  to bind proof to wallet).
- **TypeScript client** — proof generation runs entirely on the investor's
  device using Barretenberg. Nothing private leaves the device.
- **Full integration test suite** — real ZK proof generated locally, submitted
  on-chain, verified. Green CI on every commit.
- **No trusted setup** — UltraHonk is a transparent proving system.

---

## Positioning

| Frame | Description |
|---|---|
| Tagline | KYC once, prove everywhere. |
| One sentence | *zk-assets* enables institutions to trade tokenized assets without exposing investor identities or positions. |
| One paragraph | Real-world asset protocols must enforce compliance on-chain. Publishing compliance data violates privacy law. Centralized allow-lists defeat the purpose of decentralization. *zk-assets* uses zero-knowledge proofs to let fund managers certify investors once, and let investors prove eligibility to any asset without revealing who they are or why they qualify. |
| Secret track angle | The technology is novel but the problem is regulatory and institutional. This is infrastructure for the next phase of RWA — when pilots become regulated products and allow-lists are no longer acceptable to legal teams. |

---

## What would change in the codebase for the private equity demo

The existing circuit already proves the pattern. To demo the `FUND-A /
accredited investor` use case specifically:

- Rename the policy scope in the issuer to `accredited_investor`.
- Deploy `CommitmentStore` and `Prover` with a `FUND-A` label.
- Demonstrate the issuer KYC flow → commitment → investor proof → on-chain
  verification in a single end-to-end script.

No new circuit required. The compliance rule (`only accredited investors can
hold this asset`) maps directly to the existing policy/scope model. The demo
is one integration test run.

---

## Risks and honest limits

*zk-assets* does not do everything:

- It does not certify the KYC process itself — the issuer is still trusted to
  run it correctly.
- It does not provide real-time revocation at scale — revocation is manual or
  via policy expiry (which is built in).
- It does not prevent the investor from transferring the proof to another
  wallet — the proof is bound to a wallet address, not a biometric.

These are known tradeoffs, not bugs. The trust boundary is explicit and minimal:
the issuer is trusted once, for one investor, for one policy. After that, the
math governs.

---

## Known objections — prepare these answers

**"How is this different from Polygon ID / Privado ID / Sismo?"**

Those systems require a credential registry and a DID/VC layer. An investor
needs an identity wallet, a credential issuer plugged into a standard, and
an on-chain registry of credential schemas. *zk-assets* requires none of
that: the issuer runs their existing KYC process, stores one number on-chain,
and the investor uses a standard EVM wallet. No new identity stack. No
vendor lock-in to a credential format. The issuer owns the trust model end
to end.

**"Your repo has months of commits — is this a hackathon project?"**

The core protocol is prior work. The hackathon deliverable is the private
equity demo: scoping the `accredited_investor` policy, packaging the
end-to-end flow, and validating it against a real institutional use case
(WeCan Group). Prior work + hackathon focus is a legitimate and common
pattern; be transparent about it.

**"Proof generation is slow — how does this work in practice?"**

Proof generation runs once per policy, per investor device. It is not on
the critical path of every trade — only of the initial eligibility
registration. After that, the commitment is on-chain and the issuer is no
longer involved. For the demo, use a pre-generated proof to show the
on-chain verification step without waiting on Barretenberg.

**"The issuer is still a trusted party — you have not eliminated trust."**

Correct, and the system is designed that way intentionally. The goal is not
to eliminate trust — it is to minimise and isolate it. The issuer is trusted
exactly once, for the eligibility decision they are already legally responsible
for. Everything after that (proof generation, on-chain verification) is
trustless. This is a better model than trusting an issuer on every trade,
which is what allow-lists require.

**"What stops an investor from sharing their proof with another wallet?"**

The proof is cryptographically bound to a specific wallet address (`msg.sender`
is injected by the `Prover` contract at verification time). The proof cannot
be replayed from a different wallet. A different wallet requires a new proof,
which requires a new commitment from the issuer.
