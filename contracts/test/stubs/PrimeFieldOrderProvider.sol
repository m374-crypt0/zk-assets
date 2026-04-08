// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IPrimeFieldOrderProvider } from "../../src/interfaces/IPrimeFieldOrderProvider.sol";

contract PrimeFieldOrderProvider is IPrimeFieldOrderProvider {
  function P() external pure returns (uint256) {
    return 2;
  }
}
