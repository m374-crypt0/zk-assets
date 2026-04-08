// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { HonkVerifier } from "@circuits/target/zk_assets_rwa_1_hold_v1_verifier.sol";
import { IVerifier } from "src/interfaces/IVerifier.sol";

contract Verifier is IVerifier {
  constructor() {
    honkVerifier = new HonkVerifier();
  }

  function verify(bytes calldata proof_, bytes32[] calldata publicInputs_) external view returns (bool) {
    return honkVerifier.verify(proof_, publicInputs_);
  }

  HonkVerifier private honkVerifier;

  // NOTE: To mute uncovered items in coverage reports
  function test() private { }
}
