// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
  function verify(bytes calldata proof_, bytes32[] calldata publicInputs_) external view returns (bool);
}
