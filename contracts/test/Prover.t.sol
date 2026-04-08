// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";

import { CommitmentStore } from "../src/CommitmentStore.sol";
import { Prover, PublicInputs } from "../src/Prover.sol";

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
  PublicInputs public publicInputsStub;

  function setUp() public {
    issuer = makeAddr("issuer");
    customer = makeAddr("customer");

    publicInputsStub.policyId = 0;
    publicInputsStub.policyScopeId = 0;
    publicInputsStub.validUntil = bytes32(vm.getBlockTimestamp());
    publicInputsStub.commitment = bytes32(COMMITMENT);

    pfop = new PrimeFieldOrderProvider();
    store = new CommitmentStore(pfop, issuer);
    verifier = new Verifier();
    prover = new Prover(verifier, store);
  }

  function test_prove_fails_ifCommitmentIsNotInTheStore() public {
    vm.expectRevert(Prover.InvalidCommitment.selector);
    prover.prove(zkpStub, publicInputsStub);
  }

  function test_prove_fails_ifValidityIsExpired() public {
    vm.startPrank(issuer);
    store.commit(COMMITMENT);
    vm.stopPrank();

    // NOTE: publicInputsStub has set validUntil to current block timestamp
    skip(1);

    vm.expectRevert(Prover.ValidityExpired.selector);
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
