// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract RevertingContract {
  fallback() external payable {
    revert("RevertingContract: revert in fallback function");
  }
}
