// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../IWrap.sol";

contract WrapMock is IWrap, ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function deposit() override external payable {
    _mint(msg.sender, msg.value);
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint256 wad) override external {
    _burn(msg.sender, wad);
    // solhint-disable-next-line avoid-low-level-calls
    (bool transferred, ) = payable(msg.sender).call{value: wad}("");
    require(transferred, "WrapMock::withdraw: trasnfer failed");
    emit Withdrawal(msg.sender, wad);
  }
}
