// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { Script } from "forge-std/Script.sol";

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";
import { IVerifier } from "src/interfaces/IVerifier.sol";

import { CommitmentStore } from "../src/CommitmentStore.sol";
import { Prover } from "src/Prover.sol";

import {
  PrimeFieldOrderProvider as ZkAssetsRwa1HoldV1PFOP
} from "./verifiers/zk_assets_rwa_1_hold_v1/PrimeFieldOrderProvider.sol";
import { Verifier as ZkAssetsRwa1HoldV1Verifier } from "./verifiers/zk_assets_rwa_1_hold_v1/Verifier.sol";

contract XRPLDeployScript is Script {
  IPrimeFieldOrderProvider pfop;
  CommitmentStore commitmentStore;
  IVerifier verifier;
  Prover prover;

  function setUp() public { }

  function run() public {
    uint256 deployerKey = vm.envUint("PRIVATE_KEY");
    address deployer = vm.addr(deployerKey);

    vm.startBroadcast(deployerKey);

    pfop = new ZkAssetsRwa1HoldV1PFOP();
    commitmentStore = new CommitmentStore(pfop, deployer);
    verifier = new ZkAssetsRwa1HoldV1Verifier();
    prover = new Prover(verifier, commitmentStore);

    vm.stopBroadcast();
  }

  // NOTE: To mute uncovered items in coverage reports
  function test() private { }
}
