// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error TransactionLogger__MininumTransferAmountNotMet();
error TransactionLogger__MismatchedReceiversAndAmounts();
error TransactionLogger__TransactionFailed();
error TransactionLogger__InsufficientAllowance();

contract TransactionLogger {
  // Event to log the sent transaction
  event TransactionSent(
    address indexed sender,
    address indexed receiver,
    uint256 amount,
    uint256 timestamp
  );

  IERC20 private erc20Token;
  uint256 public mininumAmount;

  constructor(address _usdtTokenAddress, uint256 _mininumAmount) {
    erc20Token = IERC20(_usdtTokenAddress);
    mininumAmount = _mininumAmount;
  }

  function _makeTransaction(address sender, address receiver, uint256 amount) internal {
    uint256 allowance = erc20Token.allowance(sender, address(this));
    if (allowance < amount) {
      revert TransactionLogger__InsufficientAllowance();
    }
    
    bool sent = erc20Token.transferFrom(sender, receiver, amount);
    if (!sent) {
      revert TransactionLogger__TransactionFailed();
    }
    emit TransactionSent(sender, receiver, amount, block.timestamp);
  }

  // Function to send funds and record the transaction via an event
  function sendFunds(address receiver, uint256 amount) public payable {
    if (amount < mininumAmount) {
      revert TransactionLogger__MininumTransferAmountNotMet();
    }
    _makeTransaction(msg.sender, receiver, amount);
  }

  function sendMultiFunds(
    address [] memory receivers,
    uint256[] memory amounts
  ) public payable {
    if (receivers.length != amounts.length) {
      revert TransactionLogger__MismatchedReceiversAndAmounts();
    }

    for (uint256 i = 0; i < amounts.length; i++) {
      if (amounts[i] < mininumAmount) {
        revert TransactionLogger__MininumTransferAmountNotMet();
      }
    }

    for (uint256 i = 0; i < receivers.length; i++) {
      _makeTransaction(msg.sender, receivers[i], amounts[i]);
    }
  }
}
