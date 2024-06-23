// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

error TransactionLogger__MininumTransferAmountNotMet();
error TransactionLogger__InsufficientOrExcessFunds();
error TransactionLogger__MismatchedReceiversAndAmounts();
error TransactionLogger__TransactionFailed();

contract TransactionLogger {
  // Event to log the sent transaction
  event TransactionSent(
    address indexed sender,
    address indexed receiver,
    uint256 amount,
    uint256 timestamp
  );

  uint256 public constant MINIMUM_AMOUNT = 0.0005 ether;

  function _makeTransaction(address sender, address receiver, uint256 amount) internal {
    (bool sent, ) = receiver.call{value: amount}("");
    if (!sent) {
      revert TransactionLogger__TransactionFailed();
    }
    emit TransactionSent(sender, receiver, amount, block.timestamp);
  }

  // Function to send funds and record the transaction via an event
  function sendFunds(address payable receiver) public payable {
    if (msg.value <= MINIMUM_AMOUNT) {
      revert TransactionLogger__MininumTransferAmountNotMet();
    }
    _makeTransaction(msg.sender, receiver, msg.value);
  }

  function sendMultiFunds(
    address payable[] memory receivers,
    uint256[] memory amounts
  ) public payable {
    if (receivers.length != amounts.length) {
      revert TransactionLogger__MismatchedReceiversAndAmounts();
    }

    uint256 totalAmount = 0;
    for (uint256 i = 0; i < amounts.length; i++) {
      if (amounts[i] <= MINIMUM_AMOUNT) {
        revert TransactionLogger__MininumTransferAmountNotMet();
      }
      totalAmount += amounts[i];
    }

    if (msg.value != totalAmount) {
      revert TransactionLogger__InsufficientOrExcessFunds();
    }

    for (uint256 i = 0; i < receivers.length; i++) {
      _makeTransaction(msg.sender, receivers[i], amounts[i]);
    }
  }
}
