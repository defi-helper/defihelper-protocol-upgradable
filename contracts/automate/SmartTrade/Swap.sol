// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../dex/IRouter.sol";

contract SmartTradeSwap is Ownable {
  using SafeERC20 for IERC20;

  struct Order {
    uint256 id;
    address[] path;
    uint256 amountIn;
    uint256 amountOutMin;
  }

  IRouter public exchange;

  mapping(uint256 => Order) _orders;

  constructor(address _exchange) {
    exchange = IRouter(_exchange);
  }

  function getOrder(uint256 id) external view returns (Order memory) {
    return _orders[id];
  }

  function swap(uint256 id) external {}
}
