// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This ERC20 token is only used for testing purposes in test net
contract ThankYouCoin is ERC20 {
  address public owner;

  constructor(uint256 initialSupply) ERC20("ThankYouCoin", "TYC") {
    owner = msg.sender;
    _mint(msg.sender, initialSupply * 10 ** uint256(decimals()));
  }

  function mint(address to, uint256 amount) public  {
    require(msg.sender == owner, "Only owner can mint");
    _mint(to, amount);
  }

  function decimals() public view virtual override returns (uint8) {
    return 6;
  }
}
