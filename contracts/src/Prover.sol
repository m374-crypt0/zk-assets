// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import { IVerifier } from "./interfaces/IVerifier.sol";

import { CommitmentStore } from "./CommitmentStore.sol";

struct PublicInputs {
  bytes32 policyId;
  bytes32 policyScopeId;
  bytes32[] policyScopeParameters;
  bytes32 _unused1;
  bytes32 _unused2;
  bytes32 commitment;
}

contract Prover {
  error InvalidCommitment();
  error InvalidProof();

  CommitmentStore store;
  IVerifier verifier;

  constructor(IVerifier verifier_, CommitmentStore store_) {
    store = store_;
    verifier = verifier_;
  }

  function prove(bytes calldata zkp_, PublicInputs calldata publicInputs_) external view returns (bool) {
    // NOTE: see ../../circuits/src/main.nr, function main arguments
    uint256 commitment = uint256(publicInputs_.commitment);

    require(store.commitments(commitment), InvalidCommitment());

    bytes32[] memory verifierInputs = new bytes32[](6);
    verifierInputs[0] = publicInputs_.policyId;
    verifierInputs[1] = publicInputs_.policyScopeId;
    verifierInputs[2] = publicInputs_.policyScopeParameters[0];
    verifierInputs[5] = publicInputs_.commitment;

    try verifier.verify(zkp_, verifierInputs) returns (bool result) {
      require(result, InvalidProof());
      return result;
    } catch (bytes memory) {
      revert InvalidProof();
    }
  }
}
