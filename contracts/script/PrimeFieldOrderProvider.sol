// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";

import { P as PRIME_FIELD_ORDER } from "@circuits/target/Verifier.sol";

contract PrimeFieldOrderProvider is IPrimeFieldOrderProvider {
  function P() external pure returns (uint256) {
    return PRIME_FIELD_ORDER;
  }

  // NOTE: to exclude of coverage report
  function test() private pure { }
}
