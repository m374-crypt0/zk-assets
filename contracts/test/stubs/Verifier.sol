// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import { IVerifier } from "../../src/interfaces/IVerifier.sol";

contract Verifier is IVerifier {
  bool private verifyShouldSucceeds_ = true;
  bool private verifyShouldRevert_ = false;

  function makeVerifierReturnFalse() external {
    verifyShouldSucceeds_ = false;
  }

  function makeVerifierRevert() external {
    verifyShouldRevert_ = true;
  }

  function verify(bytes calldata, bytes32[] calldata) external view returns (bool) {
    require(!verifyShouldRevert_);
    return verifyShouldSucceeds_;
  }
}
