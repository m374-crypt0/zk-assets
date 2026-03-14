// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import { IPrimeFieldOrderProvider } from "../src/interfaces/IPrimeFieldOrderProvider.sol";

import { CommitmentStore } from "../src/CommitmentStore.sol";

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { PrimeFieldOrderProvider } from "./stubs/PrimeFieldOrderProvider.sol";

import { Test } from "forge-std/Test.sol";

contract CommitmentStoreTests is Test {
  address private issuer;
  CommitmentStore store;
  IPrimeFieldOrderProvider pfop;

  function setUp() public {
    issuer = makeAddr("issuer");
    pfop = new PrimeFieldOrderProvider();
    store = new CommitmentStore(pfop, issuer);
  }

  function test_deploy_fails_forZeroAdressOwner() public {
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));

    new CommitmentStore(pfop, address(0));
  }

  function test_commit_fails_storingZeroCommitment() public {
    vm.startPrank(issuer);

    vm.expectRevert(CommitmentStore.InvalidZeroCommitment.selector);
    store.commit(0);

    vm.stopPrank();
  }

  function test_commit_fails_whenNotCalledByOwner() public {
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
    store.commit(1);
  }

  function test_commit_emit_whenCommitmentIsStored() public {
    vm.startPrank(issuer);

    vm.expectEmit();
    emit CommitmentStore.CommitmentStored(1);
    store.commit(1);

    vm.stopPrank();
  }

  function test_commit_fails_atStoringSameCommitmentTwice() public {
    vm.startPrank(issuer);

    store.commit(1);

    vm.expectRevert(CommitmentStore.DuplicateCommitment.selector);
    store.commit(1);

    vm.stopPrank();
  }

  // NOTE: Commitments are also verified and computed in the circuit as Field
  // type. Thus we must care not to overflow when dealing with primitive
  // uint256 type that may hold values greater than the prime field order.
  function test_commit_fails_atStoringCommitmentGreaterThanPrimeFieldOrder() public {
    uint256 pfopOverflow = pfop.P() + 1;

    vm.startPrank(issuer);

    vm.expectRevert(CommitmentStore.CommitmentPrimeFieldOrderOverflow.selector);
    store.commit(pfopOverflow);

    vm.stopPrank();
  }

  function test_revoke_fails_ifNotCalledByOwner() public {
    vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
    store.revoke(0);
  }

  function test_revoke_succeeds_andEmitAtCommitmentRevocation() public {
    vm.startPrank(issuer);

    store.commit(1);
    store.commit(2);

    vm.expectEmit();
    emit CommitmentStore.CommitmentRevoked(2);
    store.revoke(2);

    assertFalse(store.commitments(2));
    assertTrue(store.commitments(1));

    vm.stopPrank();
  }
}
