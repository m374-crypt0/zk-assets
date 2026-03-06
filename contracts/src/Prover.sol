// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import { IVerifier } from "./interfaces/IVerifier.sol";

import { CommitmentStore } from "./CommitmentStore.sol";

contract Prover {
  error InvalidCommitment();
  error InvalidProof();

  CommitmentStore store;
  IVerifier verifier;

  constructor(IVerifier verifier_, CommitmentStore store_) {
    store = store_;
    verifier = verifier_;
  }

  function prove(bytes calldata zkp_, bytes32[] calldata publicInputs_) external view returns (bool) {
    // NOTE: see ../../circuits/src/main.nr, function main arguments
    uint256 commitment = uint256(publicInputs_[6]);

    require(store.commitments(commitment), InvalidCommitment());
    require(verifier.verify(zkp_, publicInputs_), InvalidProof());

    return true;
  }
}
