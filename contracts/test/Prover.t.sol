// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";

import { CommitmentStore } from "../src/CommitmentStore.sol";
import { Prover } from "../src/Prover.sol";

import { PrimeFieldOrderProvider } from "./stubs/PrimeFieldOrderProvider.sol";
import { Verifier } from "./stubs/Verifier.sol";

import { Test } from "forge-std/Test.sol";

contract ProverTests is Test {
  address public customer;
  address public issuer;

  IPrimeFieldOrderProvider public pfop;
  Verifier public verifier;

  CommitmentStore public store;
  Prover public prover;

  uint256 constant COMMITMENT = 2;
  bytes public zkpStub;
  bytes32[] public publicInputsStub;

  function setUp() public {
    issuer = makeAddr("issuer");
    customer = makeAddr("customer");

    // NOTE: see ../../circuits/src/main.nr, function main arguments
    publicInputsStub.push(0);
    publicInputsStub.push(0);
    publicInputsStub.push(0);
    publicInputsStub.push(0);
    publicInputsStub.push(0);
    publicInputsStub.push(bytes32(COMMITMENT));

    pfop = new PrimeFieldOrderProvider();
    store = new CommitmentStore(pfop, issuer);
    verifier = new Verifier();
    prover = new Prover(verifier, store);
  }

  function test_prove_fails_ifCommitmentIsNotInTheStore() public {
    vm.expectRevert(Prover.InvalidCommitment.selector);
    prover.prove(zkpStub, publicInputsStub);
  }

  function test_prove_fails_forUnderlyingVerifierReturningFalse() public {
    vm.startPrank(issuer);
    store.commit(COMMITMENT);
    vm.stopPrank();

    verifier.makeVerifierReturnFalse();

    vm.expectRevert(Prover.InvalidProof.selector);
    prover.prove(zkpStub, publicInputsStub);
  }

  function test_prove_fails_forUnderlyingVerifierReverting() public {
    vm.startPrank(issuer);
    store.commit(COMMITMENT);
    vm.stopPrank();

    verifier.makeVerifierRevert();

    vm.expectRevert(Prover.InvalidProof.selector);
    prover.prove(zkpStub, publicInputsStub);
  }

  function test_prove_succeeds_forValidProofs() public {
    vm.startPrank(issuer);
    store.commit(COMMITMENT);
    vm.stopPrank();

    assertTrue(prover.prove(zkpStub, publicInputsStub));
  }
}
