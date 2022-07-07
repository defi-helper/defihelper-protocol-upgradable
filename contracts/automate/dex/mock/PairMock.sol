// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../IPair.sol";

contract PairMock is IPair, ERC20 {
  address public override token0;

  address public override token1;

  constructor(address _token0, address _token1) ERC20("Pair", "P") {
    token0 = _token0;
    token1 = _token1;
    _mint(msg.sender, 100e18);
  }
}
