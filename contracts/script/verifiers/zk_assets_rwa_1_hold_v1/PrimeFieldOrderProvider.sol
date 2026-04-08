// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { P as PRIME_FIELD_ORDER } from "@circuits/target/zk_assets_rwa_1_hold_v1_verifier.sol";
import { IPrimeFieldOrderProvider } from "src/interfaces/IPrimeFieldOrderProvider.sol";

contract PrimeFieldOrderProvider is IPrimeFieldOrderProvider {
  function P() external pure returns (uint256) {
    return PRIME_FIELD_ORDER;
  }

  // NOTE: to exclude of coverage report
  function test() private pure { }
}
