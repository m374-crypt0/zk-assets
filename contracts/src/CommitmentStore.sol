// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

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
    require(commitment_ != 0, InvalidZeroCommitment());
    require(commitments[commitment_] == false, DuplicateCommitment());
    require(commitment_ <= primeFieldOrderProvider.P(), CommitmentPrimeFieldOrderOverflow());

    commitments[commitment_] = true;

    emit CommitmentStored(commitment_);
  }

  function revoke(uint256 commitment_) external onlyOwner {
    delete commitments[commitment_];

    emit CommitmentRevoked(commitment_);
  }
}
