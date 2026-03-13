// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import { IVerifier } from "../src/interfaces/IVerifier.sol";
import { HonkVerifier } from "@circuits/target/Verifier.sol";

contract Verifier is IVerifier {
  constructor() {
    honkVerifier = new HonkVerifier();
  }

  function verify(bytes calldata proof_, bytes32[] calldata publicInputs_) external view returns (bool) {
    return honkVerifier.verify(proof_, publicInputs_);
  }

  // NOTE: To mute uncovered items in coverage reports
  function test() private { }

  HonkVerifier private honkVerifier;
}
