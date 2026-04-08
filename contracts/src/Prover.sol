// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IVerifier } from "./interfaces/IVerifier.sol";

import { CommitmentStore } from "./CommitmentStore.sol";

// TODO: Tie this prover to a specific policy scope, only parameters vary,
// do the same for circuits (packages)
struct PublicInputs {
  bytes32 policyId;
  bytes32 policyScopeId;
  bytes32 validUntil;
  bytes32 commitment;
}

contract Prover {
  error InvalidCommitment();
  error InvalidProof();
  error ValidityExpired();

  CommitmentStore store;
  IVerifier verifier;

  constructor(IVerifier verifier_, CommitmentStore store_) {
    store = store_;
    verifier = verifier_;
  }

  function prove(bytes calldata zkp_, PublicInputs calldata publicInputs_) external view returns (bool) {
    if (block.timestamp > uint256(publicInputs_.validUntil)) revert ValidityExpired();
    if (!store.commitments(uint256(publicInputs_.commitment))) revert InvalidCommitment();

    // NOTE: see ../../circuits/src/main.nr, function main arguments
    bytes32[] memory verifierInputs = new bytes32[](5);
    verifierInputs[0] = publicInputs_.policyId;
    verifierInputs[1] = publicInputs_.policyScopeId;
    verifierInputs[2] = publicInputs_.validUntil;
    verifierInputs[3] = bytes32(uint256(uint160(msg.sender)));
    verifierInputs[4] = publicInputs_.commitment;

    try verifier.verify(zkp_, verifierInputs) returns (bool result) {
      if (!result) revert InvalidProof();
      return result;
    } catch (bytes memory) {
      revert InvalidProof();
    }
  }
}
