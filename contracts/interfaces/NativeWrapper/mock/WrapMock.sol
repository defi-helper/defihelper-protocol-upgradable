// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "../../../mock/ERC20Mock.sol";
import "../IWrap.sol";

contract WrapMock is IWrap, ERC20Mock {
  constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply
  ) ERC20Mock(name, symbol, initialSupply) {}

  function deposit() external payable override {
    _mint(msg.sender, msg.value);
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint256 wad) external override {
    _burn(msg.sender, wad);
    // solhint-disable-next-line avoid-low-level-calls
    (bool transferred, ) = payable(msg.sender).call{value: wad}("");
    require(transferred, "WrapMock::withdraw: trasnfer failed");
    emit Withdrawal(msg.sender, wad);
  }
}
