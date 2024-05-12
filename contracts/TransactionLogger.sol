// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

error TransactionLogger__InsufficientFunds();
error TransactionLogger__sendFundsFailed();

contract TransactionLogger {
  // Event to log the sent transaction
  event TransactionSent(
    address indexed sender,
    address indexed receiver,
    uint256 amount,
    uint256 indexed timestamp
  );

  // Function to send funds and record the transaction via an event
  function sendFunds(address payable receiver) public payable {
    if (msg.value <= 0) {
      revert TransactionLogger__InsufficientFunds();
    }
    (bool sent, ) = receiver.call{value: msg.value}("");
    if (!sent) {
      revert TransactionLogger__sendFundsFailed();
    }
    emit TransactionSent(msg.sender, receiver, msg.value, block.timestamp);
  }
}
