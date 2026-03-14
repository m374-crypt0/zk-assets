// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

import { Script } from "forge-std/Script.sol";

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";
import { IVerifier } from "src/interfaces/IVerifier.sol";

import { CommitmentStore } from "../src/CommitmentStore.sol";
import { PrimeFieldOrderProvider } from "./PrimeFieldOrderProvider.sol";
import { Verifier } from "./Verifier.sol";
import { Prover } from "src/Prover.sol";

contract LocalDeployScript is Script {
  address private sender;
  address private commitmentStoreOwner;
  address private proverDeployer;

  IPrimeFieldOrderProvider pfop;
  CommitmentStore commitmentStore;
  IVerifier verifier;
  Prover prover;

  function setUp() public {
    sender = vm.envAddress("TEST_SENDER_ADDRESS");
    commitmentStoreOwner = vm.addr(uint256(vm.envBytes32("TEST_PRIVATE_KEY_01")));
    proverDeployer = vm.addr(uint256(vm.envBytes32("TEST_PRIVATE_KEY_02")));
  }

  function run() public {
    vm.startBroadcast(sender);

    pfop = new PrimeFieldOrderProvider();
    commitmentStore = new CommitmentStore(pfop, commitmentStoreOwner);

    vm.stopBroadcast();

    vm.startBroadcast(proverDeployer);

    verifier = new Verifier();
    prover = new Prover(verifier, commitmentStore);

    vm.stopBroadcast();
  }

  // NOTE: To mute uncovered items in coverage reports
  function test() private { }
}
