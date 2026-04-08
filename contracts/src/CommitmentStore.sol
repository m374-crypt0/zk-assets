// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IPrimeFieldOrderProvider } from "./interfaces/IPrimeFieldOrderProvider.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract CommitmentStore is Ownable {
  error InvalidZeroCommitment();
  error DuplicateCommitment();
  error CommitmentPrimeFieldOrderOverflow();

  mapping(uint256 => bool) public commitments;
  IPrimeFieldOrderProvider public primeFieldOrderProvider;

  event CommitmentStored(uint256 commitment_);
  event CommitmentRevoked(uint256 commitment_);

  constructor(IPrimeFieldOrderProvider pfop_, address owner_) Ownable(owner_) {
    primeFieldOrderProvider = pfop_;
  }

  function commit(uint256 commitment_) external onlyOwner {
    if (commitment_ == 0) revert InvalidZeroCommitment();
    if (commitments[commitment_]) revert DuplicateCommitment();
    if (commitment_ > primeFieldOrderProvider.P()) revert CommitmentPrimeFieldOrderOverflow();

    commitments[commitment_] = true;

    emit CommitmentStored(commitment_);
  }

  function revoke(uint256 commitment_) external onlyOwner {
    delete commitments[commitment_];

    emit CommitmentRevoked(commitment_);
  }
}
